"use client";

import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  Store,
  Compass,
  Snowflake,
  ExternalLink,
  Truck,
} from "lucide-react";

export interface BranchInfo {
  code: string;
  id: string;
  badge: string;
  title: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  phoneRaw: string;
  mapsQuery: string;
  tags: { text: string; green?: boolean }[];
  rating: number;
  openUntil: string;
  shortName: string;
  embedUrl: string;
}

const BRANCHES: Record<string, BranchInfo> = {
  "KANDY-CITY": {
    code: "KANDY-CITY",
    id: "KANDY-CITY",
    badge: "KANDY CITY CENTRE",
    title: "Flagship Atelier & Tasting Room",
    name: "Wasana Bakers - Kandy City Centre",
    address: "124 Dalada Veediya, Kandy",
    hours: "8:00 AM - 8:30 PM",
    phone: "+94 81 223 4567",
    phoneRaw: "+94812234567",
    mapsQuery: "Wasana Bakers 124 Dalada Veediya Kandy Sri Lanka",
    embedUrl: "https://maps.google.com/maps?q=124+Dalada+Veediya,+Kandy,+Sri+Lanka&t=&z=16&ie=UTF8&iwloc=&output=embed",
    tags: [
      { text: "FRESH DAILY BAKES" },
      { text: "CAKE TASTING" },
      { text: "CURBSIDE PICKUP", green: true },
    ],
    rating: 4.9,
    openUntil: "8:30 PM",
    shortName: "City Centre",
  },
  "KATUGASTOTA": {
    code: "KATUGASTOTA",
    id: "KATUGASTOTA",
    badge: "KATUGASTOTA MAIN",
    title: "Main Bakery & Production Studio",
    name: "Wasana Bakers - Katugastota Main",
    address: "45 Kurunegala Road, Katugastota",
    hours: "7:30 AM - 8:00 PM",
    phone: "+94 81 249 8899",
    phoneRaw: "+94812498899",
    mapsQuery: "Wasana Bakers 45 Kurunegala Road Katugastota Kandy Sri Lanka",
    embedUrl: "https://maps.google.com/maps?q=45+Kurunegala+Road,+Katugastota,+Kandy,+Sri+Lanka&t=&z=16&ie=UTF8&iwloc=&output=embed",
    tags: [
      { text: "PRODUCTION STUDIO" },
      { text: "IN-STORE PICKUP", green: true },
    ],
    rating: 4.8,
    openUntil: "8:00 PM",
    shortName: "Katugastota Main",
  },
  "PERADENIYA": {
    code: "PERADENIYA",
    id: "PERADENIYA",
    badge: "PERADENIYA ROAD",
    title: "Pastry & Pre-Order Atelier",
    name: "Wasana Bakers - Peradeniya Road",
    address: "310 Peradeniya Road, Kandy",
    hours: "8:00 AM - 7:30 PM",
    phone: "+94 81 238 7766",
    phoneRaw: "+94812387766",
    mapsQuery: "Wasana Bakers 310 Peradeniya Road Kandy Sri Lanka",
    embedUrl: "https://maps.google.com/maps?q=310+Peradeniya+Road,+Kandy,+Sri+Lanka&t=&z=16&ie=UTF8&iwloc=&output=embed",
    tags: [
      { text: "ARTISAN WORKSHOP" },
      { text: "EXPRESS PICKUP", green: true },
    ],
    rating: 4.9,
    openUntil: "7:30 PM",
    shortName: "Peradeniya Road",
  },
};

