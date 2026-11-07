import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { OrderService } from "@/lib/services/order-service";
import { PaymentService } from "@/lib/services/payment-service";
import { SimulatedPaymentProvider, simulatedEventSignature } from "@/lib/payments/simulation-provider";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getEarliestReadyDate } from "@/lib/domain/date-rules";
import { createSessionToken, verifySessionToken, revokeAdminSession } from "@/lib/auth/session";

vi.mock("server-only", () => ({}));
const cookie = vi.hoisted(() => ({ token: "" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: cookie.token }) }) }));

// Opt-in only against the explicitly provisioned disposable database.
describe.skipIf(!process.env.SECURITY_TEST_DATABASE_URL)("Deployment security with PostgreSQL", () => {
  const suffix = randomUUID();
  const owner = "a".repeat(64);
  const secret = "integration_fixture_simulation_secret_0123456789";
  let branchId: string;
  let productId: string;
  let userId: string;
  const provider = new SimulatedPaymentProvider("https://shop.example", secret);
  const service = new PaymentService(provider, { mode: "test", appUrl: "https://shop.example", providerName: "SIMULATION" });
  const payload = () => ({ customerName: "Security Test", customerEmail: "security@test.example", phonePrimary: "0771234567",
    branchId, productId, readyDate: getEarliestReadyDate(), selections: {}, idempotencyKey: `idem_${randomUUID()}` });
  beforeAll(async () => {
    if (process.env.DATABASE_URL !== process.env.SECURITY_TEST_DATABASE_URL) throw new Error("Test database mismatch");
    vi.stubEnv("AUTH_SECRET", "integration_fixture_auth_secret_0123456789");
    vi.stubEnv("PAYMENT_MODE", "test");
    const branch = await prisma.branch.create({ data: { code: `SEC-${suffix}`, name: "Security fixture", address: "Test" } }); branchId = branch.id;
    const product = await prisma.product.create({ data: { name: "Security fixture", slug: `security-${suffix}`, description: "Fixture", basePrice: 5000, published: true } }); productId = product.id;
    const user = await prisma.user.create({ data: { email: `security-${suffix}@test.example`, name: "Security fixture", role: "SUPER_ADMIN", passwordHash: "fixture-only" } }); userId = user.id;
  });
  afterAll(async () => {
    if (branchId) {
      await prisma.paymentEvent.deleteMany({ where: { order: { branchId } } });
      await prisma.paymentAttempt.deleteMany({ where: { order: { branchId } } });
      await prisma.order.deleteMany({ where: { branchId } });
    }
    if (productId) await prisma.product.delete({ where: { id: productId } });
    if (branchId) await prisma.branch.delete({ where: { id: branchId } });
    if (userId) await prisma.user.delete({ where: { id: userId } });
    vi.unstubAllEnvs();
  });
  it("serializes concurrent order retries and rejects another owner or changed input", async () => {
    const input = payload();
    const [first, second] = await Promise.all([OrderService.createPendingOrder(input, owner), OrderService.createPendingOrder(input, owner)]);
    expect(first.id).toBe(second.id);
    expect(await prisma.order.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
    await expect(OrderService.createPendingOrder(input, "b".repeat(64))).rejects.toThrow("does not match");
    await expect(OrderService.createPendingOrder({ ...input, customerName: "Different Buyer" }, owner)).rejects.toThrow("does not match");
  });
  it("returns only the persisted checkout when requests overlap", async () => {
    const order = await OrderService.createPendingOrder(payload(), owner);
    const access = { orderNumber: order.orderNumber, accessToken: order.accessToken };
    const results = await Promise.all([service.createCheckout(access), service.createCheckout(access)]);
    expect(results[0]).toEqual(results[1]);
    const attempts = await prisma.paymentAttempt.findMany({ where: { orderId: order.id } });
    expect(attempts).toHaveLength(1);
    expect(new URL(results[0].checkoutUrl!).searchParams.get("c")).toBe(attempts[0].providerCheckoutId);
  });
  it("enforces one atomic request budget across simultaneous calls", async () => {
    const outcomes = await Promise.allSettled(Array.from({ length: 12 }, () => enforceRateLimit("integration", suffix, 4, 3600)));
    expect(outcomes.filter(result => result.status === "fulfilled")).toHaveLength(4);
    expect(outcomes.filter(result => result.status === "rejected")).toHaveLength(8);
  });
  it("revokes existing admin tokens on disable, credential change, and logout", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    let token = await createSessionToken(user);
    expect(await verifySessionToken(token)).toMatchObject({ id: userId });
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    expect(await verifySessionToken(token)).toBeNull();
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    token = await createSessionToken(user);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: "changed-fixture" } });
    expect(await verifySessionToken(token)).toBeNull();
    token = await createSessionToken(user); cookie.token = token;
    await revokeAdminSession(); expect(await verifySessionToken(token)).toBeNull();
  });
  it("excludes simulated receipts from real revenue", async () => {
    const before = await OrderService.getAdminOrderStats();
    const order = await OrderService.createPendingOrder(payload(), owner);
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", orderStatus: "CONFIRMED" } });
    const after = await OrderService.getAdminOrderStats();
    expect(after.paidRevenue).toBe(before.paidRevenue);
    expect(after.paidCount).toBe(before.paidCount);
  });
  it("blocks stale checkout and records late funds for review without confirming fulfilment", async () => {
    const order = await OrderService.createPendingOrder(payload(), owner);
    const access = { orderNumber: order.orderNumber, accessToken: order.accessToken };
    await service.createCheckout(access);
    await prisma.order.update({ where: { id: order.id }, data: { createdAt: new Date(Date.now() - 25 * 3600000) } });
    await expect(service.createCheckout(access)).rejects.toThrow("expired");
    const attempt = await prisma.paymentAttempt.findFirstOrThrow({ where: { orderId: order.id } });
    const body = JSON.stringify({ object: "event", id: `evt_sim_${randomUUID()}`, type: "payment.succeeded", mode: "test",
      data: { checkoutId: attempt.providerCheckoutId, paymentId: attempt.providerPaymentId, reference: order.orderNumber,
        amountCents: Number(attempt.amountCents), currency: "LKR", paymentMode: "test", status: "succeeded", succeededAt: new Date().toISOString() } });
    await service.processWebhook(body, simulatedEventSignature(secret, body));
    const settled = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(settled).toMatchObject({ paymentStatus: "PAID", orderStatus: "PAYMENT_PENDING", paymentReviewRequired: true });
  });
});
