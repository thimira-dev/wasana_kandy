import {
  CategoryService,
} from "@/lib/services/category-service";
import {
  CollectionService,
} from "@/lib/services/collection-service";
import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const revalidate = 0;

export const metadata = {
  title: "Categories & Collections | Wasana Bakers Admin",
};

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [categories, collections] = await Promise.all([
    CategoryService.getCategoriesWithProductCounts(),
    CollectionService.getCollectionsWithProductCounts(),
  ]);

  return (
    <CategoryManager
      initialCategories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        productCount: c.productCount,
      }))}
      initialCollections={collections.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        isSeasonal: c.isSeasonal,
        productCount: c.productCount,
      }))}
    />
  );
}
