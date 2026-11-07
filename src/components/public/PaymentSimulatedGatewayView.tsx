import { CheckCircle2, ShieldAlert, Undo2 } from "lucide-react";
import { CustomerProgressBar } from "./CustomerProgressBar";
import { formatLKR } from "@/lib/domain/pricing";

export interface SimulatedCheckout {
  checkoutId: string;
  token: string;
  orderNumber: string;
  orderTotal: string;
  description: string;
}

/**
 * Replica of a hosted payment gateway page, used by the SIMULATION provider.
 * Submissions route through the real payment pipeline (signed event + webhook
 * processing), so nothing here ever touches a real card or money movement.
 */
export function SimulatedCheckoutView({ checkout }: { checkout: SimulatedCheckout }) {
  const primary =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700";
  const decline =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-rose-800 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600";
  const neutralSecondary =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700";

  return (
    <div className="pb-16">
      <div className="border-b border-stone-200 bg-white">
        <CustomerProgressBar currentStep={3} />
      </div>
      <section className="mx-auto max-w-xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="p-5 text-center sm:p-8">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-amber-800">Wasana Bakers · Payment</p>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-50 bg-amber-50 text-amber-900" aria-hidden="true">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div role="status" aria-live="polite" aria-atomic="true">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Simulated payment gateway</h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                No real payment gateway is connected yet. Choose an outcome below to confirm or decline the
                payment exactly as a gateway would record it.
              </p>
            </div>
          </div>

          <div className="mx-5 mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:mx-8 sm:p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-700">{checkout.description}</h2>
            <dl className="space-y-4 text-sm">
              <div><dt className="text-xs text-stone-600">Order number</dt><dd className="mt-1 break-all font-semibold text-stone-900">{checkout.orderNumber}</dd></div>
              <div><dt className="text-xs text-stone-600">Order total</dt><dd className="mt-1 break-words text-2xl font-bold tabular-nums text-amber-900">{formatLKR(checkout.orderTotal)}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4">
                <dt className="text-stone-600">Simulation mode</dt>
                <dd className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Test · no real money</dd>
              </div>
            </dl>
          </div>

          <form action="/api/payments/simulate" method="post" className="space-y-3 px-5 pb-6 sm:px-8 sm:pb-8">
            <input type="hidden" name="checkoutId" value={checkout.checkoutId ?? ""} />
            <input type="hidden" name="token" value={checkout.token ?? ""} />
            <button type="submit" name="decision" value="succeed" className={primary}>
              Complete payment (simulate success)
            </button>
            <button type="submit" name="decision" value="fail" className={decline}>
              Fail payment (simulate decline)
            </button>
          </form>

          <div className="space-y-3 px-5 pb-8 sm:px-8">
            <a href={`/checkout/payment?orderNumber=${encodeURIComponent(checkout.orderNumber)}`} className={neutralSecondary}>
              <Undo2 aria-hidden="true" className="h-4 w-4" />
              Back to payment status
            </a>
            <p className="flex items-start justify-center gap-2 pt-2 text-xs leading-relaxed text-stone-600">
              <ShieldAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>This page will be replaced by the real payment gateway when PayHere is connected. No card details are collected here.</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SimulatedCheckoutNotice({ orderNumber, tone }: {
  orderNumber: string | null;
  tone: "settled" | "invalid" | "missing";
}) {
  const neutralSecondary =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700";
  const title = tone === "settled" ? "Payment already settled" : tone === "invalid" ? "Simulated checkout unavailable" : "This checkout session could not be found";
  const message = tone === "settled"
    ? `Order ${orderNumber} already has a recorded payment outcome. Open the payment status page to see the latest result.`
    : tone === "invalid"
    ? "This simulated checkout link is not valid. Return to the order's payment page and start a fresh session."
    : "This simulated checkout session could not be found. Return to the order's payment page and start a fresh session.";
  const target = orderNumber ? `/checkout/payment?orderNumber=${encodeURIComponent(orderNumber)}` : "/cakes";

  return (
    <div className="pb-16">
      <div className="border-b border-stone-200 bg-white">
        <CustomerProgressBar currentStep={3} />
      </div>
      <section className="mx-auto max-w-xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="p-5 text-center sm:p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-900" aria-hidden="true">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div role="status" aria-live="polite" aria-atomic="true">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{message}</p>
            </div>
            <div className="mt-6">
              <a href={target} className={neutralSecondary}>Back to payment status</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
