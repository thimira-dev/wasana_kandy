import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { CheckoutInput, PaymentEvent, PaymentProvider, ProviderCheckout } from "./payment-provider";

const TOKEN_HEX_LENGTH = 32;
const SIGNATURE_PREFIX = "sim1=";

/**
 * Stand-in gateway used until a real provider (PayHere) is installed. It keeps
 * the exact same provider contract and audit-trail semantics as a hosted
 * checkout service:
 *  - createCheckout returns a checkout URL containing an unforgeable HMAC token
 *  - "webhook" events carry an HMAC signature over the exact raw body
 *  - verifications are constant-time and tamper-rejecting
 */

export function simulatedCheckoutToken(secret: string, checkoutId: string): string {
  return createHmac("sha256", secret).update(`checkout:${checkoutId}`).digest("hex").slice(0, TOKEN_HEX_LENGTH);
}

export function verifySimulatedCheckoutToken(secret: string, checkoutId: string, token: string): boolean {
  if (typeof token !== "string" || token.length !== TOKEN_HEX_LENGTH) return false;
  const expected = Buffer.from(simulatedCheckoutToken(secret, checkoutId), "hex");
  let actual: Buffer;
  try {
    actual = Buffer.from(token, "hex");
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function simulatedEventSignature(secret: string, rawBody: string): string {
  return SIGNATURE_PREFIX + createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function buildSimulatedEventId(): string {
  return `evt_sim_${randomUUID()}`;
}

export class SimulatedPaymentProvider implements PaymentProvider {
  constructor(
    private readonly appUrl: string,
    private readonly secret: string,
  ) {}

  async createCheckout(_input: CheckoutInput, _idempotencyKey: string): Promise<ProviderCheckout> {
    void _input;
    void _idempotencyKey;
    const checkoutId = `sim_ctxt_${randomUUID()}`;
    const paymentId = `sim_pay_${randomUUID()}`;
    const token = simulatedCheckoutToken(this.secret, checkoutId);
    const url = new URL("/checkout/simulate", this.appUrl);
    url.searchParams.set("c", checkoutId);
    url.searchParams.set("t", token);
    // Match real gateway session behaviour: expire after 60 minutes.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    return {
      id: checkoutId,
      paymentId,
      // Test-sandbox simulations only; live checkout requires a real gateway rollout.
      mode: "test",
      status: "open",
      url: url.href,
      expiresAt,
    };
  }

  verifyWebhook(rawBody: string, signature: string | null): PaymentEvent {
    if (!signature || !signature.startsWith(SIGNATURE_PREFIX)) throw new Error("Invalid event");
    const provided = Buffer.from(signature.slice(SIGNATURE_PREFIX.length), "hex");
    const expected = Buffer.from(simulatedEventSignature(this.secret, rawBody).slice(SIGNATURE_PREFIX.length), "hex");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new Error("Invalid event");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new Error("Invalid event");
    }
    const shape = parsed as {
      object?: string;
      id?: string;
      type?: string;
      mode?: string;
      data?: { checkoutId?: string; paymentId?: string; reference?: string | null; amountCents?: number; currency?: string; paymentMode?: string; status?: string; succeededAt?: string | null };
    };

    if (shape.object !== "event" || !/^evt_sim_[0-9a-f-]{36}$/.test(shape.id ?? "") ||
        typeof shape.mode !== "string" ||
        !["payment.succeeded", "payment.failed", "checkout.expired"].includes(shape.type ?? "")) {
      throw new Error("Invalid event");
    }

    const base = { id: shape.id!, type: shape.type!, mode: shape.mode };
    const data = shape.data ?? {};
    if (base.type === "checkout.expired") {
      if (!/^sim_ctxt_[0-9a-f-]{36}$/.test(data.checkoutId ?? "") ||
          !/^sim_pay_[0-9a-f-]{36}$/.test(data.paymentId ?? "")) {
        throw new Error("Invalid event");
      }
      return { ...base, checkoutId: data.checkoutId, paymentId: data.paymentId };
    }
    if (!/^sim_ctxt_[0-9a-f-]{36}$/.test(data.checkoutId ?? "") || !/^sim_pay_[0-9a-f-]{36}$/.test(data.paymentId ?? "") ||
        typeof data.reference !== "string" || typeof data.amountCents !== "number" || !Number.isFinite(data.amountCents) ||
        data.currency !== "LKR" || typeof data.paymentMode !== "string" ||
        (data.status !== "succeeded" && data.status !== "failed")) {
      throw new Error("Invalid event");
    }
    return {
      ...base,
      checkoutId: data.checkoutId ?? undefined,
      paymentId: data.paymentId,
      reference: data.reference ?? null,
      amountCents: data.amountCents,
      currency: data.currency,
      paymentMode: data.paymentMode,
      paymentStatus: data.status,
      succeededAt: base.type === "payment.succeeded" ? (data.succeededAt ?? null) : null,
    };
  }
}
