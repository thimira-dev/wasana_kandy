import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Clock, ArrowUpRight, Sparkles, ShieldCheck } from "lucide-react";

const SHOP_LINKS = [
  { label: "Cake Catalogue", href: "/cakes" },
  { label: "Birthday Cakes", href: "/cakes?category=Birthday+Cakes" },
  { label: "Wedding Cakes", href: "/cakes?category=Wedding+Cakes" },
  { label: "Mini Cakes", href: "/cakes?category=Mini+Cakes" },
  { label: "Custom Cake Studio", href: "/cakes" },
];

const BRANCH_LOCATIONS = [
  { name: "Kandy City Centre", address: "124 Dalada Veediya, Kandy" },
  { name: "Katugastota Main", address: "45 Kurunegala Road, Katugastota" },
  { name: "Peradeniya Road", address: "310 Peradeniya Road, Kandy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#111111] text-[#A1A1AA] border-t border-white/10 overflow-hidden pt-14 pb-8">

      {/* ── KANDY LAKE & HILL CONTOUR SILHOUETTE (Single-pixel line vector outline) ── */}
      <div className="absolute top-0 left-0 right-0 w-full pointer-events-none select-none overflow-hidden opacity-25" aria-hidden="true">
        <svg
          className="w-full h-20 sm:h-28 text-white/10"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M0,95 Q 180,45 360,75 T 720,40 T 1080,80 T 1440,55" />
          <path d="M0,70 Q 240,20 480,65 T 960,25 T 1440,55" />
        </svg>
      </div>

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── MAIN FOOTER GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-white/10">

          {/* 1. BRAND INTRODUCTION (col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            <Link href="/cakes" className="inline-flex items-center gap-3.5 group">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/10 border border-white/15 group-hover:border-[#F59E0B] transition-colors p-1 shrink-0">
                <Image
                  src="/branding/wasana-logo.png"
                  alt="Wasana Bakers"
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-[#FAFAF9] block leading-tight tracking-tight">
                  Wasana Bakers
                </span>
                <span className="text-[11px] font-bold text-[#F59E0B] tracking-widest uppercase">
                  Artisanal Confectionery · Kandy
                </span>
              </div>
            </Link>

            <div className="space-y-2">
              <p className="font-serif text-base sm:text-lg italic text-[#FAFAF9]">
                &ldquo;Sweet moments, crafted in Kandy.&rdquo;
              </p>
              <p className="text-[13px] text-[#A1A1AA] leading-relaxed max-w-md">
                Handcrafting bespoke celebration cakes, gateaux, and confections in the central highlands of Sri Lanka. Baked fresh daily with finest ingredients.
              </p>
            </div>

            <div className="pt-1 space-y-2 text-[13px]">
              <div className="flex items-center gap-2.5 text-[#FAFAF9]">
                <Phone className="w-4 h-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
                <a href="tel:+94812234567" className="hover:text-[#F59E0B] transition-colors font-semibold">
                  +94 81 223 4567
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-[#A1A1AA]">
                <Clock className="w-4 h-4 text-[#F59E0B] shrink-0" aria-hidden="true" />
                <span>Daily Atelier Hours: 7:00 AM – 8:00 PM</span>
              </div>
            </div>
          </div>

          {/* 2. NAVIGATION LINKS (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#F59E0B]">
              Vitrine Categories
            </h3>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[#A1A1AA] hover:text-[#FAFAF9] hover:translate-x-1 transition-all duration-150 inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#F59E0B]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. BRANCHES & OPERATING GUARANTEES (col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#F59E0B]">
              Kandy Ateliers &amp; Delivery
            </h3>

            <div className="space-y-3 text-[12px]">
              {BRANCH_LOCATIONS.map((b) => (
                <div key={b.name} className="flex items-start gap-2.5 text-[#A1A1AA]">
                  <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-[#FAFAF9]">{b.name}</span>
                    <span className="block text-[11px] text-stone-400">{b.address}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-[12px] backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#FAFAF9] font-bold">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
                <span>4-Day Advance Preparation Required</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                All custom cakes are baked fresh to order. Pickups available at all Kandy branches. Prices listed in LKR.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-[#F59E0B] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Guaranteed Quality &amp; Hygiene
              </div>
            </div>
          </div>

        </div>

        {/* ── DECORATIVE SUB-LINE ── */}
        <div className="py-4 text-center">
          <p className="text-[11px] tracking-widest text-stone-500 uppercase font-medium">
            Handcrafted in Kandy &nbsp;·&nbsp; Artisanal Confectionery Glass
          </p>
        </div>

        {/* ── BOTTOM COPYRIGHT ── */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-stone-500 text-center sm:text-left">
          <p>© {year} Wasana Bakers Kandy. All rights reserved.</p>

          <div className="flex items-center justify-center gap-4 text-[12px]">
            <Link href="/admin/login" className="hover:text-[#F59E0B] transition-colors font-bold text-stone-400">
              Staff Portal
            </Link>
            <span>Central Highlands, Sri Lanka 🇱🇰</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
