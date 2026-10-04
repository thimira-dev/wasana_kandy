"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  subtitle: string;
  quote: string;
  cakeOrdered?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Antoniella Paradiso",
    subtitle: "Stefano's Trattoria Italian Cuisine • Kandy Special Order",
    quote:
      "We are really loving the bread and gateaux, and it's almost like the guests had a tip that we got fresh handcrafted recipes because the celebration cakes have been selling like crazy. Really like the quality a lot better and the freshness is key. Thanks a lot.",
    cakeOrdered: "Royal Ribbon Gateau",
  },
  {
    id: "2",
    name: "Priyani Weerasinghe",
    subtitle: "Katugastota, Kandy • Mother's 60th Birthday Celebration",
    quote:
      "Ordered this cake for my mother's milestone birthday. The butter sponge was amazingly moist and the delicate piping work was absolute perfection! Picked up right on time from the Katugastota atelier branch.",
    cakeOrdered: "Royal Buttercream Gateau",
  },
  {
    id: "3",
    name: "Dhanushka & Chamari",
    subtitle: "Peradeniya • Grand Wedding Reception at Earl's Regency",
    quote:
      "Wasana Bakers made our wedding reception unforgettable. The rich Belgian chocolate layers with fresh strawberry compote received endless compliments from all 250 guests. Truly Kandy's finest pastry artists!",
    cakeOrdered: "Bespoke 3-Tier Chocolate Fudge Wedding Cake",
  },
  {
    id: "4",
    name: "Nimisha Senanayake",
    subtitle: "Kandy City Centre • Family Milestone Celebration",
    quote:
      "Subtle sweetness and incredible aromatic tea notes in the Earl Grey sponge. The restraint in sugar allows authentic tropical fruit flavours to shine. My go-to bakery for every family event.",
    cakeOrdered: "Passionfruit Earl Grey Chiffon",
  },
  {
    id: "5",
    name: "Dr. Asanka & Family",
    subtitle: "Digana, Kandy • Anniversary & Family Reunion",
    quote:
      "Generous dark chocolate shavings, real cherry reduction, and light whipped cream. Ordered online using catalogue code BF-03 with smooth pickup from the Main Street branch. 10/10 service!",
    cakeOrdered: "Classic Kiribathgoda Black Forest",
  },
];

export function CustomerFeedbackSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto advance carousel every 6 seconds unless paused on hover
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentItem = TESTIMONIALS[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <section
      className="py-16 sm:py-20 bg-[#FAF9F5] border-t border-[#E9E8E4] relative overflow-hidden"
      aria-label="What People Say About Us"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#C47638]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* ── 1. SECTION TITLE ── */}
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#C47638] tracking-tight mb-6">
          What People Say About Us
        </h2>

        {/* ── 2. LARGE ORANGE DOUBLE QUOTE ICON ── */}
        <div className="flex justify-center mb-6" aria-hidden="true">
          <svg
            className="w-12 h-12 text-[#C47638] fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* ── 3. TESTIMONIAL QUOTE SLIDER ── */}
        <div className="min-h-[180px] sm:min-h-[160px] flex items-center justify-center relative mb-8 px-2 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Main Quote Paragraph */}
              <p className="text-[15px] sm:text-[17px] lg:text-[18px] text-[#4A3B32] font-normal leading-relaxed max-w-2xl mx-auto italic">
                &ldquo;{currentItem.quote}&rdquo;
              </p>

              {/* Author Name & Subtitle */}
              <div className="space-y-1 pt-2">
                <h3 className="font-bold text-[#C47638] text-[16px] sm:text-[17px] tracking-wide">
                  {currentItem.name}
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-[#786355] font-medium">
                  {currentItem.subtitle}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── 4. CAROUSEL DOTS & ARROW NAVIGATION ── */}
        <div className="flex items-center justify-center gap-6">
          {/* Previous Arrow Button */}
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#C47638] hover:bg-[#C47638]/10 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator Row */}
          <div className="flex items-center gap-2.5">
            {TESTIMONIALS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? "w-3 h-3 bg-[#C47638] scale-110 shadow-sm"
                    : "w-2.5 h-2.5 bg-[#D5C9BE] hover:bg-[#A89889]"
                }`}
              />
            ))}
          </div>

          {/* Next Arrow Button */}
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#C47638] hover:bg-[#C47638]/10 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
}
