# Deployment requirements

Apply `npx prisma migrate deploy` to the deployment database before starting this revision, then run `npx prisma generate` and `npm run build`. The migration adds revocable admin sessions, shared request budgets, checkout owner fingerprints, test-order classification, and a flag for payments requiring fulfilment review. It classifies existing orders as tests because no live gateway was available when they were created. Verify historical data before importing any real transactions.

## Vercel Hobby test deployment

The repository's `vercel.json` runs `npm run build:vercel`: configuration validation, `prisma migrate deploy`, then the production build. If the project has an existing dashboard Build Command override, set it to `npm run build:vercel` as well. A missing setting or failed migration stops deployment before the application build. Seeding is intentionally separate and never runs during deployment.

Use a Supabase project dedicated to this test site. Set these variables in Vercel for the environment being deployed (including **Production** when deploying `main`, even though the site is for testing):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Test Supabase PostgreSQL session-pooler connection URL, port 5432; URL-encode special characters in the password |
| `AUTH_SECRET` | Random secret of at least 32 characters |
| `APP_URL` | Stable HTTPS origin used to open the test site, without a trailing path |
| `NEXT_PUBLIC_APP_URL` | Same origin as `APP_URL` |
| `STORAGE_PROVIDER` | `supabase` |
| `SUPABASE_URL` | Test Supabase project's HTTPS origin |
| `SUPABASE_SERVICE_ROLE_KEY` | Test project's server-only service role key |
| `SUPABASE_STORAGE_BUCKET` | Existing public product-image bucket, for example `cake-images` |
| `PAYMENT_PROVIDER` | `simulation` |
| `PAYMENT_MODE` | `test` |
| `PAYMENT_ALLOW_SIMULATION` | `true` |
| `PAYMENT_SIMULATION_SECRET` | Another independently generated random secret of at least 32 characters |

Generate each secret separately with `openssl rand -hex 32`. Do not paste credentials into GitHub or commit `.env`. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` only when provisioning an initial administrator with `npm run seed`; builds do not create an account. Create the storage bucket before testing image uploads.

Use the stable domain configured in `APP_URL` for checkout and admin mutations. A different deployment-specific or preview URL will fail the exact-origin check. Give previews their own database and matching stable origin before enabling checkout there.

Run `npm run check:deployment` with the intended deployment variables to check them without applying a migration. This validates configuration format, not remote credentials or storage bucket availability. After setting variables, deploy again so the new values take effect.

Existing administrators must sign in again. Old JWTs are intentionally invalid. Sessions expire after eight hours, are revoked by logout, and stop working when the user is disabled or their credentials/account record changes. Expired session rows can be periodically removed with `DELETE FROM admin_sessions WHERE "expiresAt" < NOW()`.

## Configuration

- Set a randomly generated `AUTH_SECRET` of at least 32 characters, for example from `openssl rand -hex 32`. There is no development fallback. `JWT_SECRET` is accepted for compatibility but should not be set to a separate value.
- Set `APP_URL` to the canonical HTTPS origin, without credentials, query parameters, or a path. All browser mutation endpoints require an exact matching Origin. Gateway webhooks use signatures and are exempt from Origin checks.
- Set `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 14 characters when creating the initial administrator. Catalogue seeding preserves existing passwords, roles and account status. Password rotation must be explicit.
- On Vercel, request budgets use Vercel's overwritten client-IP header. On another host, set `TRUSTED_CLIENT_IP_HEADER` only to a header your ingress overwrites (for example `x-real-ip`). Do not configure a header that clients can supply unchanged. Without a trusted address, requests share a conservative ingress budget. Keep the database request-budget table available; protected operations fail closed if it cannot be reached.
- Additional remote product-image hosts must be explicitly listed in `IMAGE_REMOTE_HOSTS` (comma-separated exact HTTPS hostnames). Unsplash and Supabase hosts are already allowed; arbitrary HTTP/HTTPS image sources are no longer accepted.
- Use persistent object storage in production. Configure `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. Keep the service role key server-only. Accepted JPEG/PNG/WebP/AVIF uploads are decoded, limited to 25 megapixels, and converted to static WebP; original metadata and filename extensions are discarded. Existing uploads should be audited separately.

## Payments

A real payment provider is **not implemented**. Production simulation is disabled by default, and payment/order creation fails closed when no usable provider is configured. Do not enable simulation on the customer-facing live deployment.

For an isolated staging environment only, use a separate database, `PAYMENT_PROVIDER=simulation`, `PAYMENT_MODE=test`, a random `PAYMENT_SIMULATION_SECRET` of at least 32 characters, and `PAYMENT_ALLOW_SIMULATION=true`. Test orders are prominently labelled and excluded from paid revenue.

Pending orders can start payment for at most 24 hours and must still satisfy the four-calendar-day preparation rule in Asia/Colombo. An expired checkout requires a new order. A verified success received for a payment that occurred outside that window records the payment but leaves fulfilment unconfirmed and marks the order for bakery review. Arrange a new pickup date or refund manually before preparing it. A timely success event delivered late uses the provider's payment timestamp.

## Validation

`npm test` runs the unit tests and skips database suites unless a dedicated test URL is explicitly supplied. It does not use the application's database for integration tests.

Run the full suite only against a disposable PostgreSQL database. Provision it, then run:

```sh
TEST_DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/wasana_test" npm run test:integration
```

The runner requires `TEST_DATABASE_URL`, applies all migrations, and sets both `DATABASE_URL` and `SECURITY_TEST_DATABASE_URL` to that disposable database. It never falls back to the application's `.env` database. The security integration suite verifies concurrent order retries, checkout registration, database-backed rate budgets, session revocation, simulation revenue exclusion, and late-payment review. Never point test databases at the deployed site's database.

Before accepting actual payments, install and validate a real gateway adapter, test its sandbox webhooks and reconciliation, verify deployment environment variables, and run a staging checkout through the admin order view.
