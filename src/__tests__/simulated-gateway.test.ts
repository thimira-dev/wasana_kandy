import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";

vi.mock("server-only", () => ({}));

const secret = "sim_unit_test_fixture_secret_0123456789abcdef";
const config = { provider: "simulation", mode: "test" as const, appUrl: "https://wasana.example", databaseProviderName: "SIMULATION" as const, simulationSecret: secret };

vi.mock("@/lib/payments/config", () => ({ getPaymentConfig: () => config }));

const checkoutId = "sim_ctxt_0f0e0d0c-0b0a-4908-8007-000000000006";
const paymentId = "sim_pay_0f0e0d0c-0b0a-4908-8007-000000000007";

const mockPrisma = vi.hoisted(() => ({ paymentAttempt: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  completeSimulatedCheckout,
  loadSimulatedCheckout,
  SimulatedSettledError,
} from "@/lib/payments/simulated-gateway";
import { simulatedCheckoutToken, SimulatedPaymentProvider } from "@/lib/payments/simulation-provider";

function attemptFixture(attemptOverrides: Record<string, unknown> = {}, orderOverrides: Record<string, unknown> = {}): { checks: string[]; order: Record<string, unknown>; [key: string]: unknown } {
  return {
    id: "attempt_1",
    provider: "SIMULATION",
    mode: "TEST",
    status: "OPEN",
    currency: "LKR",
    providerCheckoutId: checkoutId,
    providerPaymentId: paymentId,
    amountCents: BigInt(650000),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    failureMessage: null,
    succeededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderId: "order_test",
    ...attemptOverrides,
    order: {
      id: "order_test",
      orderNumber: "WB-EXAMPLE",
      orderStatus: "PAYMENT_PENDING",
      paymentStatus: "PENDING",
      total: new Prisma.Decimal("6500.00"),
      customerName: "Test Customer",
      ...orderOverrides,
    },
    checks: [],
  };
}

describe("simulated gateway trampoline", () => {
  afterEach(() => { vi.restoreAllMocks(); });
  beforeEach(() => {
    mockPrisma.paymentAttempt.findUnique.mockReset();
  });

  it("rejects malformed links and forged tokens", async () => {
    await expect(loadSimulatedCheckout({ checkoutId: "nope", token: "" })).rejects.toMatchObject({ status: 400 });
    await expect(loadSimulatedCheckout({
      checkoutId,
      token: createHmac("sha256", "attacker_secret").update("anything").digest("hex").slice(0, 32),
    })).rejects.toMatchObject({ status: 403 });
    mockPrisma.paymentAttempt.findUnique.mockResolvedValue(null);
    // Valid token but unknown checkout must not leak order state...
    await expect(loadSimulatedCheckout({ checkoutId, token: simulatedCheckoutToken(secret, checkoutId) })).rejects.toMatchObject({ status: 404 });
  });

  it("loads a live checkout with its order summary for the gateway page", async () => {
    mockPrisma.paymentAttempt.findUnique.mockImplementation(({ where }) => {
      return where.providerCheckoutId === checkoutId ? Promise.resolve(attemptFixture()) : Promise.resolve(null);
    });
    const view = await loadSimulatedCheckout({ checkoutId, token: simulatedCheckoutToken(secret, checkoutId) });
    expect(view.status).toBe("open");
    expect(view.orderNumber).toBe("WB-EXAMPLE");
    // Prisma Decimal strips trailing zeros — formatting is the display layer's concern
    expect(view.orderTotal).toBe("6500");
  });

  it("settles a successful decision through the signed webhook pipeline", async () => {
    mockPrisma.paymentAttempt.findUnique.mockResolvedValue(attemptFixture());
    const seen: Array<{ raw: string; signature: string | null }> = [];
    const processWebhook = async (raw: string, signature: string | null) => { seen.push({ raw, signature }); };
    const result = await completeSimulatedCheckout(
      { checkoutId, token: simulatedCheckoutToken(secret, checkoutId), decision: "succeed" },
      processWebhook,
    );
    expect(result.orderNumber).toBe("WB-EXAMPLE"); expect(result.decision).toBe("succeed");
    const raw = seen[0].raw;
    const parsed = JSON.parse(raw);
    expect(parsed).toMatchObject({
      type: "payment.succeeded", mode: "test",
      data: { checkoutId, paymentId, reference: "WB-EXAMPLE", amountCents: 650000, currency: "LKR", paymentMode: "test", status: "succeeded" },
    });
    // The fabricated event must pass simulated signature verification, as a real gateway event would
    const verifier = new SimulatedPaymentProvider("https://wasana.example", secret);
    const event = verifier.verifyWebhook(raw, seen[0].signature);
    expect(event.type).toBe("payment.succeeded");
  });

  it("refuses decisions once an outcome exists instead of double-charging", async () => {
    mockPrisma.paymentAttempt.findUnique.mockResolvedValue(
      attemptFixture({}, { paymentStatus: "PAID" }),
    );
    await expect(loadSimulatedCheckout({ checkoutId, token: simulatedCheckoutToken(secret, checkoutId) }))
      .rejects.toBeInstanceOf(SimulatedSettledError);
    await expect(completeSimulatedCheckout(
      { checkoutId, token: simulatedCheckoutToken(secret, checkoutId), decision: "succeed" },
      vi.fn(),
    )).rejects.toBeInstanceOf(SimulatedSettledError);
  });

  it("refuses recording outcomes for cancelled orders and expired sessions", async () => {
    mockPrisma.paymentAttempt.findUnique.mockResolvedValue(
      attemptFixture({}, { orderStatus: "CANCELLED" }),
    );
    await expect(completeSimulatedCheckout(
      { checkoutId, token: simulatedCheckoutToken(secret, checkoutId), decision: "fail" },
      vi.fn(),
    )).rejects.toBeInstanceOf(SimulatedSettledError);
    mockPrisma.paymentAttempt.findUnique.mockResolvedValue(
      attemptFixture({ status: "EXPIRED" }),
    );
    await expect(completeSimulatedCheckout(
      { checkoutId, token: simulatedCheckoutToken(secret, checkoutId), decision: "succeed" },
      vi.fn(),
    )).rejects.toMatchObject({ status: 409 });
  });
});
