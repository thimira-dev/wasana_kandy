import { OrderService } from "@/lib/services/order-service";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { getAdminSession } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export const revalidate = 0;

export const metadata = {
  title: "Orders & Payments | Wasana Bakers Admin",
};

interface AdminOrdersPageProps {
  searchParams?: Promise<{
    search?: string;
    paymentStatus?: string;
    orderStatus?: string;
    branch?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (!Permissions.canViewOrders(session.role)) {
    redirect("/admin/products");
  }

  const filters = searchParams ? await searchParams : {};
  const [orders, stats, branches] = await Promise.all([
    OrderService.getAdminOrders({
      search: filters.search,
      paymentStatus: filters.paymentStatus,
      orderStatus: filters.orderStatus,
      branchId: filters.branch,
    }),
    OrderService.getAdminOrderStats(),
    OrderService.getActiveBranches(),
  ]);

  return (
    <OrdersTable
      initialOrders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        phonePrimary: o.phonePrimary,
        branchName: o.branch.name,
        readyDate: o.readyDate.toISOString(),
        subtotal: o.subtotal.toString(),
        total: o.total.toString(),
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
        createdAt: o.createdAt.toISOString(),
        itemCount: o._count.items,
        attemptCount: o._count.paymentAttempts,
      }))}
      stats={stats}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
    />
  );
}
