"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
      // Scroll to top of grid
      window.scrollTo({ top: 120, behavior: "smooth" });
    });
  };

  // Build page numbers array (e.g. [1, 2, 3])
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      className="flex items-center justify-center gap-2 pt-10 pb-4"
      aria-label="Catalogue pagination"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1 || isPending}
        className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-bold transition-all ${
          currentPage === 1 || isPending
            ? "opacity-40 cursor-not-allowed bg-white/50 text-[#867461] border border-[#D8C3AD]"
            : "glass-pill hover:border-[#F59E0B] text-[#1B1C1A]"
        }`}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5">
        {getPageNumbers().map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-[13px] text-[#867461] font-bold">
                …
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => goToPage(pageNum)}
              disabled={isPending}
              aria-current={isActive ? "page" : undefined}
              className={`w-9 h-9 rounded-full text-[13px] font-bold transition-all flex items-center justify-center ${
                isActive
                  ? "bg-[#F59E0B] text-[#1B1C1A] shadow-md scale-105"
                  : "glass-pill text-[#1B1C1A] hover:bg-white"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages || isPending}
        className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-bold transition-all ${
          currentPage === totalPages || isPending
            ? "opacity-40 cursor-not-allowed bg-white/50 text-[#867461] border border-[#D8C3AD]"
            : "btn-primary-gold text-[#1B1C1A]"
        }`}
        aria-label="Go to next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
