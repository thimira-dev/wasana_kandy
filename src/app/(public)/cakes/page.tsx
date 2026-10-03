import Link from "next/link";
import { ProductService } from "@/lib/services/product-service";
import { CakeCard } from "@/components/public/CakeCard";

import { CatalogueFilterBar } from "@/components/public/CatalogueFilterBar";
import { Cake, RotateCcw } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Cake Catalogue | Wasana Bakers Kandy",
  description:
    "Browse our freshly baked custom celebration cakes. Handcrafted in Kandy, Sri Lanka.",
};

interface CakesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    collection?: string;
    sort?: string;
  }>;
}

export default async function CakesPage({ searchParams }: CakesPageProps) {
  const params = await searchParams;
  const search     = params.search     || "";
  const category   = params.category   || "";
  const collection = params.collection || "";
  const sort       = params.sort       || "newest";

  const cakes = await ProductService.getPublishedProducts({
    search,
    category,
    collection,
    sort,
  });

  const isFiltering = Boolean(
    search.trim() || category.trim() || collection.trim() || (sort && sort !== "newest")
  );

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Page header */}
        <div className="mb-7">
          <p className="font-script text-[#C88A58] text-lg leading-none mb-1" aria-hidden="true">
            Handcrafted daily
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2B24] leading-tight">
            Our Celebration Cakes
          </h1>
          <p className="text-[13px] text-[#8A7568] mt-1">
            Search by catalogue code or name, filter by category, and customise for your special occasion.
          </p>
        </div>

        {/* Filter Bar */}
        <CatalogueFilterBar
          currentSearch={search}
          currentCategory={category}
          currentCollection={collection}
          currentSort={sort}
        />

        {/* Grid / Empty state */}
        {cakes.length === 0 ? (
          <div className="py-16 max-w-md mx-auto text-center bg-white border border-[#E8E0D8] rounded-xl shadow-[0_1px_3px_0_rgb(61_43_36_/_0.07)]">
            <div className="w-12 h-12 rounded-xl bg-[#F4F0EA] flex items-center justify-center mx-auto mb-3">
              <Cake className="w-6 h-6 text-[#C88A58]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#3D2B24] mb-2">
              {isFiltering ? "No cakes matched your search" : "No cakes on display yet"}
            </h2>
            <p className="text-[13px] text-[#8A7568] leading-relaxed max-w-xs mx-auto mb-5">
              {isFiltering
                ? "Try searching by catalogue code (e.g. G-43, ND-14) or clear your filters."
                : "Our bakers are preparing new recipes. Please check back shortly!"}
            </p>
            {isFiltering && (
              <Link
                href="/cakes"
                className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold rounded-lg bg-[#3D2B24] text-white hover:bg-[#C88A58] transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Clear All Filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-[12px] text-[#8A7568] mb-5 font-medium">
              Showing {cakes.length} bespoke cake{cakes.length !== 1 ? "s" : ""}
              {isFiltering && " · Filtered results"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 animate-children">
              {cakes.map((cake) => {
                const primaryImg = cake.images.find((img) => img.isPrimary) || cake.images[0];
                return (
                  <CakeCard
                    key={cake.id}
                    id={cake.id}
                    name={cake.name}
                    slug={cake.slug}
                    catalogueCode={cake.catalogueCode}
                    mainCategory={cake.mainCategory}
                    isSeasonal={cake.isSeasonal}
                    basePrice={cake.basePrice.toString()}
                    shortDescription={cake.shortDescription}
                    imageUrl={primaryImg?.url}
                    altText={primaryImg?.altText || cake.name}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── MOBILE TRUST STRIP (matches reference bottom section) ── */}
      <div className="mt-6 mx-4 sm:mx-6 lg:mx-8 xl:mx-auto max-w-7xl rounded-xl bg-white border border-[#E8E0D8] p-4 grid grid-cols-2 gap-3 sm:hidden">
        {[
          { emoji: "🧈", label: "AOP Charentes Butter",     sub: "Slow barrel-churned cultured cream." },
          { emoji: "🌸", label: "Pesticide-Free Florals",   sub: "Organic edible botanicals." },
          { emoji: "🥚", label: "Pasture-Raised Eggs",      sub: "Upstate NY regenerative farms." },
          { emoji: "🎂", label: "Baked-to-Order Fresh",     sub: "Never frozen, hand-decorated." },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <span className="text-xl mt-0.5" aria-hidden="true">{item.emoji}</span>
            <div>
              <p className="text-[11px] font-bold text-[#3D2B24] leading-tight">{item.label}</p>
              <p className="text-[10px] text-[#8A7568] leading-snug mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

  );
}
