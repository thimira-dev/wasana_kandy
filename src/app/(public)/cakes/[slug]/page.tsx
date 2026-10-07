import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductService } from "@/lib/services/product-service";
import { getProductDisplayName } from "@/lib/domain/catalogue";
import { CustomerProgressBar } from "@/components/public/CustomerProgressBar";
import { CakeCustomizer } from "@/components/public/CakeCustomizer";
import { CakeCard } from "@/components/public/CakeCard";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cake = await ProductService.getProductBySlug(slug);

  if (!cake) {
    return {
      title: "Cake Not Found | Wasana Bakers",
    };
  }

  const displayName = getProductDisplayName(cake);

  return {
    title: `${displayName} | Wasana Bakers Kandy`,
    description: cake.shortDescription || cake.description.substring(0, 160),
  };
}

export default async function CakeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const cake = await ProductService.getProductBySlug(slug);

  if (!cake) {
    notFound();
  }

  // Fetch related products from the same category
  const relatedRaw = await ProductService.getRelatedProducts(cake.id, cake.mainCategory, 4);

  // Map database entity to serializable client props
  const serializedCake = {
    id: cake.id,
    name: cake.name,
    slug: cake.slug,
    catalogueCode: cake.catalogueCode,
    mainCategory: cake.mainCategory,
    collectionCode: cake.collectionCode,
    designNumber: cake.designNumber,
    isSeasonal: cake.isSeasonal,
    description: cake.description,
    shortDescription: cake.shortDescription,
    basePrice: cake.basePrice.toString(),
    images: cake.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    customizationGroups: cake.customizationGroups.map((group) => ({
      id: group.id,
      name: group.name,
      fieldType: group.fieldType,
      isRequired: group.isRequired,
      sortOrder: group.sortOrder,
      isActive: group.isActive,
      helperText: group.helperText,
      maxCharacters: group.maxCharacters,
      options: group.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        priceAdjustment: opt.priceAdjustment.toString(),
        sortOrder: opt.sortOrder,
        isActive: opt.isActive,
      })),
    })),
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen pb-20">
      {/* Progress Bar */}
      <div className="bg-white border-b border-[#E9E8E4]">
        <CustomerProgressBar currentStep={1} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/cakes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#534434] hover:text-[#F59E0B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Cakes</span>
          </Link>
        </div>

        {/* Customizer */}
        <CakeCustomizer product={serializedCake} />

        {/* ── RELATED PRODUCTS SECTION ── */}
        {relatedRaw.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#E9E8E4]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold text-[#855300] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>More From Wasana</span>
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1C1A]">
                  {cake.mainCategory ? `More ${cake.mainCategory} Cakes` : "You May Also Like"}
                </h2>
              </div>

              <Link
                href={cake.mainCategory ? `/cakes?category=${encodeURIComponent(cake.mainCategory)}` : "/cakes"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#855300] hover:text-[#F59E0B] transition-colors group"
              >
                <span>Explore All {cake.mainCategory || "Cakes"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedRaw.map((relProduct) => {
                const primaryImage = relProduct.images.find((img) => img.isPrimary) || relProduct.images[0];
                return (
                  <CakeCard
                    key={relProduct.id}
                    id={relProduct.id}
                    name={relProduct.name}
                    slug={relProduct.slug}
                    basePrice={relProduct.basePrice.toString()}
                    shortDescription={relProduct.shortDescription}
                    imageUrl={primaryImage?.url}
                    altText={primaryImage?.altText}
                    catalogueCode={relProduct.catalogueCode}
                    mainCategory={relProduct.mainCategory}
                    isSeasonal={relProduct.isSeasonal}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
