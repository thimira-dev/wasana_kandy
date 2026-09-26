import { describe, it, expect } from "vitest";
import { Permissions, Role } from "../lib/auth/roles";
import { createSessionToken, verifySessionToken } from "../lib/auth/session";

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
