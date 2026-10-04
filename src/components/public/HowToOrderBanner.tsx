"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cake, ShoppingBag, UtensilsCrossed, ArrowRight, Sparkles } from "lucide-react";

export function HowToOrderBanner() {
  return (
    <section className="relative w-full overflow-visible py-6 sm:py-10" aria-label="How to order custom cakes">
      {/* ── MAIN FULL-WIDTH BANNER CONTAINER ── */}
      <div className="relative w-full bg-[#C47638] text-white shadow-2xl overflow-visible border-y border-white/20">
        
        {/* Subtle background gradient & lighting */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#C47638] via-[#B86B2F] to-[#9E5522] pointer-events-none overflow-hidden" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 grid grid-cols-1 lg:grid-cols-12 items-center min-h-[360px]">
          
          {/* ── 1. LEFT: 3D CAKE IMAGE BRIGHTENED & BROUGHT FORWARD ── */}
          <div className="lg:col-span-4 relative flex items-center justify-center p-4 lg:p-0 z-30">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[480px] lg:h-[480px] lg:-ml-8 lg:-my-20 drop-shadow-[0_35px_50px_rgba(0,0,0,0.65)]"
            >
              {/* Pure Floating Levitation (No Zooming/Scaling) */}
              <motion.div
                animate={{
                  y: [0, -16, 0],
                  rotate: [0, 1.2, -1.2, 0],
                }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.4, 0.8, 1],
                }}
                className="w-full h-full relative"
              >
                <Image
                  src="/assets/3d cake.png"
                  alt="3D Handcrafted Wasana Celebration Cake"
                  fill
                  priority
                  sizes="(max-width: 768px) 350px, 550px"
                  className="object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* ── 2. CENTER: "HOW TO ENJOY?" CONTENT & 3-STEP PROCESS ── */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:py-10 space-y-6 text-center lg:text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-widest uppercase text-amber-100 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                Easy Ordering Process
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-tight tracking-tight">
                How to Enjoy?
              </h2>

              <p className="text-[14px] sm:text-[15px] text-amber-50/90 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                Sample a selection of our best selling celebration cakes and treats that will be freshly handcrafted for your Kandy celebrations. Select your flavor, icing style, custom message, and pickup branch.
              </p>
            </div>

            {/* 3 Step Icons Row (Matches Reference Exactly) */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-sm">
                  <Cake className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <span className="text-[12.5px] font-bold text-white leading-tight">Choose Product</span>
              </div>

              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-sm">
                  <ShoppingBag className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <span className="text-[12.5px] font-bold text-white leading-tight">Place Order</span>
              </div>

              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-sm">
                  <UtensilsCrossed className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <span className="text-[12.5px] font-bold text-white leading-tight">Eat &amp; Enjoy!</span>
              </div>
            </div>
          </div>

          {/* ── 3. RIGHT: FEATURED PACK & ORDER NOW (Matches Reference Card) ── */}
          <div className="lg:col-span-3 h-full bg-[#8E4417]/60 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/20 text-center lg:text-left">
            <div className="space-y-3">
              {/* Mini Basket/Pack Graphic Container */}
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto lg:mx-0 border border-white/25 shadow-sm">
                <span className="text-2xl" aria-hidden="true">🎂</span>
              </div>

              <p className="text-[12px] text-amber-100/90 leading-snug font-medium">
                Ribbon Cake, Chocolate Fudge, Edible Prints, Gateaux, Cupcakes
              </p>
            </div>

            <div className="pt-6 space-y-3">
              <div>
                <span className="text-[13px] font-bold text-[#F59E0B] block">$35.00 / LKR 4,800</span>
                <h3 className="font-serif text-2xl font-bold text-white leading-tight">
                  Signature Pack
                </h3>
              </div>

              <Link
                href="/cakes"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[13px] font-bold btn-primary-gold text-[#1B1C1A] shadow-xl hover:scale-102 transition-transform"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[10.5px] text-amber-100/70 leading-snug">
                Sample a selection of our best selling cakes and treats delivered fresh for your events.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
