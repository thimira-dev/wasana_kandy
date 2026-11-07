import "server-only";
import { NextResponse } from "next/server";
import { PaymentError } from "@/lib/services/payment-service";

export function paymentResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
export function paymentErrorResponse(error: unknown) {
  if (error instanceof PaymentError) return paymentResponse({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return paymentResponse({ error: "Invalid request." }, 400);
  console.error("Payment request could not be completed");
  return paymentResponse({ error: "Payment service is unavailable. Please try again shortly." }, 503);
}