export function AteliersMapSection() {
  const [activeBranchCode, setActiveBranchCode] = useState<string>("KANDY-CITY");

  const activeBranch = BRANCHES[activeBranchCode] || BRANCHES["KANDY-CITY"];

  return (
    <section className="py-6 sm:py-10 bg-[#FAF7F2] border-t border-[#E8E0D8]" aria-label="Our Ateliers and Boutiques">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HEADER ROW ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#C88A58] mb-1">
              Visit Our Ateliers &amp; Boutiques
            </p>
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-[#3D2B24] tracking-tight">
              Find Wasana Bakers Near You
            </h2>
          </div>
          {/* Temperature notice pill */}
          <div className="bg-[#FAF0E6] border border-[#ECDCCB] rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] sm:text-[12px] text-[#8C5D38]">
            <Snowflake className="w-3.5 h-3.5 text-[#C88A58] shrink-0" />
            <span className="leading-snug">Pre-ordered custom cakes include temperature-guaranteed packaging across all 3 branches.</span>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">

          {/* ── LEFT COLUMN: COMPACT BRANCH CARDS ── */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
            {Object.values(BRANCHES).map((branch) => {
              const isActive = activeBranchCode === branch.code;
              return (
                <div
                  key={branch.code}
                  onClick={() => setActiveBranchCode(branch.code)}
                  className={`group relative rounded-xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? "bg-white border-[#C88A58] shadow-md ring-1 ring-[#C88A58]"
                      : "bg-white/80 border-[#E8E0D8] hover:border-[#C88A58]/50 hover:bg-white"
                  }`}
                >
                  {/* Top line: Badge + Name */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#F7EBE0] text-[#C88A58]">
                      {branch.badge}
                    </span>
                    <Store className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#C88A58]" : "text-[#8A7568]/60"}`} />
                  </div>

                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#3D2B24] leading-snug">
                    {branch.name}
                  </h3>

                  {/* Address & Hours */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-[12px] text-[#665448] mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C88A58] shrink-0" />
                      {branch.address}
                    </span>
                    <span className="flex items-center gap-1 text-[#8A7568]">
                      <Clock className="w-3 h-3 shrink-0" />
                      {branch.hours}
                    </span>
                  </div>

                  {/* Buttons & Phone — Mobile responsive flex wrap */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-[#F0EAE4]">
                    <div className="flex flex-wrap gap-1">
                      {branch.tags.map((tag) => (
                        <span
                          key={tag.text}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            tag.green ? "bg-[#EBF0E9] text-[#486B50]" : "bg-[#F4F0EA] text-[#7A685D]"
                          }`}
                        >
                          {tag.text}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          branch.mapsQuery
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          isActive
                            ? "bg-[#3D2B24] text-white hover:bg-[#C88A58]"
                            : "bg-[#F4F0EA] text-[#3D2B24] hover:bg-[#3D2B24] hover:text-white"
                        }`}
                      >
                        <Compass className="w-3 h-3" />
                        Directions
                      </a>
                      <a
                        href={`tel:${branch.phoneRaw}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E8E0D8] text-[#3D2B24] hover:bg-[#E8E0D8] text-[11px] font-semibold transition-colors"
                      >
                        <Phone className="w-3 h-3 text-[#8A7568]" />
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT COLUMN: EMBEDDED GOOGLE MAP PREVIEW ── */}
          <div className="lg:col-span-7">
            <div className="relative w-full h-[300px] sm:h-full sm:min-h-[380px] rounded-2xl overflow-hidden border border-[#E5DDD4] bg-stone-100 shadow-sm flex flex-col justify-between">

              {/* Top floating branch switcher — Mobile horizontally scrollable */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:right-auto z-10 flex items-center gap-1 p-1 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-stone-200 overflow-x-auto scrollbar-hide">
                {Object.values(BRANCHES).map((branch) => (
                  <button
                    key={branch.code}
                    onClick={() => setActiveBranchCode(branch.code)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all duration-200 ${
                      activeBranchCode === branch.code
                        ? "bg-[#3D2B24] text-white shadow-sm"
                        : "text-[#3D2B24] hover:bg-stone-100"
                    }`}
                  >
                    {branch.shortName}
                  </button>
                ))}
              </div>

              {/* Embedded Google Map iframe */}
              <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px]">
                <iframe
                  key={activeBranch.code}
                  title={`Google Map preview for ${activeBranch.name}`}
                  src={activeBranch.embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[300px] sm:min-h-[380px]"
                />
              </div>

              {/* Bottom bar with delivery info & Open in Google Maps */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 pointer-events-none">
                <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-stone-200/80 shadow-md flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-[#665448]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-1 rounded-lg bg-[#F7EBE0] text-[#C88A58] shrink-0">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">Live map preview: {activeBranch.shortName}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      activeBranch.mapsQuery
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3D2B24] text-white hover:bg-[#C88A58] text-[10px] sm:text-[11px] font-bold transition-colors"
                  >
                    <span>Open Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
