import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPaymentConfig } from "./config";
import {
  buildSimulatedEventId,
  simulatedEventSignature,
  verifySimulatedCheckoutToken,
} from "./simulation-provider";

/**
 * Gateway trampoline for the SIMULATION provider: the customer-side "checkout
 * page" posts decisions here; each decision is minted into a signed
 * webhook-style event and replayed through PaymentService.processWebhook, so
 * attempt transitions, dedupe and order confirmation run exactly as they would
 * for a real gateway.
 */

export class SimulatedGatewayError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

/** Thrown when the outcome was already recorded; callers redirect to the status page. */
export class SimulatedSettledError extends SimulatedGatewayError {
  constructor(public readonly orderNumber: string) {
    super("Order payment was already settled elsewhere.", 409);
  }
}

const linkSchema = z.object({
  checkoutId: z.string().regex(/^sim_ctxt_[0-9a-f-]{36}$/, "Invalid checkout link."),
  token: z.string().length(32, "Invalid checkout link."),
});

const decisionSchema = linkSchema.extend({
  decision: z.enum(["succeed", "fail"]),
});

function getSimulationSecret(): string {
  const config = getPaymentConfig();
  if (config.provider !== "simulation") {
    throw new SimulatedGatewayError("The simulated gateway is not active.", 404);
  }
  return config.simulationSecret;
}

export interface SimulatedCheckoutViewData {
  status: "open";
  orderNumber: string;
  orderTotal: string;
  description: string;
}

/**
 * Server-side loader for the customer-facing simulate page. Verifies the link,
 * then returns the live checkout state. Unverifiable links cannot expose order
 * data (ownership is the unforgeable token), so they raise a generic error.
 */
export async function loadSimulatedCheckout(rawInput: unknown): Promise<SimulatedCheckoutViewData> {
  const parsed = linkSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SimulatedGatewayError("This simulated checkout link is invalid.", 400);
  }
  const { checkoutId, token } = parsed.data;
  const secret = getSimulationSecret();
  if (!verifySimulatedCheckoutToken(secret, checkoutId, token)) {
    throw new SimulatedGatewayError("This simulated checkout link is invalid.", 403);
  }

  const attempt = await prisma.paymentAttempt.findUnique({
    where: { providerCheckoutId: checkoutId },
    include: { order: true },
  });
  if (!attempt || attempt.mode !== "TEST" || !attempt.order) {
    throw new SimulatedGatewayError("This simulated checkout session could not be found.", 404);
  }
  const order = attempt.order;

  if (attempt.status === "CREATING") {
    throw new SimulatedGatewayError("Payment registration is still processing. Please refresh the payment page and retry.", 409);
  }
  if (order.paymentStatus === "PAID" || order.orderStatus !== "PAYMENT_PENDING" || attempt.status === "SUCCEEDED") {
    throw new SimulatedSettledError(order.orderNumber);
  }
  if (attempt.status !== "OPEN") {
    throw new SimulatedGatewayError("This checkout session has expired. Return to the payment page to start a fresh session.", 409);
  }
  if (attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
    throw new SimulatedGatewayError("This checkout session has expired. Return to the payment page to start a fresh session.", 409);
  }

  return {
    status: "open",
    orderNumber: order.orderNumber,
    orderTotal: order.total.toString(),
    description: `Wasana cake order ${order.orderNumber}`,
  };
}

export type SimulatedDecision = "succeed" | "fail";

export interface SimulatedCompletionResult {
  orderNumber: string;
  decision: SimulatedDecision;
}

/**
 * Turns the customer's gateway decision into a signed event processed through
 * the same webhook pipeline as a real payment. Returns the order number for
 * the redirect back to the payment status page.
 */
export async function completeSimulatedCheckout(
  rawInput: unknown,
  processWebhook: (rawBody: string, signature: string | null) => Promise<unknown>,
): Promise<SimulatedCompletionResult> {
  const parsed = decisionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SimulatedGatewayError("Invalid simulated checkout decision.", 400);
  }
  const { checkoutId, token, decision } = parsed.data;
  const secret = getSimulationSecret();
  if (!verifySimulatedCheckoutToken(secret, checkoutId, token)) {
    throw new SimulatedGatewayError("This simulated checkout link is invalid.", 403);
  }

  const attempt = await prisma.paymentAttempt.findUnique({
    where: { providerCheckoutId: checkoutId },
    include: { order: true },
  });
  if (!attempt || attempt.mode !== "TEST" || !attempt.order) {
    throw new SimulatedGatewayError("This simulated checkout session could not be found.", 404);
  }
  const order = attempt.order;
  const orderNumber = order.orderNumber;

  if (attempt.status === "CREATING") {
    throw new SimulatedGatewayError("Payment registration is still processing. Please refresh and retry.", 409);
  }
  if (order.paymentStatus === "PAID" || order.orderStatus !== "PAYMENT_PENDING" || attempt.status === "SUCCEEDED") {
    throw new SimulatedSettledError(orderNumber);
  }
  if (attempt.status !== "OPEN") {
    throw new SimulatedGatewayError("This checkout session has expired. Return to the payment page to start a fresh session.", 409);
  }
  if (attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
    throw new SimulatedGatewayError("This checkout session has expired. Return to the payment page to start a fresh session.", 409);
  }

  const eventType = decision === "succeed" ? "payment.succeeded" : "payment.failed";
  const event = {
    object: "event",
    id: buildSimulatedEventId(),
    type: eventType,
    mode: "test",
    data: {
      checkoutId: attempt.providerCheckoutId,
      paymentId: attempt.providerPaymentId,
      reference: orderNumber,
      amountCents: Number(attempt.amountCents),
      currency: attempt.currency,
      paymentMode: attempt.mode.toLowerCase(),
      status: decision === "succeed" ? "succeeded" : "failed",
      succeededAt: decision === "succeed" ? new Date().toISOString() : null,
    },
  };
  const rawBody = JSON.stringify(event);
  const signature = simulatedEventSignature(secret, rawBody);
  await processWebhook(rawBody, signature);

  return { orderNumber, decision };
}
