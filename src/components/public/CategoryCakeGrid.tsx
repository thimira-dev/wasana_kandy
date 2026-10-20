"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CakeCard, CakeCardProps } from "@/components/public/CakeCard";
import { ChevronDown } from "lucide-react";

const INITIAL_VISIBLE = 20;

interface CategoryCakeGridProps {
  categoryName: string;
  cakes: CakeCardProps[];
}

export function CategoryCakeGrid({ categoryName, cakes }: CategoryCakeGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const totalCakes = cakes.length;
  const visibleCakes = cakes.slice(0, visibleCount);
  const hasMore = visibleCount < totalCakes;

  const sectionRef = useRef<HTMLElement>(null);

  // Parallax scroll tracking for this specific category section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax transforms: background watermark moves slower/opposite to create rich depth
  const backgroundY = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const ambientGlowY = useTransform(scrollYProgress, [0, 1], [-70, 70]);
  const headerY = useTransform(scrollYProgress, [0, 1], [15, -15]);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + INITIAL_VISIBLE, totalCakes));
  };

  return (
    <section
      ref={sectionRef}
      className="relative mb-12 sm:mb-16 pb-2 overflow-hidden"
      id={`category-${categoryName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* ── Parallax Floating Watermark Behind Category ── */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute top-2 right-0 select-none pointer-events-none font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-[#855300]/[0.035] whitespace-nowrap z-0 uppercase tracking-widest"
        aria-hidden="true"
      >
        {categoryName}
      </motion.div>

      {/* ── Parallax Ambient Warm Glow ── */}
      <motion.div
        style={{ y: ambientGlowY }}
        className="absolute -right-20 top-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-[#F59E0B]/10 to-amber-200/0 blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* ── Category Header with Subtle Parallax Offset ── */}
      <motion.div
        style={{ y: headerY }}
        className="flex items-center gap-3 mb-5 sm:mb-6 relative z-10"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#F59E0B] to-[#D97706]" />
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-[#1B1C1A] tracking-tight">
            {categoryName}
          </h2>
        </div>
        <span className="px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase rounded-full bg-[#F59E0B]/15 text-[#855300] border border-[#F59E0B]/25">
          {totalCakes} {totalCakes === 1 ? "cake" : "cakes"}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[#F59E0B]/35 via-[#F59E0B]/15 to-transparent" />
      </motion.div>

      {/* ── Cake Cards Grid with Staggered Viewport Reveal ── */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
        {visibleCakes.map((cake, idx) => (
          <motion.div
            key={cake.id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{
              duration: 0.45,
              delay: (idx % 4) * 0.06,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
          >
            <CakeCard {...cake} />
          </motion.div>
        ))}
      </div>

      {/* ── Show More Button ── */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 flex justify-center mt-6 sm:mt-8"
        >
          <button
            type="button"
            onClick={handleShowMore}
            className="group inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[12px] sm:text-[13px] font-bold tracking-wide
              bg-white/85 backdrop-blur-md border border-[#F59E0B]/30 text-[#855300]
              shadow-sm hover:shadow-md hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/50
              transition-all duration-200 ease-out"
          >
            Show More
            <span className="text-[10px] font-semibold text-[#867461]">
              ({visibleCount} / {totalCakes})
            </span>
            <ChevronDown className="w-4 h-4 text-[#F59E0B] group-hover:translate-y-0.5 transition-transform" />
          </button>
        </motion.div>
      )}
    </section>
  );
}

