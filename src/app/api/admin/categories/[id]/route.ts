import { readJson, securityErrorResponse } from "@/lib/security/requests";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/roles";
import { CategoryService } from "@/lib/services/category-service";
import { ZodError } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await readJson(request);
    const category = await CategoryService.updateCategory(id, body);

    return NextResponse.json({ success: true, category });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Update category error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await CategoryService.deleteCategory(id);

    if (!result) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: result });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 400 }
    );
  }
}
