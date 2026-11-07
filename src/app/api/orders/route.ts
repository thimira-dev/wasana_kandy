import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getPaymentConfig } from "@/lib/payments/config";
import { assertSameOrigin, readJson, securityErrorResponse } from "@/lib/security/requests";
import { clientAddress, enforceRateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { OrderService, OrderValidationError } from "@/lib/services/order-service";
import { formatLKR } from "@/lib/domain/pricing";
import { ZodError } from "zod";

const CHECKOUT_COOKIE = "wasana_checkout_session";

// Initialize an HttpOnly owner credential before the first order submission so lost responses are retryable.
export async function GET(request: Request) {
  try {
    await enforceRateLimit("checkout-session", clientAddress(request), 60, 60);
    const current = (await cookies()).get(CHECKOUT_COOKIE)?.value;
    const token = current && /^[0-9a-f]{64}$/.test(current) ? current : randomBytes(32).toString("hex");
    const response = NextResponse.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set({ name: CHECKOUT_COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", path: "/api/orders", maxAge: 24 * 60 * 60 });
    return response;
  } catch (error) {
    return securityErrorResponse(error) || NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit("orders-ip", clientAddress(request), 20, 600);
    const owner = (await cookies()).get(CHECKOUT_COOKIE)?.value;
    if (!owner || !/^[0-9a-f]{64}$/.test(owner)) return NextResponse.json({ error: "Please refresh checkout to establish your browser session." }, { status: 403 });
    // Refuse orders when no usable checkout provider is configured.
    getPaymentConfig();
    const body = await readJson(request);
    const order = await OrderService.createPendingOrder(body, owner);

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          accessToken: order.accessToken,
          total: order.total.toString(),
          totalFormatted: formatLKR(order.total.toString()),
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          readyDate: order.readyDate,
          customerName: order.customerName,
          branchName: order.branch?.name,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Order creation could not be completed");

    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof OrderValidationError ? error.message : "Unable to create your order. Please try again." },
      { status: error instanceof OrderValidationError ? 400 : 503 }
    );
  }
}
