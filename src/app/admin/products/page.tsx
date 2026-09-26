import { ProductService } from "@/lib/services/product-service";
import { ProductTable } from "@/components/admin/ProductTable";

export const revalidate = 0;

export const metadata = {
  title: "Manage Cakes | Wasana Bakers Admin",
};

interface AdminProductsPageProps {
  searchParams?: Promise<{
    search?: string;
    collection?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const products = await ProductService.getAdminProducts(params.search, params.collection);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    catalogueCode: p.catalogueCode,
    mainCategory: p.mainCategory,
    collectionCode: p.collectionCode,
    designNumber: p.designNumber,
    isSeasonal: p.isSeasonal,
    basePrice: p.basePrice.toString(),
    published: p.published,
    isActive: p.isActive,
    images: p.images.map((img) => ({
      url: img.url,
      isPrimary: img.isPrimary,
    })),
    _count: {
      customizationGroups: p._count.customizationGroups,
    },
    updatedAt: p.updatedAt,
  }));

  return (
    <div className="space-y-6">
      <ProductTable initialProducts={formattedProducts} />
    </div>
  );
}
