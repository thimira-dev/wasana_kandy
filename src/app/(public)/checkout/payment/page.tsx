import Link from "next/link";
import { CustomerProgressBar } from "@/components/public/CustomerProgressBar";
import { OrderService } from "@/lib/services/order-service";
import { formatLKR } from "@/lib/domain/pricing";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Store,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Payment Stage | Wasana Bakers",
};

interface PaymentPageProps {
  searchParams: Promise<{
    orderNumber?: string;
    token?: string;
  }>;
}

export default async function CheckoutPaymentPage({ searchParams }: PaymentPageProps) {
  const { orderNumber, token } = await searchParams;

  let order = null;
  if (orderNumber && token) {
    order = await OrderService.getOrderByNumberAndToken(orderNumber, token);
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
      {/* Progress Bar (Step 3 Active, Steps 1 and 2 Complete) */}
      <div className="bg-white border-b border-stone-200">
        <CustomerProgressBar currentStep={3} />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        {!order ? (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-stone-900">
              Order Information Not Found
            </h1>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              We could not locate this pending order with the provided secure token, or the link has expired.
            </p>
            <div className="pt-2">
              <Link
                href="/cakes"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                <span>Return to Cake Catalogue</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
                <CreditCard className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
                Order Prepared for Payment
              </h1>
              <p className="text-xs sm:text-sm text-stone-600">
                Your custom celebration cake order has been validated and recorded.
              </p>
            </div>

            {/* Order Card */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                    Order Reference
                  </span>
                  <span className="text-lg font-mono font-bold text-stone-900">
                    {order.orderNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.orderStatus}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                    <span>Payment: {order.paymentStatus}</span>
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Total amount highlight */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-stone-700">Total Payable Amount:</span>
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-800">
                    {formatLKR(order.total.toString())}
                  </span>
                </div>

                {/* Pickup & Customer summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/50 space-y-1">
                    <span className="text-stone-400 font-medium block flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>Collection Branch</span>
                    </span>
                    <span className="font-bold text-stone-900 block text-sm">
                      {order.branch.name}
                    </span>
                    <span className="text-stone-500 block">
                      {order.branch.address}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/50 space-y-1">
                    <span className="text-stone-400 font-medium block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Cake Ready Date</span>
                    </span>
                    <span className="font-bold text-stone-900 block text-sm">
                      {new Date(order.readyDate).toISOString().split("T")[0]}
                    </span>
                    <span className="text-stone-500 block">
                      Customer: {order.customerName}
                    </span>
                  </div>
                </div>

                {/* Items snapshot list */}
                <div className="border-t border-stone-100 pt-4">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                    Cake Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-stone-200 bg-white space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-stone-900 text-sm">
                            {item.productNameSnapshot}
                          </span>
                          <span className="font-mono text-stone-600">
                            Base: {formatLKR(item.basePriceSnapshot.toString())}
                          </span>
                        </div>

                        {item.customizations.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-stone-100 text-[11px] text-stone-600">
                            {item.customizations.map((c) => (
                              <div key={c.id} className="flex justify-between">
                                <span>
                                  <strong>{c.groupNameSnapshot}:</strong>{" "}
                                  {c.optionLabelSnapshot || c.textValue || "-"}
                                </span>
                                {Number(c.priceAdjustmentSnapshot) > 0 && (
                                  <span className="font-mono">
                                    +{formatLKR(c.priceAdjustmentSnapshot.toString())}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Future Payment Gateway Notice */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Payment Gateway Integration Point</span>
                  </div>
                  <p>
                    Your order has been safely persisted in our system with status{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">
                      PAYMENT_PENDING
                    </code>
                    . The PayHere payment gateway, customer SMS/email notifications, and branch fulfillment
                    workflows will be connected in Part 3.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/cakes"
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl bg-stone-800 text-white hover:bg-stone-700 transition-colors"
                  >
                    <span>Browse More Cakes</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
