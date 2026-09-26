"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { KNOWN_COLLECTIONS, MAIN_CATEGORIES } from "@/lib/domain/catalogue";

interface CatalogueFilterBarProps {
  currentSearch?: string;
  currentCategory?: string;
  currentCollection?: string;
  currentSort?: string;
}

export function CatalogueFilterBar({
  currentSearch = "",
  currentCategory = "",
  currentCollection = "",
  currentSort = "newest",
}: CatalogueFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchVal, setSearchVal] = React.useState(currentSearch);

  // Sync state if URL search param changes externally
  React.useEffect(() => {
    setSearchVal(currentSearch);
  }, [currentSearch]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim().length > 0 && value !== "all" && value !== "newest") {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchVal);
  };

  const handleClearSearch = () => {
    setSearchVal("");
    updateParam("search", "");
  };

  const handleClearAll = () => {
    setSearchVal("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(
    (currentSearch && currentSearch.trim().length > 0) ||
    (currentCategory && currentCategory.trim().length > 0) ||
    (currentCollection && currentCollection.trim().length > 0) ||
    (currentSort && currentSort !== "newest")
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-5 mb-8 space-y-4">
      {/* Top row: Search input & Submit */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search by cake name or catalogue code (e.g. G-43, ND-14, floral)..."
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all text-stone-900 placeholder:text-stone-400"
          />
          {searchVal && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </form>

      {/* Filter Row: Category, Collection, Sort */}
      <div className="pt-3 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
          {/* Main Category Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="category-select" className="font-semibold text-stone-600 shrink-0">
              Category:
            </label>
            <select
              id="category-select"
              value={currentCategory || "all"}
              onChange={(e) => updateParam("category", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              {MAIN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Collection Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="collection-select" className="font-semibold text-stone-600 shrink-0">
              Collection:
            </label>
            <select
              id="collection-select"
              value={currentCollection || "all"}
              onChange={(e) => updateParam("collection", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Collections</option>
              {KNOWN_COLLECTIONS.map((col) => (
                <option key={col.code} value={col.code}>
                  {col.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="font-semibold text-stone-600 shrink-0">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={currentSort || "newest"}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="code_asc">Catalogue Code: A to Z</option>
            </select>
          </div>
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-colors border border-stone-200"
            >
              <RotateCcw className="w-3 h-3 text-stone-400" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading state indicator */}
      {isPending && (
        <div className="text-center pt-1 text-[11px] font-medium text-amber-700 animate-pulse">
          Updating catalogue...
        </div>
      )}
    </div>
  );
}
