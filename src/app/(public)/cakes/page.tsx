import Link from "next/link";
import { ProductService } from "@/lib/services/product-service";
import { CakeCard } from "@/components/public/CakeCard";
import { CatalogueFilterBar } from "@/components/public/CatalogueFilterBar";
import { Pagination } from "@/components/public/Pagination";
import { HowToOrderBanner } from "@/components/public/HowToOrderBanner";
import { CustomerFeedbackSection } from "@/components/public/CustomerFeedbackSection";
import { AteliersMapSection } from "@/components/public/AteliersMapSection";
import { Cake, RotateCcw, Sparkles } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "Artisanal Celebration Cakes | Wasana Bakers Kandy",
  description:
    "Explore bespoke celebration cakes, gateaux, and confections handcrafted daily in Kandy, Sri Lanka.",
};

const ITEMS_PER_PAGE = 12;

interface CakesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    collection?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function CakesPage({ searchParams }: CakesPageProps) {
  const params = await searchParams;
  const search     = params.search     || "";
  const category   = params.category   || "";
  const collection = params.collection || "";
  const sort       = params.sort       || "newest";
  const rawPage    = parseInt(params.page || "1", 10);
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const allCakes = await ProductService.getPublishedProducts({
    search,
    category,
    collection,
    sort,
  });

  const totalCakes = allCakes.length;
  const totalPages = Math.ceil(totalCakes / ITEMS_PER_PAGE);
  const validPage = Math.min(currentPage, Math.max(1, totalPages));

  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCakes);
  const cakes = allCakes.slice(startIndex, endIndex);

  const isFiltering = Boolean(
    search.trim() || category.trim() || collection.trim() || (sort && sort !== "newest")
  );

  return (
    <div className="bg-[#FAF9F5] min-h-screen">
      
      {/* ── MAIN CATALOGUE CONTAINER (2-COLUMN GRID: LEFT FILTER SIDEBAR + RIGHT CAKE GRID) ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:pr-10 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* ── LEFT COLUMN: STICKY FILTER MENU (col-span-3) ── */}
          <div className="lg:col-span-3 xl:col-span-3 h-full">
            <CatalogueFilterBar
              currentSearch={search}
              currentCategory={category}
              currentCollection={collection}
              currentSort={sort}
            />
          </div>

          {/* ── RIGHT COLUMN: HERO BANNER + CAKE GRID + PAGINATION (col-span-9) ── */}
          <div className="lg:col-span-9 xl:col-span-9">
            
            {/* ── MASTHEAD HERO BANNER ── */}
            <div className="mb-6 p-6 sm:p-8 glass-floating relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" aria-hidden="true" />
              
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#855300]" />
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#855300]">
                    Artisanal Confectionery Vitrine
                  </span>
                </div>

                <h1 className="text-headline-xl text-[#1B1C1A] leading-tight">
                  Bespoke Celebration Cakes
                </h1>
                
                <p className="text-[14px] sm:text-[15px] text-[#534434] mt-2 leading-relaxed">
                  Handcrafted in the central highlands of Kandy. Search catalogue codes and refine your selections using the left menu.
                </p>
              </div>
            </div>

            {/* ── PRODUCTS MATRIX GRID (4 Columns on Desktop) ── */}
            <main>
              {totalCakes === 0 ? (
                <div className="py-16 max-w-md mx-auto text-center glass-floating p-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center mx-auto mb-4 border border-[#F59E0B]/20">
                    <Cake className="w-7 h-7 text-[#F59E0B]" aria-hidden="true" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-[#1B1C1A] mb-2">
                    {isFiltering ? "No cakes matched your vitrine search" : "Vitrine is being refreshed"}
                  </h2>
                  <p className="text-[13px] text-[#534434] leading-relaxed max-w-xs mx-auto mb-6">
                    {isFiltering
                      ? "Try searching by catalogue code (e.g. G-43, ND-14) or reset your left menu filters."
                      : "Our master bakers are decorating fresh recipes right now. Check back shortly!"}
                  </p>
                  {isFiltering && (
                    <Link
                      href="/cakes"
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold btn-primary-gold"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      Clear All Filters
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] font-semibold text-[#534434]">
                      Displaying <span className="font-bold text-[#f59e0b]">{startIndex + 1}–{endIndex}</span> of <span className="font-bold text-[#1B1C1A]">{totalCakes}</span> bespoke cake creation{totalCakes !== 1 ? "s" : ""}
                      {isFiltering && " · Filtered"}
                    </p>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#ffffff] hidden sm:block">
                      4-Column Desktop Matrix
                    </span>
                  </div>

                  {/* Grid matrix: 4 columns on Desktop (lg:grid-cols-4 xl:grid-cols-4), 2 columns on Mobile */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 animate-children">
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

                  {/* ── PAGINATION ── */}
                  <Pagination currentPage={validPage} totalPages={totalPages} />
                </>
              )}
            </main>

          </div>
        </div>
      </div>

      {/* ── SEPARATE STANDALONE FULL-WIDTH 3D CAKE BANNER SECTION ── */}
      <section className="w-full pt-8 pb-4 bg-[#FAF9F5]">
        <HowToOrderBanner />
      </section>

      {/* ── CUSTOMER FEEDBACK & REVIEWS SECTION ── */}
      <CustomerFeedbackSection />

      {/* ── ATELIERS & BOUTIQUES MAP SECTION ── */}
      <AteliersMapSection />

      {/* ── MOBILE TRUST STRIP ── */}
      <div className="mb-8 mx-4 sm:mx-6 lg:mx-8 xl:mx-auto max-w-[1320px] rounded-2xl glass-card p-5 grid grid-cols-2 gap-4 sm:hidden">
        {[
          { emoji: "🧈", label: "AOP Charentes Butter",     sub: "Slow barrel-churned cultured cream." },
          { emoji: "🌸", label: "Pesticide-Free Florals",   sub: "Organic edible botanicals." },
          { emoji: "🥚", label: "Pasture-Raised Eggs",      sub: "Regenerative farm sourced." },
          { emoji: "🎂", label: "Baked-to-Order Fresh",     sub: "Never frozen, hand-decorated." },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            <span className="text-xl mt-0.5" aria-hidden="true">{item.emoji}</span>
            <div>
              <p className="text-[11px] font-bold text-[#1B1C1A] leading-tight">{item.label}</p>
              <p className="text-[10px] text-[#534434] leading-snug mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
