import Link from "next/link";
import { Heart } from "lucide-react";
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

// Badge colour by category
function getBadge(
  isSeasonal: boolean | undefined,
  mainCategory: string | null | undefined,
  catalogueCode: string | null | undefined,
  name: string
): { label: string; style: string } | null {
  if (isSeasonal) return { label: "Seasonal", style: "bg-[#A3B19B]" };

  const cat = (mainCategory || "").toLowerCase();
  if (cat.includes("birthday"))    return { label: "Birthday",    style: "bg-[#C88A58]" };
  if (cat.includes("wedding"))     return { label: "Wedding",     style: "bg-[#8A7568]" };
  if (cat.includes("mini"))        return { label: "Mini",        style: "bg-[#A3B19B]" };
  if (cat.includes("printed"))     return { label: "Printed",     style: "bg-[#6B7B8D]" };
  if (cat.includes("cup"))         return { label: "Cupcake",     style: "bg-[#B07240]" };
  if (cat.includes("special"))     return { label: "Special",     style: "bg-[#3D2B24]" };
  if (cat.includes("celebration")) return { label: "Celebration", style: "bg-[#C88A58]" };

  // Fallback: deterministic from code
  const seed = (catalogueCode || "") + name;
  const n = seed.charCodeAt(0) + (seed.charCodeAt(1) || 0);
  const fallbacks = [
    { label: "Bestseller", style: "bg-[#C88A58]" },
    { label: "Custom",     style: "bg-[#3D2B24]" },
    { label: "Fresh",      style: "bg-[#A3B19B]" },
  ];
  if (n % 4 === 3) return null;
  return fallbacks[n % fallbacks.length];
}

export function CakeCard({
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
  const displayName = getProductDisplayName({ name, catalogueCode });
  const badge = getBadge(isSeasonal, mainCategory, catalogueCode, name);

  return (
    <article className="group bg-white rounded-xl overflow-hidden border border-[#E8E0D8] shadow-[0_1px_4px_0_rgb(61_43_36_/_0.07)] hover:shadow-[0_6px_20px_-4px_rgb(61_43_36_/_0.13)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">

      {/* ── IMAGE ── */}
      <div className="relative w-full overflow-hidden bg-[#F4F0EA]" style={{ aspectRatio: "1 / 1" }}>
        <Link href={`/cakes/${slug}`} tabIndex={-1} aria-hidden="true">
          <CakeImage
            src={imageUrl}
            alt={altText || displayName}
            className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Badge top-left */}
        {badge && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full text-white tracking-wide uppercase ${badge.style}`}>
            {badge.label}
          </span>
        )}

        {/* Heart top-right */}
        <button
          type="button"
          aria-label={`Save ${displayName}`}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all duration-150"
        >
          <Heart className="w-3.5 h-3.5 text-[#3D2B24]" aria-hidden="true" />
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">

        {/* Name */}
        <h2 className="font-serif text-[13px] sm:text-[14px] font-bold text-[#3D2B24] leading-snug line-clamp-2">
          <Link href={`/cakes/${slug}`} className="hover:text-[#C88A58] transition-colors">
            {displayName}
          </Link>
        </h2>

        {/* Description */}
        {shortDescription && (
          <p className="text-[11px] text-[#8A7568] line-clamp-2 leading-relaxed flex-1">
            {shortDescription}
          </p>
        )}

        {/* Price */}
        <p className="text-[15px] font-bold text-[#3D2B24] mt-auto pt-1">
          {formatLKR(basePrice)}
        </p>

        {/* CTA row — "+ Add" + "Edit" — matches reference exactly */}
        <div className="flex items-center gap-2 mt-1">
          <Link
            href={`/cakes/${slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 text-[12px] font-bold rounded-lg bg-[#3D2B24] text-white hover:bg-[#C88A58] transition-colors duration-150 whitespace-nowrap"
            aria-label={`Add ${displayName} to order`}
          >
            + Add
          </Link>
          <Link
            href={`/cakes/${slug}`}
            className="px-3 py-2 text-[12px] font-semibold rounded-lg border border-[#E8E0D8] text-[#3D2B24] hover:border-[#3D2B24] hover:bg-[#F0EAE7] transition-all duration-150 whitespace-nowrap"
            aria-label={`Customise ${displayName}`}
          >
            Edit
          </Link>
        </div>
      </div>
    </article>
  );
}
