-- Existing orders were created before a live gateway was available; classify them as tests.
ALTER TABLE "orders" ADD COLUMN "checkoutOwnerHash" TEXT,
    ADD COLUMN "requestFingerprint" TEXT,
    ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "paymentReviewRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userVersion" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "admin_sessions_expiresAt_idx" ON "admin_sessions"("expiresAt");
CREATE INDEX "admin_sessions_userId_idx" ON "admin_sessions"("userId");
CREATE TABLE "request_rate_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "request_rate_limits_expiresAt_idx" ON "request_rate_limits"("expiresAt");
