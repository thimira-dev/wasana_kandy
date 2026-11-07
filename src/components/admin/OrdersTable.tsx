"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatLKR } from "@/lib/domain/pricing";
import { Search, ShoppingBag, ChevronRight, CreditCard, Clock, PackageCheck, Banknote, Layers } from "lucide-react";

export interface AdminOrderRow {
  id: string;
  isTest: boolean;
  paymentReviewRequired: boolean;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  phonePrimary: string;
  branchName: string;
  readyDate: string;
  subtotal: string;
  total: string;
  orderStatus: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  itemCount: number;
  attemptCount: number;
}

export interface AdminOrderStats {
  paidRevenue: string;
  paidCount: number;
  pendingPaymentCount: number;
  confirmedCount: number;
  preparingCount: number;
  totalCount: number;
}

interface OrdersTableProps {
  initialOrders: AdminOrderRow[];
  stats: AdminOrderStats;
  page: number;
  hasNext: boolean;
  filters: { search?: string; paymentStatus?: string; orderStatus?: string; branch?: string };
  branches: Array<{ id: string; name: string }>;
}

const PAYMENT_BADGES: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-900 border-amber-200" },
  FAILED: { label: "Failed", className: "bg-rose-100 text-rose-800 border-rose-200" },
  REFUNDED: { label: "Refunded", className: "bg-stone-100 text-stone-700 border-stone-300" },
};

const ORDER_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PAYMENT_PENDING: { label: "Awaiting payment", className: "bg-amber-50 text-amber-900 border-amber-200" },
  CONFIRMED: { label: "Confirmed", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PREPARING: { label: "Preparing", className: "bg-sky-50 text-sky-800 border-sky-200" },
  READY_FOR_PICKUP: { label: "Ready", className: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  COMPLETED: { label: "Completed", className: "bg-stone-100 text-stone-700 border-stone-300" },
  CANCELLED: { label: "Cancelled", className: "bg-rose-50 text-rose-800 border-rose-200" },
};

function Badge({ map, value }: { map: Record<string, { label: string; className: string }>; value: string }) {
  const config = map[value] ?? { label: value, className: "bg-stone-100 text-stone-700 border-stone-300" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${config.className}`}>
      {config.label}
    </span>
  );
}

export function OrdersTable({ initialOrders, stats, branches, page, hasNext, filters }: OrdersTableProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [paymentFilter, setPaymentFilter] = useState(filters.paymentStatus || "all");
  const [statusFilter, setStatusFilter] = useState(filters.orderStatus || "all");
  const [branchFilter, setBranchFilter] = useState(filters.branch || "all");

  const filtered = initialOrders;
  const pageUrl = (next: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value && key !== "page") params.set(key, value);
    params.set("page", String(next));
    return `/admin/orders?${params}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Orders &amp; Payments
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Purchases, payment status, and pickup details across all branches.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5 text-emerald-700" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">Paid revenue</span>
            <span className="text-lg font-bold text-stone-900 block">{formatLKR(stats.paidRevenue)}</span>
            <span className="text-[11px] text-stone-400">{stats.paidCount} paid order{stats.paidCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-amber-700" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">Awaiting payment</span>
            <span className="text-lg font-bold text-stone-900 block">{stats.pendingPaymentCount}</span>
            <span className="text-[11px] text-stone-400">pending order{stats.pendingPaymentCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5 text-sky-700" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">Confirmed + preparing</span>
            <span className="text-lg font-bold text-stone-900 block">{stats.confirmedCount + stats.preparingCount}</span>
            <span className="text-[11px] text-stone-400">{stats.confirmedCount} confirmed · {stats.preparingCount} preparing</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex items-center gap-4">
          <span className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-stone-600" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide block">Total orders</span>
            <span className="text-lg font-bold text-stone-900 block">{stats.totalCount}</span>
            <span className="text-[11px] text-stone-400">all time</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form action="/admin/orders" method="get" className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            name="search"
            maxLength={120}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer name, email, or phone..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-hidden text-stone-800 placeholder-stone-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="text-xs text-stone-400 hover:text-stone-600">
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            name="paymentStatus"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-700 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All payment states</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select
            name="orderStatus"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-700 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All order statuses</option>
            <option value="PAYMENT_PENDING">Awaiting payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready for pickup</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            name="branch"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-700 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white">Apply filters</button>
          <Link href="/admin/orders" className="text-xs font-semibold text-stone-600">Reset</Link>
        </div>
      </form>
      <nav aria-label="Order pages" className="flex items-center justify-between text-sm">
        {page > 1 ? <Link href={pageUrl(page - 1)}>Previous</Link> : <span />}
        <span>Page {page} · up to 50 orders per page</span>
        {hasNext ? <Link href={pageUrl(page + 1)}>Next</Link> : <span />}
      </nav>
      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-stone-700">No orders found</p>
            <p className="text-xs text-stone-500 mt-1">
              {search || paymentFilter !== "all" || statusFilter !== "all" || branchFilter !== "all"
                ? "No orders match your current filters."
                : "Cake orders placed on the website will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Order</th>
                  <th scope="col" className="px-4 py-3.5">Customer</th>
                  <th scope="col" className="px-4 py-3.5">Branch / Pickup</th>
                  <th scope="col" className="px-4 py-3.5">Total</th>
                  <th scope="col" className="px-4 py-3.5">Payment</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-stone-50/70 transition-colors ${
                      order.orderStatus === "CANCELLED" ? "opacity-60" : ""
                    }`}
                  >
                    {/* Order number + date */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-stone-900 block">{order.orderNumber}</span>
                      {order.isTest && <span className="block text-xs font-bold text-amber-800">Simulation · no money received</span>}
                      {order.paymentReviewRequired && <span className="block text-xs font-bold text-rose-800">Bakery review required</span>}
                      <span className="text-xs text-stone-400 block mt-0.5">
                        {new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 mt-1">
                        <Layers className="w-3 h-3" />
                        {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} · {order.attemptCount} attempt{order.attemptCount !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4 text-xs">
                      <span className="font-bold text-stone-900 block">{order.customerName}</span>
                      <span className="text-stone-500 block mt-0.5">{order.customerEmail}</span>
                      <span className="text-stone-400 block">{order.phonePrimary}</span>
                    </td>

                    {/* Branch + pickup date */}
                    <td className="px-4 py-4 text-xs">
                      <span className="font-semibold text-stone-800 block">{order.branchName}</span>
                      <span className="flex items-center gap-1 text-stone-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <time dateTime={order.readyDate.slice(0, 10)}>{order.readyDate.slice(0, 10)}</time>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 font-mono font-bold text-stone-800 whitespace-nowrap">
                      {formatLKR(order.total)}
                    </td>

                    {/* Payment state */}
                    <td className="px-4 py-4">
                      <Badge map={PAYMENT_BADGES} value={order.paymentStatus} />
                      {order.paidAt && (
                        <span className="text-[11px] text-emerald-700 block mt-1">
                          {new Date(order.paidAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </td>

                    {/* Order status */}
                    <td className="px-4 py-4">
                      <Badge map={ORDER_STATUS_BADGES} value={order.orderStatus} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-stone-100 hover:bg-amber-50 text-stone-700 border border-stone-200 transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
