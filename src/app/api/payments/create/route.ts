import { getPaymentService } from "@/lib/payments/runtime";
import { paymentResponse, paymentErrorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { return paymentResponse(await getPaymentService().createCheckout(await request.json())); }
  catch (error) { return paymentErrorResponse(error); }
}
