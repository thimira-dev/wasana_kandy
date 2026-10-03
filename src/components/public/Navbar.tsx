"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  X,
  Search,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { MAIN_CATEGORIES } from "@/lib/domain/catalogue";

const BRANCHES = [
  { id: "main", name: "Kandy City Centre (Dalada Veediya)", area: "Kandy City" },
  { id: "katugastota", name: "Katugastota Branch", area: "Katugastota" },
  { id: "peradeniya", name: "Peradeniya Branch", area: "Peradeniya" },
];

export function Navbar() {
  const router        = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const [, startTx]  = useTransition();

  const [scrolled,      setScrolled]      = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchVal,     setSearchVal]     = useState(searchParams.get("search") || "");
  const [catOpen,       setCatOpen]       = useState(false);
  const [branchOpen,    setBranchOpen]    = useState(false);
  const [activeBranch,  setActiveBranch]  = useState(BRANCHES[0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setCatOpen(false);
    setBranchOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    startTx(() => router.push(q ? `/cakes?search=${encodeURIComponent(q)}` : "/cakes"));
    setSearchOpen(false);
  };

  const handleCategoryClick = (cat: string) => {
    startTx(() => router.push(`/cakes?category=${encodeURIComponent(cat)}`));
    setCatOpen(false);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════
          TIER 1 — Announcement / Info bar  (dark chocolate)
          ══════════════════════════════════════════════════ */}
      <div className="bg-[#3D2B24] text-[#E8D9C8] text-[12px] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
          {/* Left: promo text */}
          <p className="font-jakarta font-medium truncate">
            🎂&nbsp; Custom celebration cakes — freshly handcrafted in Kandy.&nbsp;
            <span className="text-[#C88A58] font-semibold">4-Day advance order required.</span>
          </p>

          {/* Right: phone + hours */}
          <div className="flex items-center gap-5 shrink-0">
            <a
              href="tel:+94812234567"
              className="flex items-center gap-1.5 hover:text-[#C88A58] transition-colors"
            >
              <Phone className="w-3 h-3" aria-hidden="true" />
              +94 81 223 4567
            </a>
            <span className="flex items-center gap-1.5 text-[#A08878]">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Daily: 7:00 AM – 8:00 PM
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TIER 2 — Main navbar
          ══════════════════════════════════════════════════ */}
      <header
        className={[
          "sticky top-0 z-50 w-full transition-all duration-200 bg-[#FAF7F2]",
          scrolled
            ? "shadow-[0_2px_12px_0_rgb(61_43_36_/_0.10)] border-b border-[#E8E0D8]"
            : "border-b border-[#E8E0D8]",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-[62px] gap-4">

            {/* ── LOGO ── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group mr-2"
              aria-label="Wasana Bakers — Home"
            >
              <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-lg bg-[#3D2B24] group-hover:opacity-90 transition-opacity">
                <Image
                  src="/branding/wasana-logo.png"
                  alt="Wasana Bakers Logo"
                  fill
                  sizes="40px"
                  priority
                  className="object-contain p-1.5"
                />
              </div>
              <div className="leading-tight">
                <span className="font-serif text-[15px] font-bold text-[#3D2B24] block tracking-tight leading-none">
                  Wasana Bakers
                </span>
                <span className="text-[9px] font-jakarta font-semibold tracking-[0.15em] uppercase text-[#8A7568] block mt-0.5">
                  Artisanal Bakery &amp; Café
                </span>
              </div>
            </Link>

            {/* ── DESKTOP NAV LINKS ── */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setCatOpen((p) => !p); setBranchOpen(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-[#3D2B24] hover:text-[#C88A58] rounded-lg hover:bg-[#F0EAE7] transition-all duration-150"
                  aria-expanded={catOpen}
                  aria-haspopup="true"
                >
                  Cakes
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {catOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#E8E0D8] rounded-xl shadow-[0_8px_28px_-4px_rgb(61_43_36_/_0.14)] overflow-hidden animate-scale-in z-50">
                    <Link
                      href="/cakes"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-[#3D2B24] bg-[#FAF7F2] border-b border-[#E8E0D8] hover:bg-[#F0EAE7] transition-colors"
                    >
                      All Cakes
                      <ChevronRight className="w-3.5 h-3.5 text-[#8A7568]" aria-hidden="true" />
                    </Link>
                    <div className="py-1">
                      {MAIN_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryClick(cat)}
                          className="w-full text-left px-4 py-2 text-[13px] text-[#3D2B24] hover:bg-[#FAF7F2] hover:text-[#C88A58] transition-colors duration-100"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/cakes"
                className="px-3 py-1.5 text-[13px] font-medium text-[#3D2B24] hover:text-[#C88A58] rounded-lg hover:bg-[#F0EAE7] transition-all duration-150"
              >
                Catalogue
              </Link>
            </nav>

            {/* Spacer pushes everything after here to the right */}
            <div className="flex-1" aria-hidden="true" />

            {/* ── RIGHT: BRANCH SELECTOR ── */}
            <div className="hidden md:block relative">
              <button
                type="button"
                onClick={() => { setBranchOpen((p) => !p); setCatOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8E0D8] bg-white hover:border-[#C88A58] transition-all duration-150 group"
                aria-expanded={branchOpen}
                aria-haspopup="listbox"
                aria-label="Select pickup branch"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C88A58] shrink-0" aria-hidden="true" />
                <div className="text-left">
                  <p className="text-[11px] text-[#8A7568] leading-none">Pickup from</p>
                  <p className="text-[13px] font-semibold text-[#3D2B24] leading-tight">
                    {activeBranch.name}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8A7568] ml-1 transition-transform duration-200 ${branchOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {branchOpen && (
                <div
                  role="listbox"
                  aria-label="Select pickup branch"
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white border border-[#E8E0D8] rounded-xl shadow-[0_8px_28px_-4px_rgb(61_43_36_/_0.14)] overflow-hidden animate-scale-in z-50"
                >
                  <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8A7568]">
                    Kandy Branches
                  </p>
                  {BRANCHES.map((branch) => (
                    <button
                      key={branch.id}
                      role="option"
                      aria-selected={activeBranch.id === branch.id}
                      type="button"
                      onClick={() => { setActiveBranch(branch); setBranchOpen(false); }}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                        activeBranch.id === branch.id
                          ? "bg-[#F7EBE0] text-[#C88A58]"
                          : "hover:bg-[#FAF7F2] text-[#3D2B24]"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${activeBranch.id === branch.id ? "bg-[#C88A58]" : "bg-[#E8E0D8]"}`} aria-hidden="true" />
                      <div>
                        <p className="text-[13px] font-semibold leading-tight">{branch.name}</p>
                        <p className="text-[11px] text-[#8A7568]">{branch.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Search + Sign In ── */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Search icon → expands */}
              {!searchOpen ? (
                <button
                  type="button"
                  onClick={() => { setSearchOpen(true); setBranchOpen(false); setCatOpen(false); }}
                  className="p-2 rounded-lg text-[#3D2B24] hover:bg-[#F0EAE7] transition-colors"
                  aria-label="Open search"
                >
                  <Search className="w-[18px] h-[18px]" aria-hidden="true" />
                </button>
              ) : (
                <form onSubmit={handleSearch} className="flex items-center gap-1" role="search">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7568]">
                      <Search className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <input
                      autoFocus
                      type="search"
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                      placeholder="Search cakes…"
                      aria-label="Search cakes"
                      className="w-44 sm:w-56 pl-9 pr-3 py-1.5 text-[13px] bg-white border border-[#E8E0D8] rounded-lg text-[#3D2B24] placeholder:text-[#BDB0A7] focus:outline-none focus:ring-2 focus:ring-[#C88A58]/25 focus:border-[#C88A58] transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 rounded-lg text-[#8A7568] hover:bg-[#F0EAE7] transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>
              )}

              {/* Sign In → Admin login */}
              <Link
                href="/admin"
                id="nav-sign-in"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold rounded-lg border border-[#3D2B24] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white transition-all duration-150"
                aria-label="Staff sign in"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                Sign In
              </Link>
            </div>
          </div>

          {/* ── MOBILE SEARCH ── */}
          {searchOpen && (
            <div className="sm:hidden pb-3 animate-fade-in">
              <form onSubmit={handleSearch} role="search">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7568]">
                    <Search className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    autoFocus
                    type="search"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search cakes or catalogue code…"
                    aria-label="Search cakes"
                    className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-[#E8E0D8] rounded-lg text-[#3D2B24] placeholder:text-[#BDB0A7] focus:outline-none focus:ring-2 focus:ring-[#C88A58]/25 focus:border-[#C88A58] transition-all"
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Click-away backdrop */}
      {(catOpen || branchOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setCatOpen(false); setBranchOpen(false); }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
