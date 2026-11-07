import { ProductForm } from "@/components/admin/ProductForm";
import { CategoryService } from "@/lib/services/category-service";
import { CollectionService } from "@/lib/services/collection-service";
import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const revalidate = 0;

export const metadata = {
  title: "Create New Cake | Wasana Bakers Admin",
};

export default async function AdminNewProductPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [categories, collections] = await Promise.all([
    CategoryService.listActiveCategories(),
    CollectionService.listActiveCollections(),
  ]);

  return (
    <div className="py-2">
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
