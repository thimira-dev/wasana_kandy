"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, RotateCcw, SlidersHorizontal, Check, Filter } from "lucide-react";
import { KNOWN_COLLECTIONS, MAIN_CATEGORIES } from "@/lib/domain/catalogue";

interface CatalogueFilterBarProps {
  currentSearch?: string;
  currentCategory?: string;
  currentCollection?: string;
  currentSort?: string;
}

const CATEGORY_ITEMS = [
  { label: "All Categories", value: "" },
  ...MAIN_CATEGORIES.map((cat) => ({
    label: cat,
    value: cat,
  })),
];

const COLLECTION_ITEMS = [
  { label: "All Collections", value: "" },
  ...KNOWN_COLLECTIONS.map((col) => ({
    label: col.name,
    value: col.code,
  })),
];

export function CatalogueFilterBar({
  currentSearch    = "",
  currentCategory  = "",
  currentCollection = "",
  currentSort      = "newest",
}: CatalogueFilterBarProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchVal, setSearchVal] = React.useState(currentSearch);
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  React.useEffect(() => { setSearchVal(currentSearch); }, [currentSearch]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim().length > 0 && value !== "all" && value !== "newest") {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
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
    startTransition(() => router.push(pathname));
  };

  const hasActiveFilters = Boolean(
    currentSearch.trim() || currentCategory.trim() || currentCollection.trim() || currentSort !== "newest"
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          DESKTOP STICKY LEFT SIDEBAR MENU (sticky top-[116px])
          Scrolls smoothly along with the page & pagination!
          ══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:block sticky top-[116px] h-fit w-full glass-floating p-4.5 border border-[#F59E0B]/30 space-y-4 shadow-xl">

        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E9E8E4]">
          <div className="flex items-center gap-2 text-[#1B1C1A]">
            <div className="w-7 h-7 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#855300]" />
            </div>
            <h2 className="font-serif text-base font-bold tracking-tight">Vitrine Filters</h2>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold btn-ruby"
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* 1. Search Box */}
        <form onSubmit={handleSearchSubmit} role="search" className="space-y-1">
          <label htmlFor="desktop-search" className="text-[10px] font-bold uppercase tracking-wider text-[#855300] block">
            Search Catalogue
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#855300]">
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <input
              id="desktop-search"
              type="search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Code (G-43) or name…"
              aria-label="Search cakes"
              className="w-full pl-8 pr-8 py-2 text-[12px] bg-white/90 border border-[#D8C3AD] rounded-xl text-[#1B1C1A] placeholder:text-[#867461] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 focus:border-[#F59E0B] transition-all"
            />
            {searchVal && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#867461] hover:text-[#1B1C1A]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>

        {/* 2. Sort Select */}
        <div className="space-y-1">
          <label htmlFor="desktop-sort" className="text-[10px] font-bold uppercase tracking-wider text-[#534434] block">
            Sort Order
          </label>
          <select
            id="desktop-sort"
            value={currentSort || "newest"}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="w-full px-2.5 py-1.5 text-[12px] bg-white/90 border border-[#D8C3AD] rounded-xl text-[#1B1C1A] font-semibold focus:ring-2 focus:ring-[#F59E0B]/40 focus:outline-none cursor-pointer shadow-xs"
          >
            <option value="newest">Newest Creations</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A – Z</option>
            <option value="code_asc">Catalogue Code: A – Z</option>
          </select>
        </div>

        {/* 3. Categories Vertical List */}
        <div className="space-y-1.5 pt-2 border-t border-[#E9E8E4]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#855300] flex items-center justify-between">
            <span>Categories</span>
            {currentCategory && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#1B1C1A]">
                Active
              </span>
            )}
          </p>
          <div className="space-y-0.5" role="group" aria-label="Filter by category">
            {CATEGORY_ITEMS.map((item) => {
              const active = currentCategory === item.value || (!currentCategory && item.value === "");
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => updateParam("category", item.value)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-between ${
                    active
                      ? "bg-[#F59E0B] text-[#1B1C1A] font-bold shadow-xs"
                      : "hover:bg-white/80 text-[#1B1C1A]"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-[#1B1C1A] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Collections Vertical List */}
        <div className="space-y-1.5 pt-2 border-t border-[#E9E8E4]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#78350F] flex items-center justify-between">
            <span>Collections</span>
            {currentCollection && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#78350F] text-white">
                Active
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1 pt-0.5" role="group" aria-label="Filter by collection">
            {COLLECTION_ITEMS.map((item) => {
              const active = currentCollection === item.value || (!currentCollection && item.value === "");
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => updateParam("collection", item.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    active
                      ? "bg-[#78350F] text-white font-bold shadow-xs"
                      : "bg-white/70 border border-[#D8C3AD] text-[#534434] hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {isPending && (
          <p className="text-[10px] text-[#F59E0B] font-bold animate-pulse-soft text-center pt-1">
            Updating vitrine…
          </p>
        )}
      </aside>

      {/* ══════════════════════════════════════════════════════
          MOBILE & TABLET TOP FILTER BAR (< lg)
          ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-3 mb-6">
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} role="search" className="flex-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#855300]">
                <Search className="w-4 h-4" aria-hidden="true" />
              </span>
              <input
                type="search"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search cakes or catalogue code…"
                aria-label="Search cakes"
                className="w-full pl-10 pr-8 py-2.5 text-[13px] bg-white/90 border border-[#D8C3AD] rounded-full text-[#1B1C1A] placeholder:text-[#867461] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#867461]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Toggle Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen((p) => !p)}
            className={`px-3.5 py-2.5 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 shrink-0 ${
              hasActiveFilters ? "btn-ruby" : "btn-glass"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Mobile Horizontal Category Scroller */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORY_ITEMS.map((item) => {
            const active = currentCategory === item.value || (!currentCategory && item.value === "");
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => updateParam("category", item.value)}
                className={`shrink-0 px-3.5 py-1.5 text-[12px] font-semibold rounded-full whitespace-nowrap transition-all ${
                  active ? "glass-pill-active" : "glass-pill"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Expanded Drawer Panel */}
        {mobileFilterOpen && (
          <div className="p-4 glass-floating space-y-4 animate-scale-in border border-[#F59E0B]/30">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9E8E4]">
              <span className="text-[12px] font-bold text-[#1B1C1A]">Refine Vitrine</span>
              {hasActiveFilters && (
                <button type="button" onClick={handleClearAll} className="text-[11px] font-bold text-[#E11D48]">
                  Reset Filters
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="mobile-sort" className="text-[11px] font-bold text-[#534434]">
                Sort By
              </label>
              <select
                id="mobile-sort"
                value={currentSort || "newest"}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="w-full px-3 py-2 text-[12px] bg-white border border-[#D8C3AD] rounded-xl text-[#1B1C1A] font-semibold"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A – Z</option>
                <option value="code_asc">Catalogue Code: A – Z</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#78350F]">Collections</span>
              <div className="flex flex-wrap gap-1.5">
                {COLLECTION_ITEMS.map((item) => {
                  const active = currentCollection === item.value || (!currentCollection && item.value === "");
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => updateParam("collection", item.value)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg ${
                        active ? "bg-[#78350F] text-[#FFFFFF]" : "bg-white border border-[#D8C3AD] text-[#534434]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
