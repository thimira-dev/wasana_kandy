import { assertSameOrigin, readJson } from "@/lib/security/requests";
import { clientAddress, enforceRateLimit } from "@/lib/security/rate-limit";
import { orderAccessSchema, PaymentError } from "@/lib/services/payment-service";
import { PaymentService } from "@/lib/services/payment-service";
import { paymentResponse, paymentErrorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit("payment-status-ip", clientAddress(request), 180, 60);
    const parsed = orderAccessSchema.safeParse(await readJson(request, 2048));
    if (!parsed.success) throw new PaymentError("Invalid order access request.");
    await enforceRateLimit("payment-status-order", JSON.stringify(parsed.data), 60, 60);
    return paymentResponse(await PaymentService.getStatus(parsed.data));
  }
  catch (error) { return paymentErrorResponse(error); }
}
