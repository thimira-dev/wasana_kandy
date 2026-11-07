import { orderPaymentProblem } from "@/lib/payments/order-eligibility";
import "server-only";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OrderService } from "./order-service";
import { orderTotalToCents } from "@/lib/payments/money";
import type { PaymentEvent, PaymentProvider, ProviderMode } from "@/lib/payments/payment-provider";

export class PaymentError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}
export const orderAccessSchema = z.object({
  orderNumber: z.string().min(1).max(80), accessToken: z.string().min(1).max(128),
}).strict();
const RETRY_WINDOW = 23 * 60 * 60 * 1000;
export type PaymentProviderNamesConfig = "PAYMENTS_LK" | "SIMULATION";
export interface PaymentServiceConfig {
  mode: ProviderMode;
  appUrl: string;
  /** Database enum value stamped onto attempts and event ledger rows. */
  providerName: PaymentProviderNamesConfig;
}

export class PaymentService {
  constructor(private readonly provider: PaymentProvider,
    private readonly config: PaymentServiceConfig,
    private readonly db: PrismaClient = prisma) {}

  private static async authorized(input: unknown, tx: Prisma.TransactionClient) {
    const parsed = orderAccessSchema.safeParse(input);
    if (!parsed.success) throw new PaymentError("Invalid order access request.");
    const order = await OrderService.getPaymentOrder(parsed.data.orderNumber, parsed.data.accessToken, tx);
    if (!order) throw new PaymentError("Order access is unavailable in this browser session.", 403);
    return order;
  }

  async getStatus(input: unknown) { return PaymentService.getStatus(input, this.db); }

  static async getStatus(input: unknown, db: Prisma.TransactionClient = prisma) {
    const order = await PaymentService.authorized(input, db);
    const attempt = order.paymentAttempts[0];
    return { orderNumber: order.orderNumber, orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus, isTest: order.isTest, paymentReviewRequired: order.paymentReviewRequired,
      paymentUnavailableReason: order.paymentStatus === "PAID" ? null : orderPaymentProblem(order), total: order.total.toString(), currency: "LKR",
      pickup: { branch: order.branch.name, address: order.branch.address, readyDate: order.readyDate.toISOString().slice(0, 10) },
      latestPaymentAttempt: attempt ? { status: attempt.status === "OPEN" && attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now() ? "EXPIRED" : attempt.status, failureMessage: attempt.failureMessage,
        expiresAt: attempt.expiresAt?.toISOString() ?? null } : null };
  }

