import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient, type PaymentAttempt, type PaymentEvent as StoredEvent } from "@prisma/client";
import { PaymentService } from "@/lib/services/payment-service";
import { orderTotalToCents } from "@/lib/payments/money";
import type { PaymentEvent, PaymentProvider } from "@/lib/payments/payment-provider";
import { OrderService } from "@/lib/services/order-service";
import { prisma } from "@/lib/prisma";
import { getEarliestReadyDate } from "@/lib/domain/date-rules";
import { validateCustomerSelections } from "@/lib/domain/validation";
vi.mock("server-only", () => ({}));

// In-memory service boundary: never connects to a database or payment network.
function fixture() {
  const attempts: PaymentAttempt[] = [];
  const events: Partial<StoredEvent>[] = [];
  const order = { id: "order_test", orderNumber: "WB-20261028-ABCD", accessToken: "browser_fixture_token",
    orderStatus: "PAYMENT_PENDING", paymentStatus: "PENDING", total: new Prisma.Decimal("6500.00"),
    customerName: "Test Customer", customerEmail: "test@example.com", phonePrimary: "+94771234567",
    readyDate: new Date("2026-11-10"), branch: { name: "Test branch", address: "Kandy" }, paidAt: null as Date | null };
  const access = { orderNumber: order.orderNumber, accessToken: order.accessToken };
  let unsupported = false;
  const db = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
    order: {
      findFirst: vi.fn(async ({ where }) => where.orderNumber === order.orderNumber && where.accessToken === order.accessToken ? { ...order, paymentAttempts: attempts.slice(-1).reverse() } : null),
      findUnique: vi.fn(async ({ where }) => where.orderNumber === order.orderNumber ? order : null),
      findUniqueOrThrow: vi.fn(async () => order),
      update: vi.fn(async ({ data }) => Object.assign(order, data)),
      create: vi.fn(),
    },
    orderItem: { findFirst: vi.fn(async () => unsupported ? { id: "unsupported" } : null) },
    paymentAttempt: {
      create: vi.fn(async ({ data }) => {
        const attempt = { id: `attempt_${attempts.length + 1}`, provider: "SIMULATION", currency: "LKR", status: "CREATING", providerCheckoutId: null,
          providerPaymentId: null, checkoutUrl: null, expiresAt: null, failureMessage: null, succeededAt: null, createdAt: new Date(), updatedAt: new Date(), ...data } as PaymentAttempt;
        attempts.push(attempt); return attempt;
      }),
      findUnique: vi.fn(async ({ where }) => attempts.find(a => where.providerCheckoutId ? a.providerCheckoutId === where.providerCheckoutId : a.id === where.id) ?? null),
      findUniqueOrThrow: vi.fn(async ({ where }) => attempts.find(a => a.id === where.id)!),
      findFirst: vi.fn(async ({ where }) => attempts.filter(a => (!where.status || a.status === where.status) && (!where.orderId || a.orderId === where.orderId) && (!where.mode || a.mode === where.mode)).at(-1) ?? null),
      update: vi.fn(async ({ where, data }) => Object.assign(attempts.find(a => a.id === where.id)!, data)),
      updateMany: vi.fn(async ({ where, data }) => {
        const a = attempts.find(a => a.id === where.id && a.status === where.status);
        if (a) Object.assign(a, data); return { count: a ? 1 : 0 };
      }),
    },
    paymentEvent: {
      findUnique: vi.fn(async ({ where }) => events.find(e => e.providerEventId === where.provider_providerEventId.providerEventId) ?? null),
      create: vi.fn(async ({ data }) => { events.push(data); return data; }),
    },
  };
  const provider: PaymentProvider = {
    createCheckout: vi.fn(async () => ({ id: `sim_ctxt_${attempts.at(-1)!.id}`, paymentId: `sim_pay_${attempts.at(-1)!.id}`,
      mode: "test" as const, status: "open", url: "https://wasana.example/checkout/simulate", expiresAt: new Date(Date.now() + 3600000).toISOString() })),
    verifyWebhook: vi.fn(raw => JSON.parse(raw)),
  };
  const service = new PaymentService(provider, { mode: "test", appUrl: "https://wasana.example", providerName: "SIMULATION" }, db as unknown as PrismaClient);
  const success = (changes: Partial<PaymentEvent> = {}): PaymentEvent => ({ id: "evt_success", type: "payment.succeeded", mode: "test", paymentMode: "test",
    paymentStatus: "succeeded", checkoutId: attempts[0]?.providerCheckoutId ?? "chk_missing", paymentId: attempts[0]?.providerPaymentId ?? "pay_missing",
    reference: order.orderNumber, amountCents: 650000, currency: "LKR", succeededAt: new Date().toISOString(), ...changes });
  const deliver = (event: PaymentEvent) => service.processWebhook(JSON.stringify(event), "fixture_signature");
  return { service, provider, db, order, access, attempts, events, success, deliver, unsupported: () => { unsupported = true; } };
}
beforeEach(() => vi.restoreAllMocks());
describe("exact persisted money", () => {
  it.each([["6500.00", 650000], ["1499.50", 149950], ["0.01", 1], ["9999999999.99", 999999999999], ["3500", 350000]])("converts %s", (amount, cents) => expect(orderTotalToCents(new Prisma.Decimal(amount))).toBe(cents));
  it.each(["-1", "0", "NaN", "1.001", "1e3", "9007199254740992"])("rejects %s", amount => expect(() => orderTotalToCents(amount)).toThrow());
});
describe("payment creation and access", () => {
  it("uses persisted total and no token in return URLs", async () => {
    const f = fixture(); await f.service.createCheckout(f.access);
    const [input, key] = vi.mocked(f.provider.createCheckout).mock.calls[0];
    expect(input.amountCents).toBe(650000); expect(input.reference).toBe(f.order.orderNumber);
    expect(input.successUrl).not.toContain(f.access.accessToken); expect(input.cancelUrl).not.toContain(f.access.accessToken);
    expect(key).toMatch(/^[A-Za-z0-9:._-]{8,255}$/);
    expect(f.db.$queryRaw).toHaveBeenCalled();
  });
  it("rejects browser amount fields rather than accepting them", async () => {
    const f = fixture(); await expect(f.service.createCheckout({ ...f.access, amount: 1 })).rejects.toThrow("Invalid order access");
    expect(f.provider.createCheckout).not.toHaveBeenCalled();
  });
  it("reuses unexpired open checkout", async () => {
    const f = fixture(); const first = await f.service.createCheckout(f.access); expect(await f.service.createCheckout(f.access)).toEqual(first);
    expect(f.provider.createCheckout).toHaveBeenCalledTimes(1); expect(f.attempts).toHaveLength(1);
  });
  it("retries an ambiguous timeout with the same attempt/key", async () => {
    const f = fixture(); vi.mocked(f.provider.createCheckout).mockRejectedValueOnce(new Error("timeout"));
    await expect(f.service.createCheckout(f.access)).rejects.toThrow("Unable to start payment");
    await f.service.createCheckout(f.access);
    expect(vi.mocked(f.provider.createCheckout).mock.calls[0][1]).toBe(vi.mocked(f.provider.createCheckout).mock.calls[1][1]);
    expect(f.attempts).toHaveLength(1); expect(f.db.order.create).not.toHaveBeenCalled();
  });
  it("blocks ambiguous retries after idempotency retention", async () => {
    const f = fixture(); vi.mocked(f.provider.createCheckout).mockRejectedValueOnce(new Error("timeout"));
    await expect(f.service.createCheckout(f.access)).rejects.toThrow(); f.attempts[0].createdAt = new Date(Date.now() - 86400000);
    await expect(f.service.createCheckout(f.access)).rejects.toThrow("review"); expect(f.provider.createCheckout).toHaveBeenCalledTimes(1);
  });
  it("refuses incomplete or amount-inconsistent open attempts instead of creating duplicates", async () => {
    const f = fixture(); await f.service.createCheckout(f.access); f.attempts[0].expiresAt = null;
    await expect(f.service.createCheckout(f.access)).rejects.toThrow("review");
    f.attempts[0].expiresAt = new Date(Date.now() + 60000); f.order.total = new Prisma.Decimal("7000");
    await expect(f.service.createCheckout(f.access)).rejects.toThrow("review"); expect(f.provider.createCheckout).toHaveBeenCalledTimes(1);
  });
  it("does not start another checkout for a paid or cancelled order", async () => {
    const f = fixture(); f.order.paymentStatus = "PAID"; expect(await f.service.createCheckout(f.access)).toEqual({ alreadyPaid: true });
    f.order.paymentStatus = "PENDING"; f.order.orderStatus = "CANCELLED"; await expect(f.service.createCheckout(f.access)).rejects.toThrow();
    expect(f.provider.createCheckout).not.toHaveBeenCalled();
  });
  it.each(["createCheckout", "getStatus"] as const)("%s rejects wrong token", async method => {
    const f = fixture(); await expect(f.service[method]({ ...f.access, accessToken: "wrong" })).rejects.toMatchObject({ status: 403 });
    expect(f.provider.createCheckout).not.toHaveBeenCalled();
  });
  it("status returns only safe fields", async () => {
    const f = fixture(); await f.service.createCheckout(f.access); const status = await f.service.getStatus(f.access);
    expect(status.total).toBe("6500"); expect(status).not.toHaveProperty("accessToken"); expect(status.latestPaymentAttempt).not.toHaveProperty("checkoutUrl");
  });
  it("rejects legacy orders with unsupported customization configuration", async () => {
    const f = fixture(); f.unsupported(); await expect(f.service.createCheckout(f.access)).rejects.toThrow("cannot currently be paid"); expect(f.provider.createCheckout).not.toHaveBeenCalled();
  });
});
describe("verified event state transitions", () => {
  it("marks paid/confirmed exactly once for duplicate success", async () => {
    const f = fixture(); await f.service.createCheckout(f.access); const event = f.success(); await f.deliver(event); await f.deliver(event);
    expect(f.order).toMatchObject({ paymentStatus: "PAID", orderStatus: "CONFIRMED", paidAt: expect.any(Date) });
    expect(f.attempts[0].status).toBe("SUCCEEDED"); expect(f.events).toHaveLength(1); expect(f.db.order.update).toHaveBeenCalledTimes(2);
  });
  it("invalid signature changes no state", async () => {
    const f = fixture(); vi.mocked(f.provider.verifyWebhook).mockImplementation(() => { throw new Error("bad signature"); });
    await expect(f.deliver(f.success())).rejects.toMatchObject({ status: 400 }); expect(f.db.$transaction).not.toHaveBeenCalled(); expect(f.events).toHaveLength(0);
  });
  it.each([
    { amountCents: 1 }, { currency: "USD" }, { reference: "WB-WRONG" }, { mode: "live" },
    { paymentMode: "live" }, { paymentId: "pay_wrong" }, { paymentStatus: "processing" },
  ])("durably rejects immutable mismatch %j", async mismatch => {
    const f = fixture(); await f.service.createCheckout(f.access); const event = f.success(mismatch); await f.deliver(event); await f.deliver(event);
    expect(f.order.paymentStatus).toBe("PENDING"); expect(f.events).toHaveLength(1); expect(f.events[0].result).toBe("REJECTED");
  });
  it("rejects success for a cancelled order", async () => {
    const f = fixture(); await f.service.createCheckout(f.access); f.order.orderStatus = "CANCELLED"; await f.deliver(f.success());
    expect(f.order.paymentStatus).toBe("PENDING"); expect(f.events[0].result).toBe("REJECTED");
  });
  it.each(["payment.failed", "checkout.expired"])("%s cannot downgrade paid", async type => {
    const f = fixture(); await f.service.createCheckout(f.access); await f.deliver(f.success());
    await f.deliver(f.success({ id: "evt_late", type, paymentStatus: "failed" }));
    expect(f.order.paymentStatus).toBe("PAID"); expect(f.attempts[0].status).toBe("SUCCEEDED"); expect(f.events[1].result).toBe("IGNORED");
  });
  it("late success after failure confirms the order", async () => {
    const f = fixture(); await f.service.createCheckout(f.access); await f.deliver(f.success({ id: "evt_failed", type: "payment.failed", paymentStatus: "failed" }));
    expect(f.order.paymentStatus).toBe("FAILED"); await f.deliver(f.success()); expect(f.order.paymentStatus).toBe("PAID");
  });
  it.each(["payment.failed", "checkout.expired"])("%s permits fresh attempt without second order", async type => {
    const f = fixture(); await f.service.createCheckout(f.access); await f.deliver(f.success({ type, paymentStatus: "failed" }));
    await f.service.createCheckout(f.access); expect(f.attempts).toHaveLength(2); expect(f.order.paymentStatus).toBe("PENDING"); expect(f.db.order.create).not.toHaveBeenCalled();
    expect(vi.mocked(f.provider.createCheckout).mock.calls[0][1]).not.toBe(vi.mocked(f.provider.createCheckout).mock.calls[1][1]);
  });
  it("expiry does not erase a failure and older failures do not mask new attempts", async () => {
    const f = fixture(); await f.service.createCheckout(f.access); const failed = f.success({ id: "evt_fail", type: "payment.failed", paymentStatus: "failed" });
    await f.deliver(failed); await f.deliver(f.success({ id: "evt_expiry", type: "checkout.expired" })); expect(f.attempts[0].status).toBe("FAILED");
    await f.service.createCheckout(f.access); await f.deliver({ ...failed, id: "evt_old_failure" }); expect(f.order.paymentStatus).toBe("PENDING");
  });
  it("ignores valid unrelated/dashboard events", async () => {
    const f = fixture(); await f.deliver({ id: "evt_ping", type: "test.ping", mode: "test" }); expect(f.events[0].result).toBe("IGNORED");
  });
  it("returns retryable error if a webhook races checkout persistence", async () => {
    const f = fixture(); vi.mocked(f.provider.createCheckout).mockRejectedValueOnce(new Error("timeout"));
    await expect(f.service.createCheckout(f.access)).rejects.toThrow();
    await expect(f.deliver(f.success())).rejects.toMatchObject({ status: 503 }); expect(f.events).toHaveLength(0);
  });
  it("durably rejects unknown checkout identities when no registration is pending", async () => {
    const f = fixture(); await f.deliver(f.success()); expect(f.events[0].result).toBe("REJECTED");
  });
  it("propagates transient database failure for a 5xx response", async () => {
    const f = fixture(); f.db.$transaction.mockRejectedValueOnce(new Error("database unavailable")); await expect(f.deliver(f.success())).rejects.toThrow("database unavailable");
  });
});
describe("unsupported checkout customizations", () => {
  it.each(["MULTI_SELECT", "IMAGE_UPLOAD"])("order creation refuses active %s before any transaction", async fieldType => {
    vi.spyOn(prisma.branch, "findUnique").mockResolvedValue({ id: "branch", isActive: true } as never);
    vi.spyOn(prisma.product, "findUnique").mockResolvedValue({ id: "cake", isActive: true, published: true,
      images: [], customizationGroups: [{ id: "group", name: "Choice", fieldType, isActive: true, isRequired: false, options: [] }] } as never);
    const transaction = vi.spyOn(prisma, "$transaction");
    await expect(OrderService.createPendingOrder({ customerName: "Test Customer", customerEmail: "test@example.com", phonePrimary: "0771234567",
      branchId: "branch", readyDate: getEarliestReadyDate(), productId: "cake", selections: {} })).rejects.toThrow("cannot currently be ordered online");
    expect(transaction).not.toHaveBeenCalled();
  });
  it.each(["MULTI_SELECT", "IMAGE_UPLOAD"])("fails closed for active %s even if optional", fieldType => {
    expect(validateCustomerSelections([{ id: "group", name: "Choice", fieldType, isActive: true, isRequired: false, options: [] }], {}).isValid).toBe(false);
  });
});
