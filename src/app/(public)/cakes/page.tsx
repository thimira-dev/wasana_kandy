import Link from "next/link";
import { ProductService } from "@/lib/services/product-service";
import { CakeCard } from "@/components/public/CakeCard";
import { CustomerProgressBar } from "@/components/public/CustomerProgressBar";
import { CatalogueFilterBar } from "@/components/public/CatalogueFilterBar";
import { Cake, RotateCcw } from "lucide-react";

export const revalidate = 0; // Fresh catalogue data

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
  const search = params.search || "";
  const category = params.category || "";
  const collection = params.collection || "";
  const sort = params.sort || "newest";

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
    <div className="bg-stone-50 min-h-screen pb-20">
      {/* Step Progress Bar */}
      <div className="bg-white border-b border-stone-200">
        <CustomerProgressBar currentStep={1} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <Cake className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            Our Celebration Cakes
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            Search by physical catalogue code or name, filter collections, and customize for your special occasion.
          </p>
        </div>

        {/* Toolbar: Search, Category, Collection, Sort */}
        <CatalogueFilterBar
          currentSearch={search}
          currentCategory={category}
          currentCollection={collection}
          currentSort={sort}
        />

        {/* Cakes Grid / Empty States */}
        {cakes.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 shadow-xs max-w-lg mx-auto">
            <Cake className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-stone-800">
              {isFiltering ? "No cakes matched your search" : "No cakes currently on display"}
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {isFiltering
                ? "Try searching for another catalogue code (e.g. G-43, ND-14) or clear your filters to view all cakes."
                : "Our bakers are currently preparing new recipes. Please check back shortly or visit our bakery!"}
            </p>
            {isFiltering && (
              <div className="mt-5">
                <Link
                  href="/cakes"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cakes.map((cake) => {
              const primaryImg =
                cake.images.find((img) => img.isPrimary) || cake.images[0];

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
        )}
      </div>
    </div>
  );
}
