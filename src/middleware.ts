import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "wasana_admin_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.JWT_SECRET || "wasana-dev-secret-key-at-least-32-chars-long!"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let userSession: { id: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload && payload.id && payload.role) {
        userSession = {
          id: payload.id as string,
          role: payload.role as string,
        };
      }
    } catch {
      userSession = null;
    }
  }

  const isLoginPage = pathname === "/admin/login";

  // If already logged in and visiting /admin/login, redirect to /admin/products
  if (isLoginPage) {
    if (userSession) {
      return NextResponse.redirect(new URL("/admin/products", request.url));
    }
    return NextResponse.next();
  }

  // Any other /admin route requires a valid session
  if (!userSession) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify valid admin role
  if (userSession.role !== "SUPER_ADMIN" && userSession.role !== "PRODUCT_MANAGER") {
    const response = NextResponse.redirect(new URL("/admin/login?error=UnauthorizedRole", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
