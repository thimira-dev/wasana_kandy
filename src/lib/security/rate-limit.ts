import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { prisma } from "@/lib/prisma";
import { RequestSecurityError } from "./requests";

export function clientAddress(request: Request): string {
  // Trust only a header overwritten by the deployment's ingress. Never trust arbitrary X-Forwarded-For.
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : process.env.TRUSTED_CLIENT_IP_HEADER;
  const value = header ? request.headers.get(header)?.split(",")[0].trim() : undefined;
  return value && isIP(value) ? value : "shared-ingress";
}

export async function enforceRateLimit(policy: string, subject: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
  const expiresAt = new Date(windowStart + windowSeconds * 1000);
  const key = createHash("sha256").update(JSON.stringify([policy, subject, windowStart])).digest("hex");
  // PostgreSQL provides an atomic budget shared by every application instance.
  // Bounded cleanup prevents expired buckets from accumulating indefinitely.
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    WITH cleanup AS (
      DELETE FROM request_rate_limits WHERE id IN (
        SELECT id FROM request_rate_limits WHERE "expiresAt" < ${new Date(now)} LIMIT 100
      )
    )
    INSERT INTO request_rate_limits (id, count, "expiresAt") VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT (id) DO UPDATE SET count = request_rate_limits.count + 1
      WHERE request_rate_limits.count < ${limit}
    RETURNING count`;
  if (!rows.length) throw new RequestSecurityError("Too many requests. Please try again shortly.", 429,
    Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)));
}
