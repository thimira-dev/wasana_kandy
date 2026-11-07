import { readForm, securityErrorResponse } from "@/lib/security/requests";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/roles";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session || !Permissions.canManageProducts(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit("admin-upload", session.id, 30, 60);
    const formData = await readForm(request, 6 * 1024 * 1024);
    const file = formData.get("file") as File | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const storage = getStorageProvider();
    const validation = storage.validateFile(file.size, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const publicUrl = await storage.upload(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Image upload could not be completed");
    return NextResponse.json(
      { error: "Failed to upload image. Please use a valid JPEG, PNG, WebP, or AVIF image." },
      { status: 500 }
    );
  }
}
