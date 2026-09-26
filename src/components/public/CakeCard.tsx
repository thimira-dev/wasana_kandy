import Link from "next/link";
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

  return (
    <article className="group bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full relative">
      <Link href={`/cakes/${slug}`} className="block relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        <CakeImage
          src={imageUrl}
          alt={altText || displayName}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Badges on top of image */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
          {catalogueCode && (
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-stone-900/85 text-amber-300 backdrop-blur-xs shadow-xs tracking-wider">
              {catalogueCode}
            </span>
          )}
          {isSeasonal && (
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-600/90 text-white backdrop-blur-xs shadow-xs">
              Seasonal
            </span>
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        {mainCategory && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
            {mainCategory}
          </span>
        )}

        <h2 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-1">
          <Link href={`/cakes/${slug}`}>{displayName}</Link>
        </h2>

        {shortDescription && (
          <p className="text-sm text-stone-600 mt-2 line-clamp-2 leading-relaxed">
            {shortDescription}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100">
          <div>
            <span className="text-xs text-stone-500 block">Starting from</span>
            <span className="text-base font-bold text-amber-700">
              {formatLKR(basePrice)}
            </span>
          </div>

          <Link
            href={`/cakes/${slug}`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          >
            View Cake
          </Link>
        </div>
      </div>
    </article>
  );
}
