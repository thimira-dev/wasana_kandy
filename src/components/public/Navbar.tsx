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
  Menu,
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

  const [scrolled,        setScrolled]        = useState(false);
  const [searchOpen,      setSearchOpen]      = useState(false);
  const [searchVal,       setSearchVal]       = useState(searchParams.get("search") || "");
  const [catOpen,         setCatOpen]         = useState(false);
  const [branchOpen,      setBranchOpen]      = useState(false);
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [activeBranch,    setActiveBranch]    = useState(BRANCHES[0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setCatOpen(false);
    setBranchOpen(false);
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════
          TIER 1 — Announcement / Info Bar (Deep Charcoal + Warm Amber Accent)
          ══════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#111111] via-[#2D1F0D] to-[#111111] text-[#E3E2DF] text-[12px] hidden sm:block border-b border-[#F59E0B]/20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
          {/* Left: promo text */}
          <p className="font-medium truncate flex items-center gap-2">
            <span className="text-base">🎂</span>
            <span>Artisanal Celebration Cakes — Handcrafted in Kandy.</span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#1B1C1A] font-extrabold text-[10px] tracking-wide shadow-xs">
              4-Day Advance Order
            </span>
          </p>

          {/* Right: phone + hours */}
          <div className="flex items-center gap-5 shrink-0">
            <a
              href="tel:+94812234567"
              className="flex items-center gap-1.5 text-[#FBBF24] hover:text-[#F59E0B] font-semibold transition-colors"
            >
              <Phone className="w-3 h-3 text-[#F59E0B]" aria-hidden="true" />
              +94 81 223 4567
            </a>
            <span className="flex items-center gap-1.5 text-stone-300">
              <Clock className="w-3 h-3 text-[#F59E0B]" aria-hidden="true" />
              Daily: 7:00 AM – 8:00 PM
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TIER 2 — Floating iOS Glass Navbar
          ══════════════════════════════════════════════════ */}
      <header
        className={[
          "sticky top-0 z-50 w-full transition-all duration-200 glass-nav bg-gradient-to-r from-[#FAF9F5]/90 via-[#FFF9ED]/95 to-[#FAF9F5]/90",
          scrolled ? "shadow-[0_8px_30px_rgb(245_158_11_/_0.12)] border-b border-[#F59E0B]/30" : "",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-[74px] gap-4">

            {/* ── LOGO ── */}
            <Link
              href="/cakes"
              className="flex items-center gap-3 shrink-0 group mr-2"
              aria-label="Wasana Bakers — Home"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 overflow-hidden rounded-2xl border border-[#F59E0B]/30 bg-gradient-to-br from-amber-50 to-orange-50/50 group-hover:scale-105 group-hover:border-[#F59E0B] transition-all duration-200 shadow-xs">
                <Image
                  src="/branding/wasana-logo.png"
                  alt="Wasana Bakers Logo"
                  fill
                  sizes="64px"
                  priority
                  className="object-contain p-1"
                />
              </div>
              <div className="leading-tight">
                <span className="font-serif text-[17px] sm:text-[19px] font-bold text-[#1B1C1A] block tracking-tight leading-none group-hover:text-[#D97706] transition-colors">
                  Wasana Bakers
                </span>
                <span className="text-[9.5px] font-bold tracking-[0.16em] uppercase bg-gradient-to-r from-[#855300] to-[#D97706] bg-clip-text text-transparent block mt-1">
                  Artisanal Confectionery
                </span>
              </div>
            </Link>

            {/* ── DESKTOP NAV LINKS ── */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setCatOpen((p) => !p); setBranchOpen(false); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-[#1B1C1A] hover:text-[#F59E0B] rounded-full hover:bg-white/60 transition-all duration-150"
                  aria-expanded={catOpen}
                  aria-haspopup="true"
                >
                  Cake Categories
                  <ChevronDown className={`w-3.5 h-3.5 text-[#855300] transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {catOpen && (
                  <div className="absolute top-full left-0 mt-2 w-60 glass-floating p-2 overflow-hidden animate-scale-in z-50">
                    <Link
                      href="/cakes"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 text-[13px] font-bold text-[#1B1C1A] bg-[#FAF9F5] rounded-xl hover:bg-[#F59E0B] hover:text-[#1B1C1A] transition-colors"
                    >
                      All Confectionery &amp; Cakes
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <div className="py-1.5 space-y-0.5">
                      {MAIN_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryClick(cat)}
                          className="w-full text-left px-3.5 py-2 text-[13px] font-medium text-[#1B1C1A] hover:bg-white hover:text-[#F59E0B] rounded-lg transition-colors"
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
                className="px-3.5 py-2 text-[13px] font-semibold text-[#1B1C1A] hover:text-[#F59E0B] rounded-full hover:bg-white/60 transition-all duration-150"
              >
                Catalogue Matrix
              </Link>
            </nav>

            {/* Spacer */}
            <div className="flex-1" aria-hidden="true" />

            {/* ── RIGHT: KANDY PICKUP SELECTOR ── */}
            <div className="hidden md:block relative">
              <button
                type="button"
                onClick={() => { setBranchOpen((p) => !p); setCatOpen(false); }}
                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill hover:border-[#F59E0B] transition-all group"
                aria-expanded={branchOpen}
                aria-haspopup="listbox"
                aria-label="Select pickup branch"
              >
                <div className="w-6 h-6 rounded-full bg-[#F59E0B]/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-[#534434] font-bold uppercase tracking-wider leading-none">Pickup Atelier</p>
                  <p className="text-[12px] font-bold text-[#1B1C1A] leading-tight truncate max-w-[150px]">
                    {activeBranch.name}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#867461] ml-0.5 transition-transform duration-200 ${branchOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {branchOpen && (
                <div
                  role="listbox"
                  aria-label="Select pickup branch"
                  className="absolute top-full right-0 mt-2 w-64 glass-floating p-3 z-50 animate-scale-in"
                >
                  <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#855300]">
                    Kandy Ateliers
                  </p>
                  <div className="space-y-1">
                    {BRANCHES.map((branch) => (
                      <button
                        key={branch.id}
                        role="option"
                        aria-selected={activeBranch.id === branch.id}
                        type="button"
                        onClick={() => { setActiveBranch(branch); setBranchOpen(false); }}
                        className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                          activeBranch.id === branch.id
                            ? "bg-[#F59E0B] text-[#1B1C1A] font-bold shadow-sm"
                            : "hover:bg-white/80 text-[#1B1C1A]"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${activeBranch.id === branch.id ? "bg-[#1B1C1A]" : "bg-[#D8C3AD]"}`} aria-hidden="true" />
                        <div>
                          <p className="text-[12px] font-bold leading-tight">{branch.name}</p>
                          <p className="text-[10px] opacity-80">{branch.area}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: SEARCH, STAFF SIGN IN & MOBILE TOGGLE ── */}
            <div className="flex items-center gap-2 shrink-0">

              {!searchOpen ? (
                <button
                  type="button"
                  onClick={() => { setSearchOpen(true); setBranchOpen(false); setCatOpen(false); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-full text-[#1B1C1A] hover:bg-white/80 glass-pill transition-colors"
                  aria-label="Open search"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <>
                  <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-1" role="search">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#855300]">
                        <Search className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <input
                        autoFocus
                        type="search"
                        value={searchVal}
                        onChange={(e) => setSearchVal(e.target.value)}
                        placeholder="Search cakes or catalogue code…"
                        aria-label="Search cakes"
                        className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-[13px] bg-white/90 backdrop-blur-md border border-[#F59E0B] rounded-full text-[#1B1C1A] placeholder:text-[#867461] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="p-2 rounded-full text-[#534434] hover:bg-white/80 transition-colors"
                      aria-label="Close search"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="sm:hidden p-2.5 rounded-full text-[#1B1C1A] hover:bg-white/80 glass-pill transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </>
              )}

              {/* Mobile Hamburger Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen((p) => !p);
                  setSearchOpen(false);
                  setBranchOpen(false);
                  setCatOpen(false);
                }}
                className="lg:hidden p-2.5 rounded-full text-[#1B1C1A] hover:bg-white/80 glass-pill transition-colors flex items-center justify-center"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#1B1C1A]" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5 text-[#1B1C1A]" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* ── MOBILE SEARCH BAR ── */}
          {searchOpen && (
            <div className="sm:hidden pb-3 animate-fade-in">
              <form onSubmit={handleSearch} role="search">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#855300]">
                    <Search className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <input
                    autoFocus
                    type="search"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search cakes or code (e.g. G-43)…"
                    aria-label="Search cakes"
                    className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-[#F59E0B] rounded-full text-[#1B1C1A] placeholder:text-[#867461] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/40"
                  />
                </div>
              </form>
            </div>
          )}

          {/* ── MOBILE NAVIGATION MENU DRAWER ── */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-5 pt-3 px-2 space-y-4 border-t border-[#F59E0B]/25 bg-gradient-to-b from-white/95 via-[#FFFDF7]/95 to-[#FEF3C7]/40 backdrop-blur-xl animate-fade-in rounded-b-2xl shadow-lg">
              <div className="space-y-1">
                <Link
                  href="/cakes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-[#1B1C1A] bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-xl shadow-xs hover:scale-[1.01] transition-transform"
                >
                  <span>All Confectionery &amp; Cakes</span>
                  <ChevronRight className="w-4 h-4 text-[#1B1C1A]" />
                </Link>

                <div className="py-2 space-y-0.5">
                  <p className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-[#855300] mb-1">
                    Categories
                  </p>
                  {MAIN_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#1B1C1A] hover:bg-white/90 hover:text-[#D97706] rounded-xl transition-all flex items-center justify-between"
                    >
                      <span>{cat}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#867461]" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Pickup Branch Selection */}
              <div className="pt-3 border-t border-[#F59E0B]/20">
                <p className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-[#855300] mb-2">
                  Pickup Atelier
                </p>
                <div className="space-y-1.5 px-1">
                  {BRANCHES.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => { setActiveBranch(branch); setMobileMenuOpen(false); }}
                      className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${
                        activeBranch.id === branch.id
                          ? "bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-[#1B1C1A] font-bold shadow-xs border border-[#F59E0B]/40"
                          : "bg-white/80 border border-[#E9E8E4] text-[#1B1C1A]"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${activeBranch.id === branch.id ? "bg-[#1B1C1A]" : "bg-[#D8C3AD]"}`} aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold leading-tight">{branch.name}</p>
                        <p className="text-[10px] opacity-80">{branch.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Portal Link */}
              <div className="pt-3 border-t border-[#F59E0B]/20">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold btn-primary-gold rounded-full shadow-md"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Staff Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Backdrop */}
      {(catOpen || branchOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs"
          onClick={() => { setCatOpen(false); setBranchOpen(false); setMobileMenuOpen(false); }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
