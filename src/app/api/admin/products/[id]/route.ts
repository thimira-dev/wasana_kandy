import { readJson, securityErrorResponse } from "@/lib/security/requests";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/roles";
import { ProductService } from "@/lib/services/product-service";
import { ZodError } from "zod";
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const product = await ProductService.getAdminProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await readJson(request);
    const product = await ProductService.updateProduct(id, body);

    return NextResponse.json({ success: true, product });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Update product error:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
    const { published, isActive } = body as { published?: unknown; isActive?: unknown };

    const updated = await ProductService.toggleStatus(id, {
      ...(typeof published === "boolean" ? { published } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Patch product error:", error);
    return NextResponse.json(
      { error: "Failed to update product status" },
      { status: 500 }
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
    const deleted = await ProductService.deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete product" },
      { status: 400 }
    );
  }
}
