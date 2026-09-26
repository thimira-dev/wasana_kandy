import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";
import { formatLKR } from "@/lib/domain/pricing";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await OrderService.createPendingOrder(body);

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
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);

    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 400 }
    );
  }
}
