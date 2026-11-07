import { getPaymentService } from "@/lib/payments/runtime";
import { paymentResponse, paymentErrorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    await getPaymentService().processWebhook(rawBody, request.headers.get("X-Payment-Signature"));
    return paymentResponse({ received: true });
  } catch (error) { return paymentErrorResponse(error); }
}
