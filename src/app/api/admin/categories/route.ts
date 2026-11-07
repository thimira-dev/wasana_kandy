import { readJson, securityErrorResponse } from "@/lib/security/requests";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/roles";
import { CategoryService } from "@/lib/services/category-service";
import { ZodError } from "zod";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await CategoryService.getCategoriesWithProductCounts();
    return NextResponse.json({ categories });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Fetch categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJson(request);
    const category = await CategoryService.createCategory(body);

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Create category error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
