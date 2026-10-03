/**
 * placeholders.ts
 * Optional / feature-flagged content sections.
 * Toggle `enabled` to show/hide each section without touching business logic.
 */

// ── HERO ──────────────────────────────────────────────────────────────
export const HERO_CONTENT = {
  headline: "Beautiful Celebration Cakes, Handcrafted in Kandy",
  subtext:
    "Every cake is freshly baked and petal-piped upon order. Choose from our collection, personalise flavours, colours and messages — then pick up from our Kandy branches.",
  primaryCta: {
    label: "Order Cake Now",
    href:  "/cakes",
  },
  secondaryCta: {
    label: "Customize Your Cake",
    href:  "/cakes",
  },
};

// ── TRUST STRIP ────────────────────────────────────────────────────────
export const TRUST_STRIP = {
  enabled: true,
  items: [
    {
      icon:    "cake",
      heading: "Freshly Baked Daily",
      body:    "Every cake made to order with no preservatives.",
    },
    {
      icon:    "palette",
      heading: "Custom Designs & Flavours",
      body:    "Personalise colours, tiers, toppers and messages.",
    },
    {
      icon:    "map-pin",
      heading: "Pickup from 3 Branches",
      body:    "Main Street, Katugastota and Peradeniya.",
    },
    {
      icon:    "calendar",
      heading: "4-Day Advance Preparation",
      body:    "Book early so we craft it perfectly for your day.",
    },
  ],
};

// ── TESTIMONIALS ────────────────────────────────────────────────────────
export const TESTIMONIALS_SECTION = {
  enabled: true,
  items: [
    {
      name:     "Priyani W.",
      location: "Kandy, Sri Lanka",
      rating:   5,
      body:     "Wasana Bakers turns moments into architectural wonders. The Pistachio Raspberry Chantilly is pure art.",
    },
    {
      name:     "Dhanushka Gunaratne C.",
      location: "Recommended via friend referral",
      rating:   5,
      body:     "The restraint in sugar allows authentic flavour — fresh berries and brilliant garnishes truly shine.",
    },
    {
      name:     "Diana & Peter T.",
      location: "From a wedding booking",
      rating:   5,
      body:     "Our wedding cake was not just gorgeous but tasted like the Earl Grey lavender sponge we had always dreamed of.",
    },
  ],
};

// ── HELP BUTTON ────────────────────────────────────────────────────────
export const HELP_BUTTON = {
  enabled:      true,
  phone:        "+94812234567",
  displayPhone: "+94 81 223 4567",
  tooltip:      "Call Wasana Bakers Kandy",
};
