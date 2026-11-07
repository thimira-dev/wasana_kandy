import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { assertSameOrigin, readBoundedBody, readJson, RequestSecurityError } from "@/lib/security/requests";
import { clientAddress, enforceRateLimit } from "@/lib/security/rate-limit";

const boundary = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: boundary.query } }));
beforeEach(() => { vi.stubEnv("APP_URL", "https://shop.example"); boundary.query.mockReset().mockResolvedValue([{ count: 1 }]); });
afterEach(() => vi.unstubAllEnvs());
const request = (body: string, headers: Record<string, string> = {}) => new Request("https://shop.example/api/orders", {
  method: "POST", body, headers: { Origin: "https://shop.example", "Content-Type": "application/json", ...headers },
});

describe("Request boundaries", () => {
  it("rejects cross-origin, null-origin and missing-origin mutations", () => {
    for (const origin of ["https://evil.example", "null", ""]) expect(() => assertSameOrigin(request("{}", { Origin: origin }))).toThrow();
    expect(() => assertSameOrigin(request("{}"))).not.toThrow();
  });
  it("rejects a body that exceeds the byte budget even without Content-Length", async () => {
    await expect(readBoundedBody(request("x".repeat(100)), 99)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects text/plain JSON and invalid JSON", async () => {
    await expect(readJson(request("{}", { "Content-Type": "text/plain" }))).rejects.toMatchObject({ status: 415 });
    await expect(readJson(request("{"))).rejects.toMatchObject({ status: 400 });
  });
  it("preserves exact bytes for signature verification", async () => {
    const raw = '{ "name": "කේක්" }\n';
    expect(new TextDecoder().decode(await readBoundedBody(request(raw)))).toBe(raw);
  });
});

describe("Shared rate limits", () => {
  it("returns a retry interval when the database budget is exhausted", async () => {
    boundary.query.mockResolvedValue([]);
    await expect(enforceRateLimit("login", "test", 3, 60)).rejects.toBeInstanceOf(RequestSecurityError);
    await expect(enforceRateLimit("login", "test", 3, 60)).rejects.toMatchObject({ status: 429, retryAfter: expect.any(Number) });
  });
  it("does not trust caller-controlled forwarding headers by default", () => {
    vi.stubEnv("VERCEL", ""); vi.stubEnv("TRUSTED_CLIENT_IP_HEADER", "");
    expect(clientAddress(request("{}", { "X-Forwarded-For": "1.2.3.4" }))).toBe("shared-ingress");
    vi.stubEnv("TRUSTED_CLIENT_IP_HEADER", "x-real-ip");
    expect(clientAddress(request("{}", { "x-real-ip": "1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientAddress(request("{}", { "x-real-ip": "not-an-ip" }))).toBe("shared-ingress");
  });
  it("fails closed when the shared limiter is unavailable", async () => {
    boundary.query.mockRejectedValue(new Error("offline"));
    await expect(enforceRateLimit("login", "test", 3, 60)).rejects.toThrow("offline");
  });
});
