import { afterEach, describe, expect, it, vi } from "vitest";
import { PaymentError, PaymentService } from "@/lib/services/payment-service";
import { POST as webhook } from "@/app/api/payments/webhook/route";
import { POST as create } from "@/app/api/payments/create/route";
import { POST as status } from "@/app/api/payments/status/route";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ createCheckout: vi.fn(), processWebhook: vi.fn() }));
vi.mock("@/lib/payments/runtime", () => ({ getPaymentService: () => boundary }));
afterEach(() => { vi.restoreAllMocks(); vi.resetAllMocks(); });
const request = (path: string, body: string, headers: Record<string, string> = {}) => new Request(`https://wasana.example/api/payments/${path}`, { method: "POST", body, headers });
describe("thin payment routes", () => {
  it("passes exact raw body and case-insensitive signature to verifier", async () => {
    const raw = '{ "object": "event", "id": "evt_test" }\n';
    const response = await webhook(request("webhook", raw, { "x-pAyMeNt-sIgNaTuRe": "fixture-signature" }));
    expect(response.status).toBe(200); expect(boundary.processWebhook).toHaveBeenCalledWith(raw, "fixture-signature");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("invalid signature returns 400", async () => {
    boundary.processWebhook.mockRejectedValueOnce(new PaymentError("Invalid payment signature or event."));
    expect((await webhook(request("webhook", "{}"))).status).toBe(400);
  });
  it("transient webhook failure returns 503 without exposing internals", async () => {
    boundary.processWebhook.mockRejectedValueOnce(new Error("internal database details"));
    const response = await webhook(request("webhook", "{}"));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("internal database");
  });
  it("create rejects invalid JSON", async () => {
    expect((await create(request("create", "{"))).status).toBe(400); expect(boundary.createCheckout).not.toHaveBeenCalled();
  });
  it("create and status propagate denied guest access", async () => {
    const access = JSON.stringify({ orderNumber: "WB-test", accessToken: "wrong" });
    boundary.createCheckout.mockRejectedValueOnce(new PaymentError("Order access unavailable.", 403));
    vi.spyOn(PaymentService, "getStatus").mockRejectedValueOnce(new PaymentError("Order access unavailable.", 403));
    expect((await create(request("create", access))).status).toBe(403);
    expect((await status(request("status", access))).status).toBe(403);
  });
  it("status requires no payment credentials and returns no-store response", async () => {
    const getStatus = vi.spyOn(PaymentService, "getStatus").mockResolvedValueOnce({ orderNumber: "WB-test", orderStatus: "PAYMENT_PENDING", paymentStatus: "PENDING", total: "6500", currency: "LKR", pickup: { branch: "Test", address: "Kandy", readyDate: "2026-11-10" }, latestPaymentAttempt: null });
    const access = { orderNumber: "WB-test", accessToken: "browser_test_fixture" };
    const response = await status(request("status", JSON.stringify(access)));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getStatus).toHaveBeenCalledWith(access); expect(await response.text()).not.toContain(access.accessToken);
  });
});
