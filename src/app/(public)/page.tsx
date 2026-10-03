import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cake, Palette, MapPin, Calendar, Star } from "lucide-react";
import { ProductService } from "@/lib/services/product-service";
import { formatLKR } from "@/lib/domain/pricing";
import { getProductDisplayName } from "@/lib/domain/catalogue";
import { MAIN_CATEGORIES, KNOWN_COLLECTIONS } from "@/lib/domain/catalogue";
import { HERO_CONTENT, TRUST_STRIP, TESTIMONIALS_SECTION } from "@/content/placeholders";
import { CakeCard } from "@/components/public/CakeCard";
import { AteliersMapSection } from "@/components/public/AteliersMapSection";

export const revalidate = 60;

const TRUST_ICONS: Record<string, React.FC<{ className?: string }>> = {
  cake:      (p) => <Cake {...p} />,
  palette:   (p) => <Palette {...p} />,
  "map-pin": (p) => <MapPin {...p} />,
  calendar:  (p) => <Calendar {...p} />,
};

// Editorial category styles — alternating colours from the palette
const CAT_STYLES = [
  "bg-[#F0EAE7] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white",
  "bg-[#F7EBE0] text-[#C88A58] hover:bg-[#C88A58] hover:text-white",
  "bg-[#EBF0E9] text-[#A3B19B] hover:bg-[#A3B19B] hover:text-white",
  "bg-[#F4F0EA] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white",
  "bg-[#F7EBE0] text-[#C88A58] hover:bg-[#C88A58] hover:text-white",
  "bg-[#EBF0E9] text-[#A3B19B] hover:bg-[#A3B19B] hover:text-white",
  "bg-[#F0EAE7] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white",
  "bg-[#F7EBE0] text-[#C88A58] hover:bg-[#C88A58] hover:text-white",
];

const CAT_EMOJI: Record<string, string> = {
  "Birthday Cakes":    "🎂",
  "Wedding Cakes":     "💍",
  "Celebration Cakes": "🎉",
  "Mini Cakes":        "🧁",
  "Printed Cakes":     "🖨️",
  "Special Cakes":     "⭐",
  "Seasonal Cakes":    "🌸",
  "Cup Cakes":         "☕",
};

