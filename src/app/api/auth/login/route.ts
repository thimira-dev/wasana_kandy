import { assertSameOrigin, readJson, securityErrorResponse } from "@/lib/security/requests";
import { clientAddress, enforceRateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/domain/validation";
import { createSessionToken, setAdminSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit("login-ip", clientAddress(request), 30, 900);
    const body = await readJson(request, 4096);
    const validated = adminLoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid login credentials", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    await enforceRateLimit("login-account", email, 10, 900);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "PRODUCT_MANAGER") {
      return NextResponse.json(
        { error: "You do not have administrative access" },
        { status: 403 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }, user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, { headers: { "Cache-Control": "no-store" } });

    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    const denied = securityErrorResponse(error);
    if (denied) return denied;
    console.error("Login could not be completed");
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
