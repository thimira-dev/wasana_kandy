"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, RotateCcw } from "lucide-react";
import { KNOWN_COLLECTIONS, MAIN_CATEGORIES } from "@/lib/domain/catalogue";

interface CatalogueFilterBarProps {
  currentSearch?: string;
  currentCategory?: string;
  currentCollection?: string;
  currentSort?: string;
}

// Map categories to short flavour-style labels for the chips
const CATEGORY_CHIPS = [
  { label: "All Flavors", value: "" },
  ...MAIN_CATEGORIES.map((cat) => ({
    label: cat.replace(" Cakes", "").replace("Cup Cakes", "Cupcakes"),
    value: cat,
  })),
];

const COLLECTION_CHIPS = [
  { label: "All Types",  value: "" },
  ...KNOWN_COLLECTIONS.slice(0, 8).map((col) => ({
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
    <div className="space-y-3 mb-6">

      {/* ── SEARCH ── */}
      <form onSubmit={handleSearchSubmit} role="search">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A7568]">
            <Search className="w-4 h-4" aria-hidden="true" />
          </span>
          <input
            type="search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search handcrafted cakes & catalogue codes…"
            aria-label="Search cakes"
            className="w-full pl-10 pr-9 py-2.5 text-[13px] bg-white border border-[#E8E0D8] rounded-xl text-[#3D2B24] placeholder:text-[#BDB0A7] focus:outline-none focus:ring-2 focus:ring-[#C88A58]/25 focus:border-[#C88A58] transition-all shadow-[0_1px_3px_0_rgb(61_43_36_/_0.06)]"
          />
          {searchVal && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A7568] hover:text-[#3D2B24]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {/* ── CATEGORY CHIPS (Flavor Profile row) ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C88A58] flex items-center gap-1.5 mb-2 px-0.5">
          <span className="w-1 h-1 rounded-full bg-[#C88A58] inline-block" aria-hidden="true" />
          Category
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" role="group" aria-label="Filter by category">
          {CATEGORY_CHIPS.map((chip) => {
            const active = currentCategory === chip.value || (!currentCategory && chip.value === "");
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => updateParam("category", chip.value)}
                aria-pressed={active}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 whitespace-nowrap ${
                  active
                    ? "bg-[#3D2B24] text-white shadow-[0_2px_8px_0_rgb(61_43_36_/_0.20)]"
                    : "bg-white border border-[#E8E0D8] text-[#3D2B24] hover:border-[#3D2B24] hover:bg-[#F0EAE7]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COLLECTION CHIPS (Type / Code row) ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#A3B19B] flex items-center gap-1.5 mb-2 px-0.5">
          <span className="w-1 h-1 rounded-full bg-[#A3B19B] inline-block" aria-hidden="true" />
          Collection
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5" role="group" aria-label="Filter by collection">
          {COLLECTION_CHIPS.map((chip) => {
            const active = currentCollection === chip.value || (!currentCollection && chip.value === "");
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => updateParam("collection", chip.value)}
                aria-pressed={active}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 whitespace-nowrap ${
                  active
                    ? "bg-[#A3B19B] text-white shadow-[0_2px_8px_0_rgb(163_177_155_/_0.30)]"
                    : "bg-white border border-[#E8E0D8] text-[#3D2B24] hover:border-[#A3B19B] hover:bg-[#EBF0E9]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SORT (desktop only inline, mobile hidden — sort by newest default) ── */}
      <div className="hidden sm:flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-[12px] font-semibold text-[#8A7568] shrink-0">
            Sort:
          </label>
          <select
            id="sort-select"
            value={currentSort || "newest"}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="px-2.5 py-1.5 text-[12px] bg-white border border-[#E8E0D8] rounded-lg text-[#3D2B24] font-medium focus:ring-2 focus:ring-[#C88A58]/25 focus:outline-none focus:border-[#C88A58] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A – Z</option>
            <option value="code_asc">Catalogue Code: A – Z</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#8A7568] hover:text-[#3D2B24] hover:bg-[#F0EAE7] transition-colors border border-[#E8E0D8]"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {/* Mobile: Clear all pill */}
      {hasActiveFilters && (
        <div className="sm:hidden flex justify-end">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#8A7568] hover:text-[#3D2B24] border border-[#E8E0D8] bg-white"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Reset filters
          </button>
        </div>
      )}

      {isPending && (
        <p className="text-[11px] text-[#C88A58] font-medium animate-pulse-soft text-center">
          Updating catalogue…
        </p>
      )}
    </div>
  );
}