  async createCheckout(input: unknown) {
    const access = await PaymentService.authorized(input, this.db);
    const prepared = await this.db.$transaction(async tx => {
      // Serialize attempt creation with webhook transitions, across server instances.
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${access.id} FOR UPDATE`;
      const order = await PaymentService.authorized(input, tx);
      if (order.paymentStatus === "PAID") return { order, attempt: null };
      if (order.orderStatus !== "PAYMENT_PENDING" || order.paymentStatus === "REFUNDED") {
        throw new PaymentError("This order is not available for payment.", 409);
      }
      const unavailable = orderPaymentProblem(order);
      if (unavailable) throw new PaymentError(unavailable, 409);
      if (order.isTest !== (this.config.mode === "test")) throw new PaymentError("Payment environment does not match this order.", 409);
      // Also protect orders persisted before unsupported configuration was rejected.
      const unsupported = await tx.orderItem.findFirst({ where: { orderId: order.id, OR: [
        { customizations: { some: { fieldTypeSnapshot: { in: ["MULTI_SELECT", "IMAGE_UPLOAD"] } } } },
        { product: { customizationGroups: { some: { isActive: true, fieldType: { in: ["MULTI_SELECT", "IMAGE_UPLOAD"] } } } } },
      ] } });
      if (unsupported) throw new PaymentError("This cake cannot currently be paid for online. Please contact the bakery.");
      const amountCents = orderTotalToCents(order.total);
      if (amountCents < 1000 || amountCents > 100000000) throw new PaymentError("This order amount is outside the supported payment range.");
      const previous = order.paymentAttempts[0];
      if (previous && (previous.provider !== this.config.providerName || previous.mode !== this.config.mode.toUpperCase() || previous.amountCents !== BigInt(amountCents) || previous.currency !== "LKR")) {
        throw new PaymentError("Payment needs review by the bakery before retrying.", 409);
      }
      if (previous?.status === "CREATING") {
        // An ambiguous provider result must never be retried beyond provider key retention.
        if (Date.now() - previous.createdAt.getTime() >= RETRY_WINDOW) {
          throw new PaymentError("Payment needs review by the bakery before retrying.", 409);
        }
        return { order, attempt: previous };
      }
      if (previous?.status === "OPEN") {
        if (!previous.expiresAt || !previous.checkoutUrl || !previous.providerCheckoutId || !previous.providerPaymentId) {
          throw new PaymentError("Payment needs review by the bakery before retrying.", 409);
        }
        if (previous.expiresAt.getTime() > Date.now()) return { order, attempt: previous };
        await tx.paymentAttempt.update({ where: { id: previous.id }, data: { status: "EXPIRED" } });
      }
      if (previous?.status === "SUCCEEDED") throw new PaymentError("Payment needs review by the bakery before retrying.", 409);
      const attempt = await tx.paymentAttempt.create({ data: { orderId: order.id,
        provider: this.config.providerName,
        mode: this.config.mode === "test" ? "TEST" : "LIVE", amountCents: BigInt(amountCents) } });
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } });
      return { order, attempt };
    });
    const { order, attempt } = prepared;
    if (!attempt) return { alreadyPaid: true };
    if (attempt.status === "OPEN" && attempt.checkoutUrl) return { checkoutUrl: attempt.checkoutUrl };
    const returnUrl = new URL("/checkout/payment", this.config.appUrl);
    returnUrl.searchParams.set("orderNumber", order.orderNumber);
    const successUrl = new URL(returnUrl); successUrl.searchParams.set("result", "success");
    const cancelUrl = new URL(returnUrl); cancelUrl.searchParams.set("result", "cancelled");
    try {
      // No network operation runs within a database transaction.
      const checkout = await this.provider.createCheckout({ expiresAt: new Date(attempt.createdAt.getTime() + 60 * 60 * 1000).toISOString(), amountCents: orderTotalToCents(order.total),
        reference: order.orderNumber, description: `Wasana cake order ${order.orderNumber}`.slice(0, 120),
        customer: { name: order.customerName, email: order.customerEmail, phone: order.phonePrimary },
        successUrl: successUrl.href, cancelUrl: cancelUrl.href }, `wasana:checkout:${attempt.id}`);
      const url = new URL(checkout.url);
      const appOrigin = new URL(this.config.appUrl).origin;
      // Hosted gateways use https; an internal simulated checkout shares the app origin.
      if (checkout.mode !== this.config.mode ||
          (url.protocol !== "https:" && url.origin !== appOrigin) || url.username || url.password ||
          !checkout.id || !checkout.paymentId || !Number.isFinite(Date.parse(checkout.expiresAt))) throw new Error("Invalid checkout");
      if (!["open", "expired"].includes(checkout.status)) {
        throw new PaymentError("Payment is processing or requires review. Check the order status before retrying.", 409);
      }
      const saved = await this.db.paymentAttempt.updateMany({ where: { id: attempt.id, status: "CREATING" }, data: {
        providerCheckoutId: checkout.id, providerPaymentId: checkout.paymentId, checkoutUrl: checkout.url,
        expiresAt: new Date(checkout.expiresAt), status: checkout.status === "expired" ? "EXPIRED" : "OPEN", failureMessage: null,
      } });
      if (!saved.count) {
        const winner = await this.db.paymentAttempt.findUnique({ where: { id: attempt.id } });
        if (winner?.status === "SUCCEEDED") return { alreadyPaid: true };
        if (winner?.status === "OPEN" && winner.checkoutUrl && winner.expiresAt && winner.expiresAt.getTime() > Date.now()) {
          return { checkoutUrl: winner.checkoutUrl };
        }
        throw new PaymentError("Payment is processing. Please check the order status.", 409);
      }
      if (checkout.status !== "open") throw new PaymentError("Payment is processing or requires review. Check the order status before retrying.", 409);
      return { checkoutUrl: checkout.url };
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      // Preserve CREATING and deterministic key after all ambiguous failures.
      console.error("Payment checkout unavailable", { attemptId: attempt.id });
      throw new PaymentError("Unable to start payment. Your order is saved; please retry from its payment page.", 503);
    }
  }

  async processWebhook(rawBody: string, signature: string | null) {
    let event: PaymentEvent;
    try { event = this.provider.verifyWebhook(rawBody, signature); }
    catch { throw new PaymentError("Invalid payment signature or event."); }
    return this.db.$transaction(async tx => {
      // Lock event identity before deduplication; transaction rollback permits transient retries.
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${event.id}))`;
      const key = { provider: this.config.providerName, providerEventId: event.id };
      if (await tx.paymentEvent.findUnique({ where: { provider_providerEventId: key } })) return;
      const record = async (result: "PROCESSED" | "IGNORED" | "REJECTED", reason?: string,
        orderId?: string, attemptId?: string) => {
        await tx.paymentEvent.create({ data: { ...key, eventType: event.type.slice(0, 120), mode: String(event.mode).slice(0, 20),
          result, reason, orderId, attemptId, processedAt: new Date() } });
        if (result === "REJECTED") console.error("Payment event rejected", { eventId: event.id, reason });
      };
      if (!["payment.succeeded", "payment.failed", "checkout.expired"].includes(event.type)) {
        await record("IGNORED"); return;
      }
      if (event.mode !== this.config.mode) { await record("REJECTED", "Mode mismatch"); return; }
      const attempt = event.checkoutId ? await tx.paymentAttempt.findUnique({ where: { providerCheckoutId: event.checkoutId } }) : null;
      if (!attempt) {
        // A webhook may race a pending checkout API response. Retry only while
        // an unresolved local registration could explain the missing identity.
        const candidate = event.reference ? await tx.order.findUnique({ where: { orderNumber: event.reference } }) : null;
        const registering = candidate || event.type === "checkout.expired" ? await tx.paymentAttempt.findFirst({
          where: { ...(candidate ? { orderId: candidate.id } : {}), status: "CREATING", mode: this.config.mode === "test" ? "TEST" : "LIVE" },
          orderBy: { createdAt: "desc" },
        }) : null;
        if (registering && Date.now() - registering.createdAt.getTime() < RETRY_WINDOW) {
          throw new PaymentError("Payment registration is still processing.", 503);
        }
        await record("REJECTED", "Unknown checkout or reference", candidate?.id); return;
      }
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${attempt.orderId} FOR UPDATE`;
      const order = await tx.order.findUniqueOrThrow({ where: { id: attempt.orderId } });
      const mismatch = attempt.provider !== this.config.providerName || order.isTest !== (this.config.mode === "test") ? "Provider or order environment mismatch"
        : event.mode !== this.config.mode || attempt.mode !== this.config.mode.toUpperCase() ? "Mode mismatch"
        : event.paymentId !== attempt.providerPaymentId ? "Payment identity mismatch"
        : attempt.amountCents !== BigInt(orderTotalToCents(order.total)) || attempt.currency !== "LKR" ? "Stored amount mismatch"
        : event.type !== "checkout.expired" && event.reference !== order.orderNumber ? "Reference mismatch"
        : event.type !== "checkout.expired" && event.amountCents !== orderTotalToCents(order.total) ? "Amount mismatch"
        : event.type !== "checkout.expired" && event.currency !== "LKR" ? "Currency mismatch"
        : event.type !== "checkout.expired" && event.paymentMode !== this.config.mode ? "Payment mode mismatch"
        : event.type === "payment.succeeded" && (event.paymentStatus !== "succeeded" || !event.succeededAt || !Number.isFinite(Date.parse(event.succeededAt))) ? "Invalid success state"
        : event.type === "payment.failed" && event.paymentStatus !== "failed" ? "Invalid failure state" : null;
      if (mismatch) { await record("REJECTED", mismatch, order.id, attempt.id); return; }
      if (order.paymentStatus === "PAID") { await record("IGNORED", "Order already paid", order.id, attempt.id); return; }
      if (order.orderStatus !== "PAYMENT_PENDING" || order.paymentStatus === "REFUNDED") {
        await record("REJECTED", "Order unavailable", order.id, attempt.id); return;
      }
      if (event.type === "payment.succeeded") {
        const paidAt = new Date(event.succeededAt!);
        await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: "SUCCEEDED", succeededAt: paidAt, failureMessage: null } });
        // Record received funds even when fulfilment now needs human review.
        const paymentReviewRequired = Boolean(orderPaymentProblem(order, paidAt));
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID",
          orderStatus: paymentReviewRequired ? "PAYMENT_PENDING" : "CONFIRMED", paymentReviewRequired, paidAt } });
      } else {
        // Expiry must not overwrite failure/success, nor failure overwrite success.
        const fresh = await tx.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
        if (fresh.status !== "SUCCEEDED" && !(event.type === "checkout.expired" && fresh.status === "FAILED")) {
          await tx.paymentAttempt.update({ where: { id: attempt.id }, data: {
            status: event.type === "payment.failed" ? "FAILED" : "EXPIRED",
            failureMessage: event.type === "payment.failed" ? "Payment was declined or could not be completed. Please retry." : null,
          } });
        }
        // Older attempt failures don't mask a newer attempt's progress.
        const latest = await tx.paymentAttempt.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
        if (latest?.id === attempt.id && event.type === "payment.failed") {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
        }
      }
      await record("PROCESSED", undefined, order.id, attempt.id);
    });
  }
}