export default async function HomePage() {
  const allCakes = await ProductService.getPublishedProducts({ sort: "newest" });
  const featuredCakes = allCakes.slice(0, 8);
  const heroCake = allCakes[0] ?? null;

  return (
    <div className="bg-[#FAF7F2] min-h-screen">

      {/* ══════════════════════════════════════════════════════
          HERO — split layout: text left, image right
          ══════════════════════════════════════════════════════ */}
      <section className="bg-[#FAF7F2] border-b border-[#E8E0D8]" aria-label="Hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── LEFT COPY ── */}
            <div className="space-y-6 animate-fade-in">

              {/* Pre-title pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8E0D8] bg-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C88A58] block" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8A7568]">
                  Handcrafted in Kandy, Sri Lanka
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#3D2B24] leading-[1.1] tracking-tight">
                {HERO_CONTENT.headline}
              </h1>

              <p className="text-[15px] text-[#8A7568] leading-relaxed max-w-md">
                {HERO_CONTENT.subtext}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={HERO_CONTENT.primaryCta.href}
                  id="hero-order-now"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg bg-[#3D2B24] text-white hover:bg-[#C88A58] transition-colors duration-200"
                >
                  Order Cake Now
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href={HERO_CONTENT.secondaryCta.href}
                  id="hero-customize"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg border border-[#3D2B24] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white transition-all duration-200"
                >
                  Customize Your Cake
                </Link>
              </div>

              {/* Factual bullets */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2 border-t border-[#E8E0D8] pt-5 text-[12px] text-[#8A7568]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#A3B19B] block" aria-hidden="true" />
                  Fresh Daily
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#C88A58] block" aria-hidden="true" />
                  Custom Designs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#3D2B24] block" aria-hidden="true" />
                  Pickup in Kandy
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8A7568] block" aria-hidden="true" />
                  4-Day Advance Order
                </span>
              </div>
            </div>

            {/* ── RIGHT IMAGE ── */}
            <div className="relative animate-slide-up">
              {/* Main image */}
              <div className="relative aspect-square w-full max-w-sm mx-auto lg:max-w-none rounded-2xl overflow-hidden bg-[#F4F0EA] border border-[#E8E0D8] shadow-[0_8px_40px_-8px_rgb(61_43_36_/_0.18)]">
                <Image
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&auto=format&fit=crop&q=85"
                  alt="Beautiful handcrafted celebration cake by Wasana Bakers Kandy"
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 500px"
                  className="object-cover"
                />
              </div>

              {/* Floating mini card — real product data */}
              {heroCake && (() => {
                const img = heroCake.images.find((i) => i.isPrimary) || heroCake.images[0];
                return (
                  <div className="absolute -bottom-5 -left-4 lg:-left-6 bg-white border border-[#E8E0D8] rounded-xl shadow-[0_4px_20px_0_rgb(61_43_36_/_0.12)] p-3 flex items-center gap-3 max-w-[200px] animate-scale-in">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#F4F0EA]">
                      {img ? (
                        <Image src={img.url} alt={heroCake.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Cake className="w-5 h-5 text-[#C88A58]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#8A7568] truncate">{getProductDisplayName(heroCake)}</p>
                      <p className="text-[13px] font-bold text-[#3D2B24]">{formatLKR(heroCake.basePrice.toString())}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Sage accent dot */}
              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-[#EBF0E9] border-4 border-[#FAF7F2] hidden lg:flex items-center justify-center" aria-hidden="true">
                <Star className="w-6 h-6 text-[#A3B19B]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUST STRIP — minimal icon row
          ══════════════════════════════════════════════════════ */}
      {TRUST_STRIP.enabled && (
        <section className="bg-white border-b border-[#E8E0D8] py-7" aria-label="Why Wasana Bakers">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TRUST_STRIP.items.map((item: { icon: string; heading: string; body: string }) => {
                const Icon = TRUST_ICONS[item.icon];
                return (
                  <div key={item.icon} className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-[#F4F0EA] flex items-center justify-center mt-0.5">
                      {Icon && <Icon className="w-4 h-4 text-[#C88A58]" />}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#3D2B24] leading-tight">{item.heading}</p>
                      <p className="text-[11px] text-[#8A7568] mt-0.5 leading-snug">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          CATEGORY CHIPS ROW
          ══════════════════════════════════════════════════════ */}
      <section className="py-10" aria-label="Shop by category">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3D2B24]">
              Shop by Category
            </h2>
            <Link
              href="/cakes"
              className="text-[12px] font-semibold text-[#C88A58] hover:text-[#3D2B24] transition-colors flex items-center gap-1"
            >
              See All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Scrollable chip row */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
            <Link
              href="/cakes"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold bg-[#3D2B24] text-white transition-all duration-150"
            >
              All Cakes
            </Link>
            {MAIN_CATEGORIES.map((cat, idx) => (
              <Link
                key={cat}
                href={`/cakes?category=${encodeURIComponent(cat)}`}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-150 ${CAT_STYLES[idx % CAT_STYLES.length]}`}
              >
                <span aria-hidden="true">{CAT_EMOJI[cat] || "🍰"}</span>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED CAKES GRID — matches reference layout exactly
          ══════════════════════════════════════════════════════ */}
      {featuredCakes.length > 0 && (
        <section className="pb-14" aria-label="Featured cakes">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="font-script text-[#C88A58] text-xl leading-none mb-1" aria-hidden="true">
                  Freshly Baked
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2B24] leading-tight">
                  Our Celebration Cakes
                </h2>
              </div>
              <Link
                href="/cakes"
                id="home-view-all"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg border border-[#E8E0D8] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white hover:border-[#3D2B24] transition-all duration-150"
              >
                View All
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* 2-col on mobile, 4-col on desktop — matches /cakes */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 animate-children">
              {featuredCakes.map((cake) => {
                const primaryImg = cake.images.find((i) => i.isPrimary) || cake.images[0];
                return (
                  <CakeCard
                    key={cake.id}
                    id={cake.id}
                    name={cake.name}
                    slug={cake.slug}
                    catalogueCode={cake.catalogueCode}
                    mainCategory={cake.mainCategory}
                    isSeasonal={cake.isSeasonal}
                    basePrice={cake.basePrice.toString()}
                    shortDescription={cake.shortDescription}
                    imageUrl={primaryImg?.url}
                    altText={primaryImg?.altText || cake.name}
                  />
                );
              })}
            </div>

            {/* Mobile View All */}
            <div className="sm:hidden text-center mt-8">
              <Link
                href="/cakes"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold rounded-lg border border-[#3D2B24] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white transition-all"
              >
                View All Cakes
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          DARK PROMO BANNER — "Compose Your Dream Centerpiece"
          (matches the dark CTA section in the reference)
          ══════════════════════════════════════════════════════ */}
      <section
        className="mx-4 sm:mx-6 lg:mx-8 xl:mx-auto max-w-7xl rounded-2xl overflow-hidden mb-14"
        aria-label="Custom cake studio"
      >
        <div className="bg-[#3D2B24] relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#C88A58]/10 -translate-y-1/3 translate-x-1/4 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#A3B19B]/10 translate-y-1/3 -translate-x-1/4 pointer-events-none" aria-hidden="true" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-12">
            {/* Left copy */}
            <div className="space-y-5">
              <p className="font-script text-[#C88A58] text-xl leading-none" aria-hidden="true">
                Made just for you
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] font-bold text-white leading-tight">
                Compose Your Dream Centrepiece in the Cake Studio
              </h2>
              <p className="text-[14px] text-stone-400 leading-relaxed max-w-md">
                Handpick every element — size, flavour, frosting colour, and a personal message. Our bakers craft it fresh with premium ingredients.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-3 pt-1">
                {[
                  { label: "3D Floral Stacking" },
                  { label: "Custom Piping" },
                  { label: "Handcrafted Figures" },
                ].map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-[12px] font-medium text-stone-300 border border-white/10"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C88A58] block shrink-0" aria-hidden="true" />
                    {f.label}
                  </span>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/cakes"
                  id="promo-open-studio"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold rounded-lg bg-[#C88A58] text-white hover:bg-[#B07240] transition-colors duration-150 shadow-[0_4px_20px_0_rgb(200_138_88_/_0.35)]"
                >
                  <Cake className="w-4 h-4" aria-hidden="true" />
                  Open Custom Cake Studio
                </Link>
              </div>
            </div>

            {/* Right image */}
            <div className="relative hidden lg:block">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=700&auto=format&fit=crop&q=85"
                  alt="Custom wedding cake created at Wasana Bakers"
                  fill
                  sizes="(max-width: 1280px) 45vw, 400px"
                  className="object-cover"
                />
              </div>
              {/* Small overlay card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-[0_4px_20px_0_rgb(61_43_36_/_0.15)] border border-[#E8E0D8] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EBF0E9] flex items-center justify-center shrink-0">
                  <span className="text-lg" aria-hidden="true">🎨</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#3D2B24]">Fully Customisable</p>
                  <p className="text-[10px] text-[#8A7568]">Colours, flavours & more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COLLECTIONS ROW
          ══════════════════════════════════════════════════════ */}
      <section className="pb-14 border-t border-[#E8E0D8] pt-10" aria-label="Collections">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A7568] mb-4 text-center">
            Browse by Collection
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {KNOWN_COLLECTIONS.map((col) => (
              <Link
                key={col.code}
                href={`/cakes?collection=${encodeURIComponent(col.code)}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#E8E0D8] bg-white hover:border-[#3D2B24] hover:bg-[#3D2B24] hover:text-white text-[12px] font-medium text-[#3D2B24] transition-all duration-150"
              >
                <span className="font-mono font-bold text-[#C88A58] text-[11px] group-hover:text-white">
                  {col.code}
                </span>
                <span className="hidden sm:inline">{col.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS — "Loved by Patrons & Critics Alike"
          Only shown when enabled in placeholders.ts
          ══════════════════════════════════════════════════════ */}
      {TESTIMONIALS_SECTION.enabled && TESTIMONIALS_SECTION.items.length > 0 && (
        <section className="py-14 bg-white border-y border-[#E8E0D8]" aria-label="Customer testimonials">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A7568] mb-2">
                Acclaimed · Crafted for fans
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#3D2B24]">
                Loved by Patrons &amp; Critics Alike
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TESTIMONIALS_SECTION.items.map((t: { name: string; location: string; rating: number; body: string }, i: number) => (
                <div key={i} className="bg-[#FAF7F2] border border-[#E8E0D8] rounded-xl p-5 space-y-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-[#C88A58] text-[#C88A58]" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-[13px] text-[#3D2B24] leading-relaxed">
                    &ldquo;{t.body}&rdquo;
                  </p>
                  <div>
                    <p className="text-[12px] font-bold text-[#3D2B24]">{t.name}</p>
                    <p className="text-[11px] text-[#8A7568]">{t.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          ATELIERS & BOUTIQUES MAP SECTION
          ══════════════════════════════════════════════════════ */}
      <AteliersMapSection />

    </div>
  );
}
