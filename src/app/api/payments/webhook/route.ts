import { readBoundedBody } from "@/lib/security/requests";
import { getPaymentService } from "@/lib/payments/runtime";
import { paymentResponse, paymentErrorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const rawBody = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedBody(request, 16 * 1024));
    await getPaymentService().processWebhook(rawBody, request.headers.get("X-Payment-Signature"));
    return paymentResponse({ received: true });
  } catch (error) { return paymentErrorResponse(error); }
}
