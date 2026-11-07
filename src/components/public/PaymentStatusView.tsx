"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Clock, Lock, LoaderCircle, X, RotateCcw, AlertCircle } from "lucide-react";
import { CustomerProgressBar } from "./CustomerProgressBar";
import { formatLKR } from "@/lib/domain/pricing";

interface Access { orderNumber: string; accessToken: string }
interface Status {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: string;
  pickup: { branch: string; address: string; readyDate: string };
  latestPaymentAttempt: { status: string; failureMessage: string | null; expiresAt: string | null } | null;
}

export function PaymentStatusView({ orderNumber, result }: { orderNumber: string; result: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [missingAccess, setMissingAccess] = useState(false);
  const [checkVersion, setCheckVersion] = useState(0);
  const [starting, setStarting] = useState(false);
  const access = useRef<Access | null>(null);
  const retryLock = useRef(false);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const deadline = Date.now() + 26000;
    async function check() {
      try {
        let saved: Access | null = null;
        try { saved = JSON.parse(sessionStorage.getItem("wasana_active_order") || "null"); }
        catch { setMissingAccess(true); setChecking(false); return; }
        if (!orderNumber || !saved || saved.orderNumber !== orderNumber || typeof saved.accessToken !== "string" || !saved.accessToken) {
          setMissingAccess(true); setChecking(false); return;
        }
        access.current = { orderNumber, accessToken: saved.accessToken };
        const response = await fetch("/api/payments/status", { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(access.current), signal: controller.signal });
        if (!response.ok) {
          if ([400, 401, 403, 404].includes(response.status)) setMissingAccess(true);
          throw new Error("Unable to check payment status. Please try again shortly.");
        }
        const next: Status = await response.json();
        if (stopped) return;
        setStatus(next); setError("");
        const terminal = ["PAID", "REFUNDED"].includes(next.paymentStatus) || next.orderStatus !== "PAYMENT_PENDING" ||
          ["FAILED", "EXPIRED"].includes(next.latestPaymentAttempt?.status || "");
        if (result === "success" && !terminal && Date.now() < deadline) timer = setTimeout(check, 2000);
        else setChecking(false);
      } catch {
        if (!stopped) { setError("We couldn’t check your payment just now. Please try again."); setChecking(false); }
      }
    }
    void check();
    return () => { stopped = true; controller.abort(); if (timer) clearTimeout(timer); };
  }, [orderNumber, result, checkVersion]);

  async function retry() {
    if (!access.current || retryLock.current) return;
    retryLock.current = true; setStarting(true); setError("");
    try {
      const response = await fetch("/api/payments/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(access.current) });
      const payment = await response.json();
      if (!response.ok) {
        if ([401, 403, 404].includes(response.status)) setMissingAccess(true);
        throw new Error("Unable to start payment");
      }
      if (payment.alreadyPaid) window.location.reload();
      else window.location.assign(payment.checkoutUrl);
    } catch {
      setError("We couldn’t open secure checkout. Your order is saved. Please try again shortly.");
      retryLock.current = false; setStarting(false);
    }
  }

  const paid = status?.paymentStatus === "PAID";
  const attempt = status?.latestPaymentAttempt;
  const unavailable = missingAccess || (!checking && !status);
  const expired = attempt?.status === "EXPIRED";
  const failed = attempt?.status === "FAILED" || status?.paymentStatus === "FAILED";
  const cancelled = status?.orderStatus === "CANCELLED" || result === "cancelled";
  const refunded = status?.paymentStatus === "REFUNDED";
  const canRetry = !checking && !unavailable && !paid && status?.orderStatus === "PAYMENT_PENDING" && !refunded;
  const title = unavailable ? "We couldn't open this order." : checking ? "Checking your payment"
    : paid ? "Payment successful" : refunded ? "Payment refunded" : failed ? "Payment was unsuccessful"
    : expired ? "Payment session expired" : cancelled ? "Payment cancelled" : "Payment confirmation pending";
  const message = unavailable ? "Please return to the checkout and try again."
    : checking ? "We're confirming the payment securely."
    : paid ? "Your cake order is confirmed."
    : refunded ? "This payment has been refunded. Please contact the bakery if you need help."
    : failed ? "No confirmed payment was recorded. You can try again with your saved order."
    : expired ? "Start a fresh payment session for your saved order."
    : cancelled ? "Your order is still saved and has not been marked as paid."
    : "We haven't received final payment confirmation yet.";
  const Icon = unavailable ? AlertCircle : checking ? LoaderCircle : paid ? Check : failed || cancelled ? X : Clock;
  const badge = paid ? "Paid" : refunded ? "Refunded" : failed ? "Failed" : expired ? "Expired" : cancelled ? "Cancelled" : "Pending";
  const tone = paid ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : failed ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-amber-50 text-amber-900 border-amber-200";
  const primary = "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60";
  const secondary = "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700";

  function checkAgain() {
    setChecking(true);
    setError("");
    setCheckVersion(value => value + 1);
  }

  return (
    <div className="pb-16">
      <div className="border-b border-stone-200 bg-white">
        <CustomerProgressBar currentStep={paid && !unavailable ? 4 : 3} />
      </div>
      <section className="mx-auto max-w-xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="p-5 text-center sm:p-8">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-amber-800">Wasana Bakers · Checkout</p>
            <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border ${tone}`}>
              <Icon aria-hidden="true" className={`h-6 w-6 ${checking && !unavailable ? "motion-safe:animate-spin" : ""}`} />
            </div>
            <div role="status" aria-live="polite" aria-atomic="true">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{message}</p>
            </div>
          </div>

          {status && !unavailable && (
            <div className="mx-5 mb-6 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:mx-8 sm:p-5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-700">Your order</h2>
              <dl className="space-y-4 text-sm">
                <div><dt className="text-xs text-stone-600">Order number</dt><dd className="mt-1 break-all font-semibold text-stone-900">{status.orderNumber}</dd></div>
                <div><dt className="text-xs text-stone-600">{paid ? "Total paid" : "Order total"}</dt><dd className="mt-1 break-words text-2xl font-bold tabular-nums text-amber-900">{formatLKR(status.total)}</dd></div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0"><dt className="text-xs text-stone-600">Pickup branch</dt><dd className="mt-1 break-words font-semibold text-stone-900">{status.pickup.branch}</dd></div>
                  <div><dt className="text-xs text-stone-600">Ready date</dt><dd className="mt-1 font-semibold text-stone-900"><time dateTime={status.pickup.readyDate}>{status.pickup.readyDate}</time></dd></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4"><dt className="text-stone-600">Payment</dt><dd className={`rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>{badge}</dd></div>
              </dl>
            </div>
          )}

          <div className="space-y-3 px-5 pb-6 sm:px-8 sm:pb-8">
            {error && !unavailable && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">{error}</p>}
            {unavailable ? <Link href="/cakes" className={primary}>Return to cakes</Link>
              : paid ? <><Link href="/cakes" className={primary}>Continue browsing cakes</Link><Link href="/" className={secondary}>Back to home</Link></>
              : <>
                {!checking && <button type="button" onClick={checkAgain} disabled={starting} className={canRetry && (failed || expired || cancelled) ? secondary : primary}>Check again</button>}
                {canRetry && <button type="button" onClick={retry} disabled={starting} className={failed || expired || cancelled ? primary : secondary}>
                  {starting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}
                  {starting ? "Preparing secure payment…" : expired ? "Start payment again" : cancelled ? "Continue to payment" : "Try payment again"}
                </button>}
                {starting && <p role="status" className="text-center text-xs leading-relaxed text-stone-600">Opening secure checkout for your saved order.</p>}
                <Link href="/cakes" className={secondary}>Back to cakes</Link>
              </>}
            {canRetry && <p className="flex items-start justify-center gap-2 pt-2 text-xs leading-relaxed text-stone-600"><Lock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Complete your payment on the secure checkout page. Your existing order will be used.</span></p>}
          </div>
        </div>
      </section>
    </div>
  );
}
