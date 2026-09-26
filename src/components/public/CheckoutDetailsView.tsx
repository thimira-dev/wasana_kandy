"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cake, ArrowLeft, AlertCircle } from "lucide-react";
import { CheckoutDetailsForm, BranchData } from "./CheckoutDetailsForm";
import { CheckoutOrderSummary, PendingOrderState } from "./CheckoutOrderSummary";

interface CheckoutDetailsViewProps {
  branches: BranchData[];
}

export function CheckoutDetailsView({ branches }: CheckoutDetailsViewProps) {
  const [order, setOrder] = useState<PendingOrderState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("wasana_pending_order");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.productId && parsed.productName) {
            setOrder(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load order from session storage:", err);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-stone-500">
        Loading checkout details...
      </div>
    );
  }

  // If no valid pending order exists, show clear notice with button to catalogue
  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-stone-200 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
          <Cake className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">
          No Cake Selected
        </h2>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
          Please select and customize a celebration cake from our catalogue before entering customer details.
        </p>
        <Link
          href="/cakes"
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
        >
          <span>Return to Cake Catalogue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/cakes/${order.productSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customize Cake</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: Customer & Pickup Details Form */}
        <div className="lg:col-span-7">
          <CheckoutDetailsForm branches={branches} />
        </div>

        {/* RIGHT COLUMN: Order Summary (Sticky on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <CheckoutOrderSummary order={order} showEditLink={true} />
        </div>
      </div>
    </div>
  );
}
