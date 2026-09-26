import { notFound } from "next/navigation";
import { ProductService } from "@/lib/services/product-service";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Metadata } from "next";

export const revalidate = 0;

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await ProductService.getAdminProductById(id);

  return {
    title: product
      ? `Edit ${product.name} | Wasana Bakers Admin`
      : "Cake Not Found | Wasana Bakers Admin",
  };
}

export default async function AdminEditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await ProductService.getAdminProductById(id);

  if (!product) {
    notFound();
  }

  const initialData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    mainCategory: product.mainCategory,
    collectionCode: product.collectionCode,
    designNumber: product.designNumber,
    catalogueCode: product.catalogueCode,
    isSeasonal: product.isSeasonal,
    shortDescription: product.shortDescription,
    description: product.description,
    basePrice: product.basePrice.toString(),
    published: product.published,
    isActive: product.isActive,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    customizationGroups: product.customizationGroups.map((g) => ({
      id: g.id,
      name: g.name,
      fieldType: g.fieldType,
      isRequired: g.isRequired,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
      helperText: g.helperText,
      maxCharacters: g.maxCharacters,
      options: g.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        priceAdjustment: opt.priceAdjustment.toString(),
        sortOrder: opt.sortOrder,
        isActive: opt.isActive,
      })),
    })),
  };

  return (
    <div className="py-2">
      <ProductForm initialData={initialData} isEditing={true} />
    </div>
  );
}
