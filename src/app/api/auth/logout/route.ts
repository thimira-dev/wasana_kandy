import { NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSession, revokeAdminSession } from "@/lib/auth/session";

export async function POST() {
  await revokeAdminSession();
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  clearAdminSessionCookie(response);
  return response;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session }, { headers: { "Cache-Control": "no-store" } });
}
