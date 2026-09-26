import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order-service";

export const revalidate = 60;

export async function GET() {
  try {
    const branches = await OrderService.getActiveBranches();
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Fetch branches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}
