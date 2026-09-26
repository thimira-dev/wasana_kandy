"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatLKR } from "@/lib/domain/pricing";
import { KNOWN_COLLECTIONS, normalizeCodeSearch } from "@/lib/domain/catalogue";
import { CakeImage } from "@/components/public/CakeImage";
import { Plus, Search, Edit3, Eye, Check, X, Layers, Filter } from "lucide-react";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  catalogueCode?: string | null;
  mainCategory?: string | null;
  collectionCode?: string | null;
  designNumber?: number | null;
  isSeasonal?: boolean;
  basePrice: string | number;
  published: boolean;
  isActive: boolean;
  images: Array<{ url: string; isPrimary: boolean }>;
  _count: {
    customizationGroups: number;
  };
  updatedAt: string | Date;
}

interface ProductTableProps {
  initialProducts: AdminProductRow[];
}

export function ProductTable({ initialProducts }: ProductTableProps) {
  const [products, setProducts] = useState<AdminProductRow[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    // Collection filter
    if (collectionFilter !== "all" && p.collectionCode !== collectionFilter) {
      return false;
    }

    // Search filter
    if (!search.trim()) return true;

    const q = search.trim().toLowerCase();
    const canonical = normalizeCodeSearch(q);

    const matchName = p.name.toLowerCase().includes(q);
    const matchSlug = p.slug.toLowerCase().includes(q);
    const matchCode = p.catalogueCode?.toLowerCase().includes(q);
    const matchCanonical = canonical && p.catalogueCode?.toUpperCase() === canonical.toUpperCase();

    return matchName || matchSlug || matchCode || Boolean(matchCanonical);
  });

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentPublished }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, published: !currentPublished } : p))
        );
      }
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p))
        );
      }
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Cakes Catalogue Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Create, edit, price, and manage customization options for your cakes.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Product</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code (G-43), name, or slug..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-hidden text-stone-800 placeholder-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Collection Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="text-xs font-medium px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-700 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Collections</option>
            {KNOWN_COLLECTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-stone-700">No cakes found</p>
            <p className="text-xs text-stone-500 mt-1">
              {search || collectionFilter !== "all"
                ? "No products match your current search or collection filter."
                : "You have not added any cakes yet."}
            </p>
            {!search && collectionFilter === "all" && (
              <Link
                href="/admin/products/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Cake</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Cake
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Category / Collection
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Base Price
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Customizations
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Published
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Active State
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((product) => {
                  const primaryImg = product.images[0]?.url;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        !product.isActive ? "opacity-60 bg-stone-50/30" : ""
                      }`}
                    >
                      {/* Cake Image & Name */}
                      <td className="px-5 py-4 flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <CakeImage
                            src={primaryImg}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block leading-tight">
                            {product.name}
                          </span>
                          <span className="text-xs text-stone-400 block font-mono mt-0.5">
                            /cakes/{product.slug}
                          </span>
                        </div>
                      </td>

                      {/* Catalogue Code */}
                      <td className="px-4 py-4">
                        {product.catalogueCode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {product.catalogueCode}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* Category & Collection */}
                      <td className="px-4 py-4 text-xs">
                        <span className="font-semibold text-stone-800 block">
                          {product.mainCategory || "—"}
                        </span>
                        {product.collectionCode && (
                          <span className="text-stone-500 text-[11px] block mt-0.5">
                            {product.collectionCode} Collection
                          </span>
                        )}
                        {product.isSeasonal && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Seasonal
                          </span>
                        )}
                      </td>

                      {/* Base Price */}
                      <td className="px-5 py-4 font-mono font-bold text-stone-800">
                        {formatLKR(product.basePrice)}
                      </td>

                      {/* Customization count */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          <Layers className="w-3 h-3 text-stone-500" />
                          <span>{product._count.customizationGroups} groups</span>
                        </span>
                      </td>

                      {/* Published status toggle */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={isUpdating === product.id}
                          onClick={() => handleTogglePublish(product.id, product.published)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            product.published
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                          title="Click to toggle publish status"
                        >
                          {product.published ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Active state toggle (Soft delete) */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={isUpdating === product.id}
                          onClick={() => handleToggleActive(product.id, product.isActive)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md cursor-pointer ${
                            product.isActive
                              ? "text-stone-700 bg-stone-100 hover:bg-stone-200"
                              : "text-rose-700 bg-rose-50 hover:bg-rose-100"
                          }`}
                          title="Click to soft delete or restore"
                        >
                          {product.isActive ? "Active" : "Archived"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {product.published && product.isActive && (
                            <Link
                              href={`/cakes/${product.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                              title="View on website"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
