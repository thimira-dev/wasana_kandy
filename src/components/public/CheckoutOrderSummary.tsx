import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLKR } from "@/lib/domain/pricing";
import { Edit2, Sparkles, MessageSquare, StickyNote } from "lucide-react";

export interface PendingOrderState {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  basePrice: string | number;
  totalPriceFormatted: string;
  totalCents: number;
  selections: Record<
    string,
    {
      optionId?: string;
      optionIds?: string[];
      textValue?: string;
    }
  >;
  customizationSummary?: Array<{
    groupName: string;
    fieldType: string;
    labelOrValue: string;
    priceAdjustment: string | number;
  }>;
}

interface CheckoutOrderSummaryProps {
  order: PendingOrderState;
  showEditLink?: boolean;
}

export function CheckoutOrderSummary({
  order,
  showEditLink = true,
}: CheckoutOrderSummaryProps) {
  const fallbackImg =
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80";

  // Separate select options, messages, and notes
  const selectAdjustments =
    order.customizationSummary?.filter(
      (c) => c.fieldType === "SINGLE_SELECT" || c.fieldType === "MULTI_SELECT"
    ) || [];

  const textMessages =
    order.customizationSummary?.filter(
      (c) => (c.fieldType === "TEXT" || c.fieldType === "TEXTAREA") && c.labelOrValue?.trim().length > 0
    ) || [];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Your Cake Order</span>
        </h2>

        {showEditLink && (
          <Link
            href={`/cakes/${order.productSlug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Cake</span>
          </Link>
        )}
      </div>

      {/* Cake Card Preview */}
      <div className="flex gap-4 items-center">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
          <Image
            src={order.productImage || fallbackImg}
            alt={order.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-amber-700 font-medium block">Wasana Handcrafted</span>
          <h3 className="text-base font-bold text-stone-900 truncate">
            {order.productName}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Base: {formatLKR(order.basePrice)}
          </p>
        </div>
      </div>

      {/* Selected Customizations */}
      {selectAdjustments.length > 0 && (
        <div className="space-y-2 border-t border-stone-100 pt-3">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">
            Selected Options
          </h4>
          <ul className="space-y-1.5 text-xs">
            {selectAdjustments.map((adj, i) => {
              const numAdj = Number(adj.priceAdjustment);
              return (
                <li key={i} className="flex justify-between items-center text-stone-600">
                  <span className="font-medium text-stone-800">
                    {adj.groupName}: <span className="font-normal text-stone-600">{adj.labelOrValue}</span>
                  </span>
                  {numAdj > 0 && (
                    <span className="font-mono text-stone-700 font-semibold">
                      +{formatLKR(adj.priceAdjustment)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Messages and Notes */}
      {textMessages.length > 0 && (
        <div className="space-y-2 border-t border-stone-100 pt-3">
          {textMessages.map((msg, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
              <span className="font-bold text-stone-700 flex items-center gap-1.5 mb-1">
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

      {/* Price Breakdown */}
      <div className="border-t border-stone-200 pt-4 space-y-2 text-xs">
        <div className="flex justify-between text-stone-600">
          <span>Cake Base Price</span>
          <span className="font-mono">{formatLKR(order.basePrice)}</span>
        </div>

        {selectAdjustments.some((a) => Number(a.priceAdjustment) > 0) && (
          <div className="flex justify-between text-stone-600">
            <span>Customization Upgrades</span>
            <span className="font-mono">
              +
              {formatLKR(
                selectAdjustments.reduce((acc, a) => acc + Number(a.priceAdjustment), 0)
              )}
            </span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-2 border-t border-stone-100 text-sm font-bold text-stone-900">
          <span>Estimated Total</span>
          <span className="text-base text-amber-700 font-mono">
            {order.totalPriceFormatted}
          </span>
        </div>
        <p className="text-[10px] text-stone-400 text-right">
          (Final total will be verified by the bakery server)
        </p>
      </div>
    </div>
  );
}
