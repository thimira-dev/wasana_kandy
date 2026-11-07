import { validateReadyDate } from "@/lib/domain/date-rules";

export const ORDER_PAYMENT_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function orderPaymentProblem(order: { createdAt: Date; readyDate: Date }, at = new Date()): string | null {
  if (at.getTime() >= order.createdAt.getTime() + ORDER_PAYMENT_LIFETIME_MS) {
    return "This order's payment window has expired. Please create a new order.";
  }
  if (!validateReadyDate(order.readyDate.toISOString().slice(0, 10), at).isValid) {
    return "The pickup date no longer allows enough preparation time. Please create a new order with a later date.";
  }
  return null;
}
