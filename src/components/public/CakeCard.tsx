"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { formatLKR } from "@/lib/domain/pricing";
import { getProductDisplayName } from "@/lib/domain/catalogue";
import { CakeImage } from "@/components/public/CakeImage";

export interface CakeCardProps {
  id: string;
  name: string;
  slug: string;
  basePrice: string | number;
  shortDescription?: string | null;
  imageUrl?: string | null;
  altText?: string | null;
  catalogueCode?: string | null;
  mainCategory?: string | null;
  isSeasonal?: boolean;
}

function getBadge(
  isSeasonal: boolean | undefined,
  mainCategory: string | null | undefined,
  catalogueCode: string | null | undefined,
  name: string
): { label: string; isRuby: boolean } | null {
  if (isSeasonal) return { label: "Seasonal", isRuby: true };

  const cat = (mainCategory || "").toLowerCase();
  if (cat.includes("wedding"))     return { label: "Bespoke",     isRuby: true };
  if (cat.includes("birthday"))    return { label: "Popular",     isRuby: false };
  if (cat.includes("mini"))        return { label: "Miniature",   isRuby: false };
  if (cat.includes("printed"))     return { label: "Custom Print", isRuby: false };
  if (cat.includes("special"))     return { label: "Artisanal",   isRuby: true };

  const seed = (catalogueCode || "") + name;
  const n = seed.charCodeAt(0) + (seed.charCodeAt(1) || 0);
  if (n % 4 === 3) return null;
  
  return n % 2 === 0
    ? { label: "Best Seller", isRuby: true }
    : { label: "Fresh Daily", isRuby: false };
}

export function CakeCard({
  id,
  name,
  slug,
  basePrice,
  shortDescription,
  imageUrl,
  altText,
  catalogueCode,
  mainCategory,
  isSeasonal,
}: CakeCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  const displayName = getProductDisplayName({ name, catalogueCode });
  const badge = getBadge(isSeasonal, mainCategory, catalogueCode, name);

  const numPrice = typeof basePrice === "number" ? basePrice : parseFloat(basePrice) || 0;

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const orderPayload = {
      productId: id,
      productName: name,
      productSlug: slug,
      productImage: imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800",
      basePrice: numPrice,
      totalPriceFormatted: formatLKR(numPrice),
      totalCents: Math.round(numPrice * 100),
      selections: {},
      customizationSummary: [],
      timestamp: Date.now(),
    };

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("wasana_pending_order", JSON.stringify(orderPayload));
      } catch (err) {
        console.error("Failed to set order payload in sessionStorage:", err);
      }
    }

    router.push("/checkout/details");
  };

  return (
    <article className="group glass-card flex flex-col h-full overflow-hidden">

      {/* ── IMAGE CONTAINER ── */}
      <div className="relative w-full overflow-hidden bg-[#F4F4F0]" style={{ aspectRatio: "1 / 1" }}>
        <Link href={`/cakes/${slug}`} tabIndex={-1} aria-hidden="true" className="block w-full h-full">
          <CakeImage
            src={imageUrl}
            alt={altText || displayName}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Floating Badge (Confection Ruby Red or Bakery Gold) Top-Left */}
        {badge && (
          <span
            className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full shadow-sm ${
              badge.isRuby
                ? "bg-[#E11D48] text-white"
                : "bg-[#F59E0B] text-[#1B1C1A]"
            }`}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist Heart Button Top-Right */}
        <button
          type="button"
          onClick={() => setIsSaved((prev) => !prev)}
          aria-label={`Save ${displayName}`}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full backdrop-blur-md border border-white/60 flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-150 ${
            isSaved
              ? "bg-[#E11D48] text-white"
              : "bg-white/80 text-[#1B1C1A] hover:bg-white hover:text-[#E11D48]"
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* ── CARD CONTENT ── */}
      <div className="p-3.5 flex flex-col flex-1 gap-1.5">

        {/* Playfair Display Title */}
        <h3 className="font-serif text-[14px] sm:text-[15px] font-bold text-[#1B1C1A] leading-snug line-clamp-2">
          <Link href={`/cakes/${slug}`} className="hover:text-[#F59E0B] transition-colors">
            {displayName}
          </Link>
        </h3>

        {/* Short Description */}
        {shortDescription && (
          <p className="text-[11px] text-[#534434] line-clamp-2 leading-relaxed flex-1">
            {shortDescription}
          </p>
        )}

        {/* Price Block (Plus Jakarta Sans 700/800) */}
        <div className="mt-auto pt-1 flex items-baseline justify-between">
          <p className="text-price-md text-[#1B1C1A]">
            {formatLKR(numPrice)}
          </p>
          {catalogueCode && (
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#867461]">
              #{catalogueCode}
            </span>
          )}
        </div>

        {/* Quick Buy CTA Row */}
        <div className="flex items-center gap-2 mt-2">
          <Link
            href={`/cakes/${slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-[12px] font-bold btn-primary-gold rounded-full transition-all"
            aria-label={`Order ${displayName}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
            Buy
          </Link>

          <Link
            href={`/cakes/${slug}`}
            className="px-3 py-2 text-[12px] font-semibold btn-glass whitespace-nowrap"
            aria-label={`View ${displayName} details and customizations`}
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
