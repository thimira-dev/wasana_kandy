import { PaymentService } from "@/lib/services/payment-service";
import { paymentResponse, paymentErrorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { return paymentResponse(await PaymentService.getStatus(await request.json())); }
  catch (error) { return paymentErrorResponse(error); }
}
