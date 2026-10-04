"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  Cake,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatLKR } from "@/lib/domain/pricing";
import { CakeImage } from "@/components/public/CakeImage";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    subtotalFormatted,
  } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) return;

    // Build pending order payload for checkout
    const primaryItem = items[0];
    const orderPayload = {
      productId: primaryItem.productId,
      productName: primaryItem.name,
      productSlug: primaryItem.slug,
      productImage: primaryItem.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
      basePrice: primaryItem.basePrice,
      totalPriceFormatted: subtotalFormatted,
      totalCents: Math.round(subtotal * 100),
      cartItems: items,
      selections: primaryItem.selections || {},
      customizationSummary: primaryItem.customizationSummary || [],
      timestamp: Date.now(),
    };

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("wasana_pending_order", JSON.stringify(orderPayload));
      } catch (err) {
        console.error("Failed to set order payload in sessionStorage:", err);
      }
    }

    closeCart();
    router.push("/checkout/details");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[100] bg-[#1B1C1A]/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-[#FAF9F5] shadow-2xl border-l border-[#E9E8E4] flex flex-col justify-between overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart"
          >
            {/* ── 1. DRAWER HEADER ── */}
            <div className="p-4 sm:p-5 bg-white border-b border-[#E9E8E4] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#1B1C1A] leading-tight flex items-center gap-2">
                    Your Order Cart
                    {totalItems > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F59E0B] text-[#1B1C1A]">
                        {totalItems}
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-[#534434] font-medium">
                    Handcrafted Fresh in Kandy Ateliers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCart}
                className="p-2 rounded-full text-[#534434] hover:bg-[#FAF9F5] transition-colors"
                aria-label="Close cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── 2. DRAWER BODY: ITEMS LIST ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-hide">
              {items.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20">
                    <Cake className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h3 className="font-serif text-lg font-bold text-[#1B1C1A]">
                      Your Cart is Empty
                    </h3>
                    <p className="text-[13px] text-[#534434] leading-relaxed">
                      Select your favorite bespoke gateau or celebration cake to add it to your order.
                    </p>
                  </div>
                  <Link
                    href="/cakes"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-bold btn-primary-gold"
                  >
                    Browse Cake Catalogue
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card p-3.5 flex items-start gap-3.5 bg-white border border-[#E9E8E4] rounded-2xl shadow-xs"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-[#FAF9F5] border border-[#E9E8E4]">
                      <CakeImage
                        src={item.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif text-sm font-bold text-[#1B1C1A] leading-snug truncate">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-[#E11D48] transition-colors p-1 shrink-0"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.catalogueCode && (
                        <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full">
                          #{item.catalogueCode}
                        </span>
                      )}

                      {/* Customizations summary tags if any */}
                      {item.customizationSummary && item.customizationSummary.length > 0 && (
                        <div className="space-y-0.5 pt-0.5">
                          {item.customizationSummary.map((c, i) => (
                            <p key={i} className="text-[10px] text-[#534434] truncate">
                              • <span className="font-medium text-[#1B1C1A]">{c.groupName}:</span> {c.labelOrValue}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Price & Quantity Adjuster */}
                      <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-[#E9E8E4]/60">
                        <span className="text-[13px] font-extrabold text-[#1B1C1A]">
                          {formatLKR(item.price * item.quantity)}
                        </span>

                        <div className="flex items-center gap-1.5 bg-[#FAF9F5] border border-[#E9E8E4] rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#1B1C1A] hover:bg-[#F59E0B] hover:text-[#1B1C1A] transition-colors shadow-xs"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-[11px] font-bold text-[#1B1C1A]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#1B1C1A] hover:bg-[#F59E0B] hover:text-[#1B1C1A] transition-colors shadow-xs"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── 3. DRAWER FOOTER: SUBTOTAL & CHECKOUT ── */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 bg-white border-t border-[#E9E8E4] space-y-3.5 shrink-0">
                {/* Notice */}
                <div className="flex items-center gap-2 text-[11px] text-[#534434] bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E9E8E4]">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>Includes temperature-guaranteed packaging across Kandy ateliers.</span>
                </div>

                {/* Subtotal Row */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[13px] font-semibold text-[#534434]">Subtotal Amount</span>
                  <span className="text-base font-extrabold text-[#1B1C1A]">{subtotalFormatted}</span>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-3 px-4 rounded-full btn-primary-gold font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#1B1C1A]" />
                  Proceed to Checkout ({totalItems} item{totalItems !== 1 ? "s" : ""})
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Clear Cart */}
                <div className="flex justify-between items-center text-[11px]">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[#E11D48] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear Cart
                  </button>
                  <span className="text-stone-400">Taxes calculated at pickup</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
