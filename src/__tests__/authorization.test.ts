import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Permissions, Role } from "../lib/auth/roles";
import { createSessionToken, verifySessionToken, revokeAdminSession } from "../lib/auth/session";

const state = vi.hoisted(() => ({ user: { id: "user-123", email: "manager@wasanabakers.lk", name: "Bakery Manager", role: "PRODUCT_MANAGER", isActive: true, passwordHash: "fixture-hash", updatedAt: new Date("2026-01-01") }, sessions: new Map<string, Record<string, unknown>>(), token: "" }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: vi.fn(async () => state.user) },
  adminSession: {
    create: vi.fn(async ({ data }) => { state.sessions.set(data.id, data); return data; }),
    findUnique: vi.fn(async ({ where }) => { const s = state.sessions.get(where.id); return s ? { ...s, user: state.user } : null; }),
    deleteMany: vi.fn(async ({ where }) => { state.sessions.delete(where.id); return { count: 1 }; }),
  },
} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: state.token }) }) }));
beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test_fixture_random_auth_secret_0123456789");
  state.user.isActive = true; state.user.role = "PRODUCT_MANAGER"; state.user.passwordHash = "fixture-hash";
  state.user.updatedAt = new Date("2026-01-01"); state.sessions.clear(); state.token = "";
});
afterEach(() => vi.unstubAllEnvs());

describe("Admin Authorization Matrix", () => {
  it("grants product management access to SUPER_ADMIN and PRODUCT_MANAGER", () => {
    expect(Permissions.canManageProducts("SUPER_ADMIN" as Role)).toBe(true);
    expect(Permissions.canManageProducts("PRODUCT_MANAGER" as Role)).toBe(true);
  });

  it("denies product management access to null, undefined, or unauthorized roles", () => {
    expect(Permissions.canManageProducts(null)).toBe(false);
    expect(Permissions.canManageProducts(undefined)).toBe(false);
    expect(Permissions.canManageProducts("GUEST" as unknown as Role)).toBe(false);
  });

  it("restricts user management exclusively to SUPER_ADMIN", () => {
    expect(Permissions.canManageUsers("SUPER_ADMIN" as Role)).toBe(true);
    expect(Permissions.canManageUsers("PRODUCT_MANAGER" as Role)).toBe(false);
  });
});

describe("Admin Session JWT Tokens", () => {
  it("creates and verifies a valid admin session token", async () => {
    const payload = {
      id: "user-123",
      email: "manager@wasanabakers.lk",
      name: "Bakery Manager",
      role: "PRODUCT_MANAGER" as Role,
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe("user-123");
    expect(verified?.email).toBe("manager@wasanabakers.lk");
    expect(verified?.role).toBe("PRODUCT_MANAGER");
  });

  it("returns null for a corrupted or invalid session token", async () => {
    const verified = await verifySessionToken("invalid-malformed-token");
    expect(verified).toBeNull();
  });
});

it("rejects absent and placeholder signing keys without issuing a token", async () => {
  vi.stubEnv("AUTH_SECRET", ""); vi.stubEnv("JWT_SECRET", "");
  await expect(createSessionToken(state.user as Parameters<typeof createSessionToken>[0])).rejects.toThrow("AUTH_SECRET");
  vi.stubEnv("AUTH_SECRET", "your-secure-auth-secret-min-32-chars-long");
  await expect(createSessionToken(state.user as Parameters<typeof createSessionToken>[0])).rejects.toThrow("AUTH_SECRET");
});
it.each(["disabled", "role changed", "password changed", "revoked"])("rejects an existing session when %s", async condition => {
  const token = await createSessionToken(state.user as Parameters<typeof createSessionToken>[0]);
  if (condition === "disabled") state.user.isActive = false;
  if (condition === "role changed") { state.user.role = "SUPER_ADMIN"; state.user.updatedAt = new Date("2026-01-02"); }
  if (condition === "password changed") state.user.passwordHash = "new-hash";
  if (condition === "revoked") { state.token = token; await revokeAdminSession(); }
  expect(await verifySessionToken(token)).toBeNull();
});
