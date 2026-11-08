import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "./config";
import type { AdminUserSession } from "./roles";

export const COOKIE_NAME = "wasana_admin_session";
const COOKIE_MAX_AGE = 8 * 60 * 60;
const ISSUER = "wasana-admin";
const AUDIENCE = "wasana-admin-portal";

function userVersion(user: { passwordHash: string; updatedAt: Date }) {
  return createHash("sha256").update(user.passwordHash).update(user.updatedAt.toISOString()).digest("hex");
}

export async function createSessionToken(payload: AdminUserSession, authenticatedUser?: { passwordHash: string; updatedAt: Date }): Promise<string> {
  const secret = getAuthSecret();
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user?.isActive || !["SUPER_ADMIN", "PRODUCT_MANAGER"].includes(user.role)) {
    throw new Error("Administrative access is unavailable.");
  }
  if (authenticatedUser && userVersion(authenticatedUser) !== userVersion(user)) throw new Error("Credentials changed; please sign in again.");
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  const token = await new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(id).setIssuer(ISSUER).setAudience(AUDIENCE)
    .setIssuedAt().setExpirationTime(Math.floor(expiresAt.getTime() / 1000)).sign(secret);
  await prisma.adminSession.create({ data: { id, userId: user.id, userVersion: userVersion(user), expiresAt } });
  return token;
}

async function decodeSession(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret(), {
    algorithms: ["HS256"], issuer: ISSUER, audience: AUDIENCE,
    requiredClaims: ["exp", "iat", "jti"],
  });
  if (typeof payload.id !== "string" || typeof payload.jti !== "string") throw new Error("Invalid session");
  return { userId: payload.id, id: payload.jti };
}

// Every protected page and API resolves current account state, rather than JWT roles.
export async function verifySessionToken(token: string): Promise<AdminUserSession | null> {
  try {
    const claims = await decodeSession(token);
    const session = await prisma.adminSession.findUnique({ where: { id: claims.id }, include: { user: true } });
    if (!session || session.userId !== claims.userId || session.expiresAt.getTime() <= Date.now()) return null;
    const user = session.user;
    if (!user.isActive || !["SUPER_ADMIN", "PRODUCT_MANAGER"].includes(user.role) || session.userVersion !== userVersion(user)) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

// Layout and page authorization share one lookup, scoped to this render only.
export const getAdminSession = cache(async (): Promise<AdminUserSession | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
});

export async function revokeAdminSession(): Promise<void> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return;
  let claims;
  try { claims = await decodeSession(token); } catch { return; }
  await prisma.adminSession.deleteMany({ where: { id: claims.id, userId: claims.userId } });
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({ name: COOKIE_NAME, value: token, httpOnly: true,
    secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: COOKIE_MAX_AGE });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({ name: COOKIE_NAME, value: "", httpOnly: true,
    secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}
