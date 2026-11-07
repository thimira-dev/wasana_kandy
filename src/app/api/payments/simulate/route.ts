import { NextResponse } from "next/server";
import { getPaymentService } from "@/lib/payments/runtime";
import {
  completeSimulatedCheckout,
  SimulatedSettledError,
} from "@/lib/payments/simulated-gateway";

export const runtime = "nodejs";

/**
 * Form endpoint of the simulated gateway checkout page. Acts as the gateway:
 * converts the customer's decision into a signed event, runs it through the
 * real payment pipeline, then sends the customer back to the status page.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new NextResponse("Invalid simulated checkout submission.", { status: 400 });
  }

  const raw = {
    checkoutId: String(form.get("checkoutId") ?? ""),
    token: String(form.get("token") ?? ""),
    decision: String(form.get("decision") ?? ""),
  };

  try {
    const processWebhook = (body: string, signature: string | null) =>
      getPaymentService().processWebhook(body, signature);
    const { orderNumber, decision } = await completeSimulatedCheckout(raw, processWebhook);    const result = decision === "fail" ? "cancelled" : "success";
    const target = `/checkout/payment?orderNumber=${encodeURIComponent(orderNumber)}&result=${result}`;
    return NextResponse.redirect(new URL(target, resolveOrigin(request)), 303);
  } catch (error) {
    if (error instanceof SimulatedSettledError) {
      const target = `/checkout/payment?orderNumber=${encodeURIComponent(error.orderNumber)}&result=success`;
      return NextResponse.redirect(new URL(target, resolveOrigin(request)), 303);
    }
    console.error("Simulated checkout could not be completed");
    return new NextResponse(
      "This simulated checkout could not be completed. Return to your payment page and retry.",
      { status: 403, headers: { "Content-Type": "text/plain" } },
    );
  }
}

function resolveOrigin(request: Request): string {
  const configured = process.env.APP_URL;
  return configured && URL.canParse(configured) ? new URL(configured).origin : new URL(request.url).origin;
}
