"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User } from "lucide-react";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-[90] bg-white/95 backdrop-blur-md border-t border-[#E9E8E4] shadow-lg"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch h-14">
        {/* 1. HOME TAB */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
            pathname === "/" ? "text-[#F59E0B]" : "text-[#534434] hover:text-[#1B1C1A]"
          }`}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Home
            className={`w-5 h-5 ${pathname === "/" ? "text-[#F59E0B]" : "text-[#534434]/70"}`}
            aria-hidden="true"
          />
          Home
        </Link>

        {/* 2. PROFILE TAB */}
        <Link
          href="/admin"
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
            pathname.startsWith("/admin") ? "text-[#F59E0B]" : "text-[#534434] hover:text-[#1B1C1A]"
          }`}
          aria-current={pathname.startsWith("/admin") ? "page" : undefined}
        >
          <User
            className={`w-5 h-5 ${pathname.startsWith("/admin") ? "text-[#F59E0B]" : "text-[#534434]/70"}`}
            aria-hidden="true"
          />
          Profile
        </Link>
      </div>
    </nav>
  );
}
