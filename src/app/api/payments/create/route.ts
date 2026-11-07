import { assertSameOrigin, readJson } from "@/lib/security/requests";
import { clientAddress, enforceRateLimit } from "@/lib/security/rate-limit";
import { orderAccessSchema, PaymentError } from "@/lib/services/payment-service";
import { getPaymentService } from "@/lib/payments/runtime";
import { paymentResponse, paymentErrorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit("payment-create-ip", clientAddress(request), 30, 60);
    const parsed = orderAccessSchema.safeParse(await readJson(request, 2048));
    if (!parsed.success) throw new PaymentError("Invalid order access request.");
    await enforceRateLimit("payment-create-order", JSON.stringify(parsed.data), 6, 60);
    return paymentResponse(await getPaymentService().createCheckout(parsed.data));
  }
  catch (error) { return paymentErrorResponse(error); }
}
