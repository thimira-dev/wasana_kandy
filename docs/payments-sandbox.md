# Payments — simulated gateway phase

This integration preserves single-cake guest checkout. No real gateway is connected yet, so the
application ships a built-in **simulated gateway**: a customer-facing checkout page that mints
signed, webhook-style events into the exact same payment pipeline a real provider would use.
Payment attempts, ledger events, order confirmation and retry semantics all run unchanged — which
means orders/payments already appear correctly on the admin dashboard, and installing PayHere later
only requires a new provider adapter. Live checkout is deliberately blocked. No card data enters
Wasana, and no real money ever moves.

## How the simulation works

1. The customer presses "Pay now"; `PaymentService.createCheckout` records a `PaymentAttempt`
   (provider `SIMULATION`) and calls `SimulatedPaymentProvider.createCheckout`, which returns a URL
   on our own origin: `/checkout/simulate?c=<checkoutId>&t=<token>`.
2. The token is `HMAC-SHA256(PAYMENT_SIMULATION_SECRET, checkoutId)`, truncated to 32 hex chars —
   unforgeable, and validated server-side before anything is loaded or recorded.
3. The simulate page shows the order number and total with two buttons: **Complete payment**
   (simulated success) and **Fail payment** (simulated decline). Both POST the decision to
   `/api/payments/simulate`.
4. The trampoline re-verifies the token and attempt state (open, unexpired, order still
   `PAYMENT_PENDING`), fabricates a fresh event (`evt_sim_<uuid>`, correct amount/reference/currency,
   mode `test`), signs the exact raw body with the same secret, and hands it to
   `PaymentService.processWebhook` — the same code path used for real gateway webhooks. Dedupe,
   advisory locks, state transitions and order confirmation all behave as they would in production.
5. The customer is redirected to the normal `/checkout/payment` status page, which polls the
   authorized status endpoint and shows the authoritative result.

Double submissions and late decisions are safely refused: settled orders return the customer to the
status page without touching state, and every stamped event remains a durable ledger row.

## Configuration

Server-only environment variables (see `.env.example`):

- `PAYMENT_PROVIDER`: `simulation` (the only enabled provider until PayHere is integrated).
- `PAYMENT_MODE`: `test`. `live` throws — a real gateway rollout is a separate reviewed change.
- `PAYMENT_SIMULATION_SECRET`: signing secret for checkout links and events, ≥ 32 chars. Required
  in production; outside production a fixed dev fallback keeps local setup zero-config.
- `APP_URL`: canonical application origin (no path/query/credentials). In development, localhost
  HTTP origins are accepted; hosted checkout URLs from external providers must be HTTPS.

The database enum `PaymentProviderName` keeps the historical `PAYMENTS_LK` value so previously
recorded attempts/events still decode; new rows are stamped `SIMULATION` (migration
`20261107115000_simulation_payment_provider`).

The generic webhook route `POST /api/payments/webhook` stays for future providers and expects an
`X-Payment-Signature` header with the exact raw body. The simulation does not use this route — its
events are minted in-process with the identical signature semantics.

## Customer flow notes

- Failure is presented by the demo provider as a declined payment; the order stays
  `PAYMENT_PENDING`, the attempt becomes `FAILED`, and "Retry payment" starts a fresh attempt on the
  same order (no duplicate order).
- A simulated checkout session expires after 60 minutes; retrying issues a new attempt.
- Return URLs contain the order reference and a UI result hint, never the guest access token. The
  token stays in `wasana_active_order` in sessionStorage.
- Opening the status URL without the matching browser session exposes no order details. Changing
  `result=success` never alters payment state.

## Admin dashboard (view-only)

`/admin/orders` (visible to SUPER_ADMIN and PRODUCT_MANAGER) shows stats — paid revenue, orders
awaiting payment, confirmed/preparing, and totals — plus a searchable, filterable table of all
orders with payment and fulfilment states. `/admin/orders/<id>` shows the customer, pickup branch,
items with customizations, every payment attempt and every payment ledger event. The dashboard is
intentionally read-only: no charge, capture, refund or cancel actions. Fulfilment status updates and
refunds, when introduced, must reuse the payment pipeline rather than direct edits.

## Retry and event behavior

Each local attempt has one deterministic provider idempotency key. Creation and webhook transitions
lock the order row; event processing also locks event identity and enforces a database uniqueness
constraint. Ambiguous provider failures preserve the CREATING attempt and retry the same key. After
23 hours, ambiguous attempts require manual review rather than risking a new checkout after the
provider's key-retention window. Events persist only safe identifiers/results, not raw payloads or
signature headers. Immutable mismatches are durably rejected and acknowledged; transient database
failures return 503.

On success return, the browser polls our authorized POST status endpoint every two seconds for up to
26 seconds and stops on a terminal state. After the bounded window, refresh to check again. There is
no provider polling/reconciliation job in this phase.

## Verification

- `npx prisma validate`
- `npx prisma generate`
- `npx tsc --noEmit --incremental false`
- `npm run lint`
- `npm test`
- `npm run build`

Payment service/route tests mock persistence boundaries; the simulation provider tests exercise real
HMAC token/signature verification locally without network calls. Database-lock concurrency still
requires isolated PostgreSQL integration verification; run the full suite only against a separately
confirmed isolated test database.

## Before installing the real gateway (PayHere)

1. Add `PAYHERE` to the `PaymentProviderName` enum (migration) and to the provider map in
   `src/lib/payments/config.ts`.
2. Implement `PayHereProvider` against the `PaymentProvider` interface in
   `src/lib/payments/payment-provider.ts` — hosted checkout plus IPN signature verification (MD5
   hash over merchant-sorted parameters is PayHere's scheme; keep raw-body verification for event
   handlers that support it).
3. Wire the adapter in `src/lib/payments/runtime.ts`; set `PAYMENT_PROVIDER=payhere` plus merchant
   credentials/secret in the environment.
4. Delete or gate `SimulatedPaymentProvider` and `src/app/(public)/checkout/simulate` behind the
   provider so demo pages cannot be reached in a live deployment.
5. Exercise the sandbox end-to-end (success, decline, expiry, retry, redelivery dedupe) and
   PostgreSQL concurrency validation; define monitoring, reconciliation, and
   cancellation-after-payment handling. Live mode needs an explicit reviewed change — it cannot be
   activated by setting a live key today.
