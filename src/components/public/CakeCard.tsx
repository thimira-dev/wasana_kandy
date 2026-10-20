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

        {/* Wishlist Heart — smaller hit target on mobile */}
        <button
          type="button"
          onClick={() => setIsSaved((prev) => !prev)}
          aria-label={`Save ${displayName}`}
          className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur-md border border-white/60 flex items-center justify-center shadow-sm hover:scale-110 transition-all duration-150 ${
            isSaved
              ? "bg-[#E11D48] text-white"
              : "bg-white/80 text-[#1B1C1A] hover:bg-white hover:text-[#E11D48]"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      {/* ── CARD CONTENT — responsive padding ── */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 gap-1 sm:gap-1.5">

        {/* Title — responsive sizing */}
        <h3 className="font-serif text-[12px] sm:text-[14px] md:text-[15px] font-bold text-[#1B1C1A] leading-snug line-clamp-2">
          <Link href={`/cakes/${slug}`} className="hover:text-[#F59E0B] transition-colors">
            {displayName}
          </Link>
        </h3>

        {/* Short Description — hidden on very small screens, 1 line on mobile, 2 on desktop */}
        {shortDescription && (
          <p className="text-[10px] sm:text-[11px] text-[#534434] line-clamp-2 leading-relaxed flex-1">
            {shortDescription}
          </p>
        )}

        {/* Price & Catalogue Code — wraps to column on narrow screens */}
        <div className="mt-auto pt-1 flex flex-col min-[400px]:flex-row min-[400px]:items-baseline min-[400px]:justify-between gap-0.5">
          <p className="text-[13px] sm:text-price-md font-extrabold text-[#1B1C1A] leading-tight">
            {formatLKR(numPrice)}
          </p>
          {catalogueCode && (
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-[#867461]">
              #{catalogueCode}
            </span>
          )}
        </div>

        {/* CTA Buttons — stack vertically on tiny screens, side-by-side otherwise */}
        <div className="flex flex-col min-[360px]:flex-row items-stretch min-[360px]:items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
          <Link
            href={`/cakes/${slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-bold btn-primary-gold rounded-full transition-all"
            aria-label={`Order ${displayName}`}
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
            Buy
          </Link>

          <Link
            href={`/cakes/${slug}`}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[12px] font-semibold btn-glass whitespace-nowrap text-center"
            aria-label={`View ${displayName} details and customizations`}
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
