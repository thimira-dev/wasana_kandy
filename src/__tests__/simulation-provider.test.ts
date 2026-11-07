import { afterEach, describe, expect, it, vi } from "vitest";
import { getPaymentConfig } from "@/lib/payments/config";
import {
  SimulatedPaymentProvider,
  simulatedCheckoutToken,
  simulatedEventSignature,
  verifySimulatedCheckoutToken,
} from "@/lib/payments/simulation-provider";

vi.mock("server-only", () => ({}));

// Deterministic dev-fixture secret; no configured credentials are needed.
const secret = "sim_unit_test_fixture_secret_0123456789abcdef";
const appUrl = "https://wasana.example";
const provider = () => new SimulatedPaymentProvider(appUrl, secret);

interface SimulatedBody {
  object: "event";
  id: string;
  type: string;
  mode: string;
  data: Record<string, unknown>;
}
const body = (overrides: Partial<SimulatedBody> = {}): string => JSON.stringify({
  object: "event",
  id: "evt_sim_0f0e0d0c-0b0a-4908-8007-000000000005",
  type: "payment.succeeded",
  mode: "test",
  data: {
    checkoutId: "sim_ctxt_0f0e0d0c-0b0a-4908-8007-000000000006",
    paymentId: "sim_pay_0f0e0d0c-0b0a-4908-8007-000000000007",
    reference: "WB-EXAMPLE",
    amountCents: 650000,
    currency: "LKR",
    paymentMode: "test",
    status: "succeeded",
    succeededAt: new Date().toISOString(),
  },
  ...overrides,
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("SimulatedPaymentProvider", () => {
  it("creates a same-origin checkout url that carries an unforgeable token", async () => {
    const input = {
      amountCents: 650000, reference: "WB-EXAMPLE", description: "Cake",
      customer: { name: "Test", email: "test@example.com", phone: "+94771234567" },
      successUrl: `${appUrl}/checkout/payment`, cancelUrl: `${appUrl}/checkout/payment`,
    };
    const checkout = await provider().createCheckout(input, "wasana:checkout:example");
    const url = new URL(checkout.url);
    expect(url.origin).toBe(appUrl);
    expect(url.pathname).toBe("/checkout/simulate");
    const checkoutId = url.searchParams.get("c") ?? "";
    const token = url.searchParams.get("t") ?? "";
    expect(checkoutId).toMatch(/^sim_ctxt_[0-9a-f-]{36}$/);
    expect(verifySimulatedCheckoutToken(secret, checkoutId, token)).toBe(true);
    expect(checkout.mode).toBe("test");
    expect(checkout.status).toBe("open");
    expect(Number.isFinite(Date.parse(checkout.expiresAt))).toBe(true);
  });

  it("only accepts its own HMAC token", () => {
    expect(simulatedCheckoutToken(secret, "sim_ctxt_x")).not.toBe(simulatedCheckoutToken(secret, "sim_ctxt_y"));
    expect(verifySimulatedCheckoutToken(secret, "sim_ctxt_x", simulatedCheckoutToken(secret, "sim_ctxt_y"))).toBe(false);
    expect(verifySimulatedCheckoutToken(secret, "sim_ctxt_x", "")).toBe(false);
    expect(verifySimulatedCheckoutToken("another_secret_same_length_as_fixture____xy", "sim_ctxt_x", simulatedCheckoutToken(secret, "sim_ctxt_x"))).toBe(false);
  });

  it("verifies signed events and maps only safe fields", () => {
    const raw = body();
    const event = provider().verifyWebhook(raw, simulatedEventSignature(secret, raw));
    expect(event).toMatchObject({ id: "evt_sim_0f0e0d0c-0b0a-4908-8007-000000000005", type: "payment.succeeded",
      mode: "test", checkoutId: "sim_ctxt_0f0e0d0c-0b0a-4908-8007-000000000006",
      paymentId: "sim_pay_0f0e0d0c-0b0a-4908-8007-000000000007", amountCents: 650000, currency: "LKR" });
    expect(event).not.toHaveProperty("card");
  });

  it.each([null, "", "sim1=deadbeef", "sha256=invalid", simulatedEventSignature(secret, body()) + " "])(
    "rejects invalid signature %j", (signature) => {
      expect(() => provider().verifyWebhook(body(), signature)).toThrow();
    },
  );

  it("rejects changed bodies and malformed events", () => {
    const raw = body();
    const tampered = body({ data: { amountCents: 1 } });
    expect(() => provider().verifyWebhook(tampered, simulatedEventSignature(secret, raw))).toThrow();
    expect(() => provider().verifyWebhook(raw, simulatedEventSignature(secret, raw))).not.toThrow();
    for (const malformed of ["not-json", "{\"object\":\"nope\"}", body({ type: "test.ping" }), body({ data: { checkoutId: "chk_wrong" } })]) {
      expect(() => provider().verifyWebhook(malformed, simulatedEventSignature(secret, malformed))).toThrow();
    }
  });

  it("accepts a signed failure and a signed expiry event", () => {
    const failed = body({ data: {
      checkoutId: "sim_ctxt_0f0e0d0c-0b0a-4908-8007-000000000006",
      paymentId: "sim_pay_0f0e0d0c-0b0a-4908-8007-000000000007",
      reference: "WB-EXAMPLE",
      amountCents: 650000,
      currency: "LKR",
      paymentMode: "test",
      status: "failed",
      succeededAt: null,
    } });
    expect(provider().verifyWebhook(failed, simulatedEventSignature(secret, failed)).paymentStatus).toBe("failed");
    const expired = body({ type: "checkout.expired", data: { checkoutId: "sim_ctxt_0f0e0d0c-0b0a-4908-8007-000000000006", paymentId: "sim_pay_0f0e0d0c-0b0a-4908-8007-000000000007" } });
    expect(provider().verifyWebhook(expired, simulatedEventSignature(secret, expired)).type).toBe("checkout.expired");
  });
});

describe("payment configuration", () => {
  function setupSimulation(overrides: Record<string, string> = {}) {
    vi.stubEnv("PAYMENT_PROVIDER", "simulation");
    vi.stubEnv("PAYMENT_MODE", "test");
    vi.stubEnv("APP_URL", "https://example.com");
    vi.stubEnv("PAYMENT_SIMULATION_SECRET", "sim_unit_test_fixture_secret_0123456789abcdef");
    for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);
  }
  it("permits complete simulation configuration", () => {
    setupSimulation();
    const config = getPaymentConfig();
    expect(config.provider).toBe("simulation");
    expect(config.databaseProviderName).toBe("SIMULATION");
    expect(config.mode).toBe("test");
  });
  it("falls back to a dev secret outside production without network or files", () => {
    setupSimulation();
    delete (process.env as Record<string, string | undefined>).PAYMENT_SIMULATION_SECRET;
    expect(getPaymentConfig().simulationSecret.length).toBeGreaterThanOrEqual(32);
  });
  it("disables production simulation unless staging explicitly opts in", () => {
    setupSimulation({ NODE_ENV: "production", PAYMENT_ALLOW_SIMULATION: "" });
    expect(getPaymentConfig).toThrow("Simulation checkout is disabled");
    vi.stubEnv("PAYMENT_ALLOW_SIMULATION", "true");
    expect(getPaymentConfig().provider).toBe("simulation");
  });
  it("rejects missing configuration in production", () => {
    setupSimulation({ NODE_ENV: "production", PAYMENT_SIMULATION_SECRET: "" });
    expect(getPaymentConfig).toThrow();
  });
  it("rejects short secrets, unknown providers, and live activation", () => {
    setupSimulation({ PAYMENT_SIMULATION_SECRET: "short" });
    expect(getPaymentConfig).toThrow();
    setupSimulation({ PAYMENT_PROVIDER: "carrier_pigeon" });
    expect(getPaymentConfig).toThrow();
    setupSimulation({ PAYMENT_MODE: "live" });
    expect(getPaymentConfig).toThrow("Live payments are not enabled");
  });
  it("rejects credential-bearing and insecure production app URLs", () => {
    setupSimulation({ APP_URL: "https://user:password@example.com" });
    expect(getPaymentConfig).toThrow();
    setupSimulation({ NODE_ENV: "production", APP_URL: "http://localhost:3000" });
    expect(getPaymentConfig).toThrow();
  });
});

it("reuses checkout identity and expiration across provider instances for a persisted attempt", async () => {
  const input = { amountCents: 650000, reference: "WB-EXAMPLE", description: "Cake", customer: { name: "Test", email: "test@example.com", phone: "+94771234567" },
    successUrl: `${appUrl}/checkout/payment`, cancelUrl: `${appUrl}/checkout/payment`, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  expect(await provider().createCheckout(input, "same-attempt")).toEqual(await provider().createCheckout(input, "same-attempt"));
  expect((await provider().createCheckout(input, "different-attempt")).id).not.toBe((await provider().createCheckout(input, "same-attempt")).id);
});
