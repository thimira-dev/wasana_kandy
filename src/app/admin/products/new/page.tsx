import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = {
  title: "Create New Cake | Wasana Bakers Admin",
};

export default function AdminNewProductPage() {
  return (
    <div className="py-2">
      <ProductForm />
    </div>
  );
}
