import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminIndexPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  redirect("/admin/products");
}
