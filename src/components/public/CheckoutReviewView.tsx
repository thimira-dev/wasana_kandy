"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Store,
  MapPin,
  Edit2,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  MessageSquare,
  StickyNote,
} from "lucide-react";
import { PendingOrderState } from "./CheckoutOrderSummary";
import { StoredCheckoutDetails, BranchData } from "./CheckoutDetailsForm";
import { formatLKR } from "@/lib/domain/pricing";

interface CheckoutReviewViewProps {
  branches: BranchData[];
}

export function CheckoutReviewView({ branches }: CheckoutReviewViewProps) {
  const router = useRouter();

  const [order, setOrder] = useState<PendingOrderState | null>(null);
  const [details, setDetails] = useState<StoredCheckoutDetails | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedOrder = sessionStorage.getItem("wasana_pending_order");
        const storedDetails = sessionStorage.getItem("wasana_checkout_details");

        if (storedOrder) setOrder(JSON.parse(storedOrder));
        if (storedDetails) setDetails(JSON.parse(storedDetails));

        // Generate client-side idempotency key for this checkout attempt
        const existingKey = sessionStorage.getItem("wasana_idempotency_key");
        if (existingKey) {
          setIdempotencyKey(existingKey);
        } else {
          const newKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          sessionStorage.setItem("wasana_idempotency_key", newKey);
          setIdempotencyKey(newKey);
        }
      } catch (err) {
        console.error("Error reading checkout review state:", err);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-stone-500">
        Preparing your order review...
      </div>
    );
  }

  // If order or details are missing, direct back appropriately
  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-stone-200 text-center shadow-xs">
        <h2 className="text-lg font-bold text-stone-900">No Cake Selected</h2>
        <p className="text-xs text-stone-600 mt-2">
          Please select a celebration cake before reviewing your order.
        </p>
        <Link
          href="/cakes"
          className="mt-6 inline-flex items-center justify-center px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700"
        >
          Return to Catalogue
        </Link>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-stone-200 text-center shadow-xs">
        <h2 className="text-lg font-bold text-stone-900">Missing Customer Information</h2>
        <p className="text-xs text-stone-600 mt-2">
          Please complete your contact details and branch selection first.
        </p>
        <Link
          href="/checkout/details"
          className="mt-6 inline-flex items-center justify-center px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700"
        >
          Fill Customer Details
        </Link>
      </div>
    );
  }

  const selectedBranch = branches.find((b) => b.id === details.branchId);

  // Group customizations
  const selectAdjustments =
    order.customizationSummary?.filter(
      (c) => c.fieldType === "SINGLE_SELECT" || c.fieldType === "MULTI_SELECT"
    ) || [];

  const textMessages =
    order.customizationSummary?.filter(
      (c) => (c.fieldType === "TEXT" || c.fieldType === "TEXTAREA") && c.labelOrValue?.trim().length > 0
    ) || [];

  const handleProceedToPayment = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customerName: details.customerName,
        customerEmail: details.customerEmail,
        phonePrimary: details.phonePrimary,
        phoneSecondary: details.phoneSecondary || null,
        branchId: details.branchId,
        readyDate: details.readyDate,
        productId: order.productId,
        selections: order.selections,
        idempotencyKey,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // Clear temporary session storage items on successful order persistence
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("wasana_pending_order");
          sessionStorage.removeItem("wasana_checkout_details");
          sessionStorage.removeItem("wasana_idempotency_key");
        } catch (e) {
          console.error("Storage cleanup error:", e);
        }
      }

      // Navigate to payment placeholder with safe tokens
      router.push(
        `/checkout/payment?orderNumber=${encodeURIComponent(
          data.order.orderNumber
        )}&token=${encodeURIComponent(data.order.accessToken)}`
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred while creating your order.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Notice */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Review Your Cake Order
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Please carefully verify your contact details, pickup location, date, and cake customizations before continuing.
          </p>
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-900">Order Creation Notice</p>
            <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: Customer Contact Review */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-amber-600" />
            <span>Customer Information</span>
          </h2>
          <Link
            href="/checkout/details"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-stone-400 block text-xs">Customer Name</span>
            <span className="font-semibold text-stone-900 block mt-0.5">
              {details.customerName}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-xs">Email Address</span>
            <span className="font-semibold text-stone-900 block mt-0.5">
              {details.customerEmail}
            </span>
          </div>

          <div>
            <span className="text-stone-400 block text-xs">Primary Phone</span>
            <span className="font-mono font-semibold text-stone-900 block mt-0.5">
              {details.phonePrimary}
            </span>
          </div>

          {details.phoneSecondary && (
            <div>
              <span className="text-stone-400 block text-xs">Secondary Phone</span>
              <span className="font-mono font-semibold text-stone-900 block mt-0.5">
                {details.phoneSecondary}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Pickup Location & Date Review */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Pickup Branch & Ready Date</span>
          </h2>
          <Link
            href="/checkout/details"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Pickup</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-stone-400 block text-xs">Collection Outlet</span>
            <span className="font-semibold text-stone-900 block mt-0.5">
              {selectedBranch?.name || "Selected Branch"}
            </span>
            <p className="text-stone-500 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{selectedBranch?.address}</span>
            </p>
          </div>

          <div>
            <span className="text-stone-400 block text-xs">Cake Ready Date</span>
            <span className="font-semibold text-stone-900 block mt-0.5 text-base text-amber-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{details.readyDate}</span>
            </span>
            <p className="text-stone-400 text-[11px] mt-0.5">
              Prepared fresh in Kandy with &ge; 4 calendar days notice.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Cake & Customizations Review */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Cake & Customization Breakdown</span>
          </h2>
          <Link
            href={`/cakes/${order.productSlug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Cake</span>
          </Link>
        </div>

        <div className="flex gap-4 items-center pb-4 border-b border-stone-100">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
            <Image
              src={
                order.productImage ||
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
              }
              alt={order.productName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-xs text-amber-700 font-semibold block">Wasana Signature</span>
            <h3 className="text-lg font-serif font-bold text-stone-900">
              {order.productName}
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              Base Price: {formatLKR(order.basePrice)}
            </span>
          </div>
        </div>

        {/* Selected options list */}
        {selectAdjustments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">
              Selected Customizations
            </h4>
            <div className="bg-stone-50 rounded-xl p-3 divide-y divide-stone-200/60 text-xs">
              {selectAdjustments.map((adj, i) => (
                <div key={i} className="py-1.5 flex justify-between items-center first:pt-0 last:pb-0">
                  <span className="text-stone-800">
                    <strong className="font-semibold">{adj.groupName}:</strong> {adj.labelOrValue}
                  </span>
                  <span className="font-mono text-stone-600 font-medium">
                    {Number(adj.priceAdjustment) > 0
                      ? `+${formatLKR(adj.priceAdjustment)}`
                      : "Included"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages and Notes */}
        {textMessages.length > 0 && (
          <div className="space-y-2">
            {textMessages.map((msg, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5 mb-1">
                  {msg.fieldType === "TEXT" ? (
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <StickyNote className="w-3.5 h-3.5 text-stone-500" />
                  )}
                  <span>{msg.groupName}</span>
                </span>
                <p className="text-stone-800 italic whitespace-pre-line">&ldquo;{msg.labelOrValue}&rdquo;</p>
              </div>
            ))}
          </div>
        )}

        {/* Total Price Card */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Total Order Amount (LKR)
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 font-mono">
              {order.totalPriceFormatted}
            </span>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Includes base cake price + all selected options. Authoritative price will be verified on confirmation.
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleProceedToPayment}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-200 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{isSubmitting ? "Creating Order..." : "Proceed to Payment"}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
