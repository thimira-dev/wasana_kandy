import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { assertSameOrigin, RequestSecurityError } from "@/lib/security/requests";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    // A gateway webhook authenticates its exact body with a signature instead.
    if (pathname !== "/api/payments/webhook" && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      try { assertSameOrigin(request); }
      catch (error) {
        if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
        throw error;
      }
    }
    return NextResponse.next();
  }
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (pathname === "/admin/login") {
    return session ? NextResponse.redirect(new URL("/admin/products", request.url)) : NextResponse.next();
  }
  if (!session) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("from", pathname);
    const response = NextResponse.redirect(login);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
