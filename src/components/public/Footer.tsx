import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock, ArrowUpRight, Sparkles } from "lucide-react";

const SHOP_LINKS = [
  { label: "Cake Catalogue", href: "/cakes" },
  { label: "Birthday Cakes", href: "/cakes?category=Birthday+Cakes" },
  { label: "Wedding Cakes", href: "/cakes?category=Wedding+Cakes" },
  { label: "Mini Cakes", href: "/cakes?category=Mini+Cakes" },
  { label: "Customize a Cake", href: "/cakes" },
];

const BRANCH_LOCATIONS = [
  { name: "Kandy City Centre", address: "124 Dalada Veediya, Kandy" },
  { name: "Katugastota Main", address: "45 Kurunegala Road, Katugastota" },
  { name: "Peradeniya Road", address: "310 Peradeniya Road, Kandy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#231713] text-[#B8A79B] border-t border-[#3D2B24] overflow-hidden pt-12 pb-8">

      {/* ── KANDY HILL SILHOUETTE (Subtle, minimalist, low-contrast mountain ridge silhouette) ── */}
      <div className="absolute top-0 left-0 right-0 w-full pointer-events-none select-none overflow-hidden opacity-30" aria-hidden="true">
        <svg
          className="w-full h-16 sm:h-24 text-[#3A271E]"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          {/* Background hills */}
          <path d="M0,95 Q 180,45 360,75 T 720,40 T 1080,80 T 1440,55 L 1440,120 L 0,120 Z" fillOpacity="0.5" />
          {/* Foreground mountain peaks */}
          <path d="M0,70 Q 240,20 480,65 T 960,25 T 1440,55 L 1440,120 L 0,120 Z" fillOpacity="0.85" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── MAIN FOOTER GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-[#3D2B24]">

          {/* 1. BRAND INTRODUCTION (col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Logo & Brand Name */}
            <Link href="/" className="inline-flex items-center gap-3.5 group">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#3D2B24] border border-[#523A30] group-hover:border-[#C88A58] transition-colors p-1 shrink-0">
                <Image
                  src="/branding/wasana-logo.png"
                  alt="Wasana Bakers"
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-serif text-lg sm:text-xl font-bold text-[#F5EFE6] block leading-tight tracking-tight">
                  Wasana Bakers
                </span>
                <span className="text-[11px] font-semibold text-[#C88A58] tracking-widest uppercase">
                  Kandy, Sri Lanka
                </span>
              </div>
            </Link>

            {/* Tagline & Statement */}
            <div className="space-y-2">
              <p className="font-serif text-base sm:text-lg italic text-[#E5D7CD]">
                &ldquo;Sweet moments, crafted in Kandy.&rdquo;
              </p>
              <p className="text-[13px] text-[#B8A79B] leading-relaxed max-w-md">
                Handcrafting delightful celebration cakes for every special moment in the hill capital of Kandy, Sri Lanka. Freshly baked daily with premium ingredients.
              </p>
            </div>

            {/* Contact details */}
            <div className="pt-1 space-y-2 text-[13px]">
              <div className="flex items-center gap-2.5 text-[#F5EFE6]">
                <Phone className="w-4 h-4 text-[#C88A58] shrink-0" aria-hidden="true" />
                <a href="tel:+94812234567" className="hover:text-[#C88A58] transition-colors font-medium">
                  +94 81 223 4567
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[#B8A79B]">
                <Clock className="w-4 h-4 text-[#C88A58] shrink-0" aria-hidden="true" />
                <span>Daily: 7:00 AM – 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* 2. NAVIGATION LINKS (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C88A58]">
              Explore Cakes
            </h3>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[#B8A79B] hover:text-[#F5EFE6] hover:translate-x-1 transition-all duration-150 inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#C88A58]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. BRANCHES & ORDERING INFO (col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C88A58]">
              Kandy Ateliers &amp; Ordering
            </h3>

            {/* Branch Locations List */}
            <div className="space-y-2.5 text-[12px]">
              {BRANCH_LOCATIONS.map((b) => (
                <div key={b.name} className="flex items-start gap-2 text-[#B8A79B]">
                  <MapPin className="w-3.5 h-3.5 text-[#C88A58] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-[#F5EFE6]">{b.name}</span>
                    <span className="block text-[11px] text-[#A39286]">{b.address}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ordering Info Callout */}
            <div className="p-3.5 rounded-xl bg-[#2D1E18]/80 border border-[#3D2B24] space-y-1.5 text-[12px]">
              <div className="flex items-center gap-2 text-[#F5EFE6] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#C88A58]" aria-hidden="true" />
                <span>4-Day Advance Preparation</span>
              </div>
              <p className="text-[11px] text-[#A39286] leading-relaxed">
                Custom designs available. Pickup only from Kandy branches in LKR currency.
              </p>
            </div>
          </div>

        </div>

        {/* ── BRAND DETAIL DECORATIVE LINE ── */}
        <div className="py-4 text-center">
          <p className="font-serif text-[11px] sm:text-[12px] tracking-widest text-[#A39286] uppercase">
            Freshly baked in Kandy &nbsp;·&nbsp; Made for your celebrations
          </p>
        </div>

        {/* ── BOTTOM COPYRIGHT BAR ── */}
        <div className="pt-4 border-t border-[#3D2B24] flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-[#A39286] text-center sm:text-left">
          <p>© {year} Wasana Bakers. All rights reserved.</p>

          <div className="flex items-center justify-center gap-3 text-[12px]">
            
            <span className="text-[#3D2B24] hidden sm:inline" aria-hidden="true">|</span>
            <Link href="/admin/login" className="hover:text-[#C88A58] transition-colors font-medium">
              Staff Login
            </Link>
            <span>Crafted with care in Kandy, Sri Lanka 🇱🇰</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
