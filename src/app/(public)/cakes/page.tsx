import { Suspense } from "react";
import Link from "next/link";
import { ProductService } from "@/lib/services/product-service";
import { CakeCard } from "@/components/public/CakeCard";
import { CategoryCakeGrid } from "@/components/public/CategoryCakeGrid";
import { CatalogueFilterBar } from "@/components/public/CatalogueFilterBar";
import { HowToOrderBanner } from "@/components/public/HowToOrderBanner";
import { CustomerFeedbackSection } from "@/components/public/CustomerFeedbackSection";
import { AteliersMapSection } from "@/components/public/AteliersMapSection";
import { Cake, RotateCcw } from "lucide-react";
import { MAIN_CATEGORIES } from "@/lib/domain/catalogue";
import type { CakeCardProps } from "@/components/public/CakeCard";

export const revalidate = 0;

export const metadata = {
  title: "Artisanal Celebration Cakes | Wasana Bakers Kandy",
  description:
    "Explore bespoke celebration cakes, gateaux, and confections handcrafted daily in Kandy, Sri Lanka.",
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

  const allCakes = await ProductService.getPublishedProducts({
    search,
    category,
    collection,
    sort,
  });

  const totalCakes = allCakes.length;

  const isFiltering = Boolean(
    search.trim() || category.trim() || collection.trim() || (sort && sort !== "newest")
  );

  /* ── Group cakes by mainCategory (preserve MAIN_CATEGORIES order) ── */
  const categoryMap = new Map<string, CakeCardProps[]>();

  for (const cake of allCakes) {
    const cat = cake.mainCategory || "Other Cakes";
    const primaryImg = cake.images.find((img) => img.isPrimary) || cake.images[0];
    const cardProps: CakeCardProps = {
      id: cake.id,
      name: cake.name,
      slug: cake.slug,
      catalogueCode: cake.catalogueCode,
      mainCategory: cake.mainCategory,
      isSeasonal: cake.isSeasonal,
      basePrice: cake.basePrice.toString(),
      shortDescription: cake.shortDescription,
      imageUrl: primaryImg?.url,
      altText: primaryImg?.altText || cake.name,
    };
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat)!.push(cardProps);
  }

  /* Order categories: known categories first (in defined order), then any extras */
  const orderedCategories: string[] = [];
  for (const knownCat of MAIN_CATEGORIES) {
    if (categoryMap.has(knownCat)) {
      orderedCategories.push(knownCat);
    }
  }
  for (const cat of categoryMap.keys()) {
    if (!orderedCategories.includes(cat)) {
      orderedCategories.push(cat);
    }
  }

  return (
    <div className="bg-[#FAF9F5] min-h-screen">
      
      {/* ── MAIN CATALOGUE CONTAINER (2-COLUMN GRID: LEFT FILTER SIDEBAR + RIGHT CAKE GRID) ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:pr-10 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* ── LEFT COLUMN: STICKY FILTER MENU (col-span-3) ── */}
          <div className="lg:col-span-3 xl:col-span-3 h-full">
            <Suspense fallback={null}>
              <CatalogueFilterBar
                currentSearch={search}
                currentCategory={category}
                currentCollection={collection}
                currentSort={sort}
              />
            </Suspense>
          </div>

          {/* ── RIGHT COLUMN: CATEGORY-WISE CAKE SECTIONS (col-span-9) ── */}
          <div className="lg:col-span-9 xl:col-span-9">
            
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
                  {/* Summary bar */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[12px] font-semibold text-[#534434]">
                      Showing <span className="font-bold text-[#1B1C1A]">{totalCakes}</span> cake creation{totalCakes !== 1 ? "s" : ""}
                      {" "}across <span className="font-bold text-[#f59e0b]">{orderedCategories.length}</span> {orderedCategories.length === 1 ? "category" : "categories"}
                      {isFiltering && " · Filtered"}
                    </p>
                  </div>

                  {/* ── CATEGORY-WISE SECTIONS ── */}
                  {orderedCategories.map((catName) => (
                    <CategoryCakeGrid
                      key={catName}
                      categoryName={catName}
                      cakes={categoryMap.get(catName)!}
                    />
                  ))}
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

      
    </div>
  );
}
