import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderService } from "@/lib/services/order-service";
import { getAdminSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/roles";
import { formatLKR } from "@/lib/domain/pricing";
import {
  ArrowLeft, User, MapPin, CreditCard, History, CalendarClock, Phone, Mail, Cake,
} from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Order Details | Wasana Bakers Admin",
};

const PAYMENT_TONE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-900 border-amber-200",
  FAILED: "bg-rose-50 text-rose-800 border-rose-200",
  REFUNDED: "bg-stone-100 text-stone-700 border-stone-300",
};

const STATUS_TONE: Record<string, string> = {
  PAYMENT_PENDING: "bg-amber-50 text-amber-900 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PREPARING: "bg-sky-50 text-sky-800 border-sky-200",
  READY_FOR_PICKUP: "bg-indigo-50 text-indigo-800 border-indigo-200",
  COMPLETED: "bg-stone-100 text-stone-700 border-stone-300",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-200",
};

const ATTEMPT_TONE: Record<string, string> = {
  CREATING: "bg-stone-100 text-stone-700 border-stone-300",
  OPEN: "bg-sky-50 text-sky-800 border-sky-200",
  SUCCEEDED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-800 border-rose-200",
  EXPIRED: "bg-amber-50 text-amber-900 border-amber-200",
};

const EVENT_RESULT_TONE: Record<string, string> = {
  PROCESSED: "bg-emerald-50 text-emerald-800",
  IGNORED: "bg-amber-50 text-amber-900",
  REJECTED: "bg-rose-50 text-rose-800",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (!Permissions.canViewOrders(session.role)) {
    redirect("/admin/products");
  }

  const { id } = await params;
  const order = await OrderService.getAdminOrderDetail(id);
  if (!order) {
    notFound();
  }

  const fmtDateTime = (d: Date | string) =>
    new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
              Order {order.orderNumber}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Placed {fmtDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${PAYMENT_TONE[order.paymentStatus] ?? "bg-stone-100 text-stone-700 border-stone-300"}`}>
            {order.paymentStatus}
          </span>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${STATUS_TONE[order.orderStatus] ?? "bg-stone-100 text-stone-700 border-stone-300"}`}>
            {order.orderStatus.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer + Arrival */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              Customer
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Name</dt>
                <dd className="mt-0.5 font-semibold text-stone-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Email</dt>
                <dd className="mt-0.5 font-medium text-stone-800 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-stone-400" />{order.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Phone</dt>
                <dd className="mt-0.5 font-medium text-stone-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{order.phonePrimary}</span>
                </dd>
              </div>
              {order.phoneSecondary && (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Secondary phone</dt>
                  <dd className="mt-0.5 font-medium text-stone-800">{order.phoneSecondary}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              Pickup
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Branch</dt>
                <dd className="mt-0.5 font-semibold text-stone-900">{order.branch.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Branch address</dt>
                <dd className="mt-0.5 text-stone-700">{order.branch.address}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Ready date</dt>
                <dd className="mt-0.5 font-medium text-stone-800 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-stone-400" />
                  <time dateTime={order.readyDate.toISOString().slice(0, 10)}>
                    {order.readyDate.toLocaleDateString("en-GB", { dateStyle: "full" })}
                  </time>
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment summary */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Payment summary
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-600">Subtotal</dt>
                <dd className="font-mono font-semibold text-stone-900">{formatLKR(order.subtotal.toString())}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-600">Customizations</dt>
                <dd className="font-mono font-semibold text-stone-900">{formatLKR(order.customizationTotal.toString())}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-2.5">
                <dt className="font-bold text-stone-900">Total</dt>
                <dd className="font-mono text-lg font-bold text-amber-900">{formatLKR(order.total.toString())}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <dt className="text-stone-600">Paid at</dt>
                <dd className="text-stone-800">{order.paidAt ? fmtDateTime(order.paidAt) : "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Items + payment history */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <Cake className="w-4 h-4 text-amber-600" />
              Ordered cakes ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const thumbnail = item.product?.images[0]?.url ?? item.productImageSnapshot ?? null;
                return (
                <div key={item.id} className="flex gap-4 rounded-xl border border-stone-200 p-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    {thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={item.productNameSnapshot}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-stone-900">
                          {item.productNameSnapshot}
                          {item.productId === null && (
                            <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 align-middle">
                              deleted cake
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">/cakes/{item.productSlugSnapshot}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-stone-900 font-mono">{formatLKR(item.basePriceSnapshot.toString())}</p>
                      </div>
                    </div>
                    {item.customizations.length > 0 && (
                      <ul className="mt-2.5 space-y-1">
                        {item.customizations.map((c) => (
                          <li key={c.id} className="text-xs text-stone-600 flex flex-wrap items-baseline gap-x-2">
                            <span className="font-semibold text-stone-800">{c.groupNameSnapshot}:</span>
                            <span>
                              {c.optionLabelSnapshot ? c.optionLabelSnapshot : c.textValue ? `“${c.textValue}”` : "—"}
                              {Number(c.priceAdjustmentSnapshot) !== 0 && (
                                <span className={`ml-1.5 font-mono font-semibold ${Number(c.priceAdjustmentSnapshot) > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                                  {Number(c.priceAdjustmentSnapshot) > 0 ? "+" : ""}
                                  {formatLKR(c.priceAdjustmentSnapshot.toString())}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Payment attempts */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              Payment attempts ({order.paymentAttempts.length})
            </h2>
            {order.paymentAttempts.length === 0 ? (
              <p className="text-xs text-stone-500">No payment attempts were recorded for this order.</p>
            ) : (
              <ol className="space-y-3">
                {order.paymentAttempts.map((attempt, idx) => (
                  <li key={attempt.id} className="flex items-start gap-4 rounded-xl border border-stone-200 p-4">
                    <span className="mt-0.5 grow-0 font-mono text-[11px] font-bold text-stone-500">
                      #{order.paymentAttempts.length - idx}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${ATTEMPT_TONE[attempt.status] ?? "bg-stone-100 text-stone-700 border-stone-300"}`}>
                          {attempt.status}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {attempt.provider} · {attempt.mode}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-stone-700">
                          {formatLKR(attempt.amountCents.toString().replace(/(\d{2})$/, ".$1"))} LKR
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Started {fmtDateTime(attempt.createdAt)}
                        {attempt.succeededAt ? ` · succeeded ${fmtDateTime(attempt.succeededAt)}` : ""}
                      </p>
                      {attempt.failureMessage && (
                        <p className="text-[11px] text-rose-700">{attempt.failureMessage}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Payment events ledger */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-3 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              Payment events ({order.paymentEvents.length})
            </h2>
            {order.paymentEvents.length === 0 ? (
              <p className="text-xs text-stone-500">No gateway events were recorded for this order.</p>
            ) : (
              <ol className="divide-y divide-stone-100">
                {order.paymentEvents.map((event) => (
                  <li key={event.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${EVENT_RESULT_TONE[event.result] ?? "bg-stone-100 text-stone-700"}`}>
                        {event.result}
                      </span>
                      <span className="text-xs font-mono font-semibold text-stone-800">{event.eventType}</span>
                      <span className="text-[11px] font-mono text-stone-400">{event.provider}</span>
                      {event.reason && <span className="text-[11px] text-rose-700">({event.reason})</span>}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Received {fmtDateTime(event.receivedAt)}
                      {event.processedAt ? ` · processed ${fmtDateTime(event.processedAt)}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
