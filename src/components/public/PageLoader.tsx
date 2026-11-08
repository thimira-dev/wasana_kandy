"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressRef.current!);
          return 90;
        }
        const increment = prev < 40 ? 8 : prev < 70 ? 4 : 1.5;
        return Math.min(prev + increment, 90);
      });
    }, 120);

    let fadeTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    const handleLoad = () => {
      setProgress(100);
      fadeTimer = setTimeout(() => {
        setFadeOut(true);
        hideTimer = setTimeout(() => setVisible(false), 600);
      }, 300);
    };

    // Hydration means the page is usable. Images, maps and other external
    // resources must not keep the entire site covered until window.load.
    handleLoad();

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Loading Wasana Bakers"
      role="status"
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        transition: "opacity 0.6s ease, visibility 0.6s ease",
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? "hidden" : "visible",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* ── Layer 1: Red-to-orange gradient — full screen base ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(175deg, #cc0000 0%, #d92200 20%, #e84000 50%, #f07020 80%, #f07828 100%)",
        }}
      />

      {/* ── Layer 2: SVG — large circular arc + sky-blue fill (bottom-right) ── */}
      {/*
          The arc mimics the reference poster:
            • Starts at (102, 36) — right edge ~36% down
            • Sweeps as a large-radius circle arc
            • Ends at (18, 102) — bottom edge ~18% from left
            • Sky-blue fills everything below/right of the arc
      */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Sky-blue section */}
        <path
          d="M 103,36 A 86,86 0 0 0 18,103 L 103,103 Z"
          fill="#5ab4e5"
        />
        {/* White arc border */}
        <path
          d="M 103,36 A 86,86 0 0 0 18,103"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      </svg>

      {/* ── Layer 3: cake-girl — mobile only, fills the full bottom blue zone ── */}
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none select-none md:hidden"
        style={{
          animation: "fadeInUp 0.7s ease 0.35s both",
          /* Height: covers the blue arc area (≈ bottom 55% of screen) */
          height: "58%",
        }}
      >
        <Image
          src="/branding/cake-girl.png"
          alt="Wasana Bakers cake girl"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
          style={{ display: "block" }}
        />
      </div>

      {/* ── Content: text stack anchored to top of screen (in the red zone) ── */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        style={{ paddingTop: "clamp(2rem, 7vh, 5rem)" }}
      >
        <div className="flex flex-col items-center w-full px-6 max-w-sm gap-0 sm:gap-1">

          {/* ── හොරණ — small white label ── */}
          <p
            className="text-white font-bold text-center select-none"
            style={{
              fontSize: "clamp(2.4rem, 10vw, 4rem)",
              letterSpacing: "0.06em",
              textShadow: "0 2px 8px rgba(0,0,0,0.55)",
              animation: "fadeInDown 0.6s ease both",
              lineHeight: 1.25,
            }}
          >
            හොරණ
          </p>

          {/* ── වාසනා — huge yellow with heavy black outline ── */}
          <h1
            className="text-center font-extrabold select-none"
            style={{
              fontSize: "clamp(4.5rem, 23vw, 9.5rem)",
              color: "#ffe500",
              textShadow:
                "-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000," +
                "-5px  0   0 #000, 5px  0   0 #000,  0  -5px 0 #000, 0   5px 0 #000," +
                "-3px -3px 0 #111, 3px -3px 0 #111, -3px 3px 0 #111, 3px 3px 0 #111," +
                "6px 6px 0 rgba(0,0,0,0.6), 8px 8px 16px rgba(0,0,0,0.38)",
              animation: "fadeInUp 0.65s ease 0.1s both",
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
            }}
          >
            වාසනා
          </h1>

          {/* ── බේකරස් — blue with white outline ── */}
          <h2
            className="text-center font-extrabold select-none"
            style={{
              fontSize: "clamp(2.2rem, 12vw, 5rem)",
              color: "#1a3ecf",
              textShadow:
                "-3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 3px 3px 0 #fff," +
                "-4px  0   0 #fff, 4px  0   0 #fff,  0  -4px 0 #fff, 0   4px 0 #fff," +
                "4px 5px 12px rgba(0,0,0,0.5)",
              animation: "fadeInUp 0.65s ease 0.22s both",
              letterSpacing: "0.01em",
              lineHeight: 1,
            }}
          >
            බේකරස්
          </h2>

          {/* ── Progress bar ── */}
          <div
            className="w-full mt-5 sm:mt-8 max-w-[220px] sm:max-w-[280px]"
            style={{ animation: "fadeIn 0.6s ease 0.4s both" }}
          >
            {/* Track */}
            <div className="relative h-[7px] sm:h-[9px] w-full rounded-full overflow-hidden bg-white/25">
              {/* Glowing yellow fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${progress}%`,
                  transition: "width 0.3s ease",
                  background: "linear-gradient(90deg, #ffeb3b, #ffc107)",
                  boxShadow:
                    "0 0 10px 2px rgba(255,235,59,0.75), 0 0 22px 4px rgba(255,193,7,0.45)",
                }}
              />
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite linear",
                }}
              />
            </div>
            <p className="text-center text-white/65 text-[10px] sm:text-xs mt-1.5 tabular-nums">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
