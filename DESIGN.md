# Wasana Bakers Kandy — Design System & Architecture (DESIGN.md)

> **Artisanal Confectionery · Handcrafted in Kandy, Sri Lanka**  
> *Visual Style: iOS Glassmorphism + Modern Bakery Luxury*

---

## 1. Brand Philosophy & Aesthetic Direction

Wasana Bakers blends the warmth of traditional Sri Lankan artisanal baking with modern European confectionery aesthetics. The design system creates a sensory digital experience—evoking fresh flour, roasted cocoa, spun sugar, and warm sunlight filtering through an atelier glass vitrine.

### Core Principles
1. **Appetizing Tactility**: Every card, sheet, and button feels physical, clean, and softly tactile like a patisserie display counter.
2. **Glass & Light (Vitrine Effect)**: Frosted glass substrates (`backdrop-filter: blur()`) let warm bakery tones subtly glow through, mimicking luxury pastry vitrines.
3. **Heritage & Highland Grace**: Subtle design nods to Kandy’s lake, surrounding hill contours, and golden heritage accents without clutter.
4. **Frictionless Deliberation**: High readability, clean pricing hierarchies in Sri Lankan Rupees (LKR), and clear 4-day advance notice indicators.

---

## 2. Color Palette & Token System

The color palette is built around warm amber warmth, crisp confectionary sugar whites, deep roasted charcoal, and vibrant ruby confection accents.

### Primary Color Tokens

| Token Name | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-primary` | `#EFA554` | **Comfort Warm Amber Gold**: Main brand accent, primary CTA buttons, highlight badges, active states |
| `--color-primary-hover` | `#F5B874` | Hover state for primary buttons and interactive elements |
| `--color-secondary` | `#E11D48` | **Confection Ruby Red**: Special badges ("Bespoke", "Seasonal"), urgent notices, delicate accent chips |
| `--color-tertiary` | `#78350F` | **Roasted Cocoa Brown**: Rich contrast text, tertiary highlights, artisanal details |
| `--color-surface` | `#FAF9F5` | **Off-White Canvas**: Warm pastry flour tinted background; avoids clinical sterile white |
| `--color-on-surface` | `#1B1C1A` | **Deep Charcoal**: Primary reading text, headers, and icon color for high contrast |
| `--color-on-surface-variant`| `#534434` | **Warm Umber Muted**: Secondary body copy, subtitle notes, ingredient captions |
| `--color-outline` | `#867461` | Soft separators and subtle border trims |
| `--color-outline-variant` | `#D8C3AD` | Scrollbars, divider lines, and card strokes |

### Surface Elevation Levels

```
Level 0:  Canvas Background           #FAF9F5
Level 1:  Glass Card Substrate        rgba(255, 255, 255, 0.76) + blur(24px)
Level 2:  Floating Sheets & Modals    rgba(255, 255, 255, 0.88) + blur(32px)
Level 3:  Sticky Navigation Sheen     linear-gradient(135deg, rgba(255,253,247,0.94) 0%, rgba(254,243,199,0.65) 50%, rgba(255,253,247,0.94) 100%)
Level 4:  Deep Footer Baseline        #111111 (Nighttime Kandy Silhouette)
```

---

## 3. Typography Hierarchy

The typography combines the modern geometric precision of **Plus Jakarta Sans** for high-clarity digital shopping with editorial accents from **Playfair Display** and **Dancing Script** for brand heritage.

### Font Families
- **Primary Interface & Numerics**: `Plus Jakarta Sans`, system-ui, sans-serif
- **Editorial Display & Heritage**: `Playfair Display`, serif
- **Handwritten Signature Accents**: `Dancing Script`, cursive

### Type Scale

| Style Utility | Font Size / Line Height | Weight | Letter Spacing | Context / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `.text-display-hero` | `56px / 64px` (Desktop)<br>`36px / 44px` (Mobile) | 600 (SemiBold) | `-0.02em` | Homepage Billboard & Main Catalogue Banner |
| `.text-headline-xl` | `40px / 48px` (Desktop)<br>`28px / 36px` (Mobile) | 600 (SemiBold) | `-0.015em` | Page Headings, Category Headers |
| `.text-headline-lg` | `28px / 36px` | 600 (SemiBold) | `-0.01em` | Section Titles, Modal Headers |
| `.text-headline-sm` | `20px / 28px` | 600 (SemiBold) | `0em` | Cake Card Titles, Drawer Subheadings |
| `.text-price-lg` | `20px / 28px` | 800 (ExtraBold) | `-0.02em` | Product Detail & Checkout Final Price |
| `.text-price-md` | `16px / 24px` | 700 (Bold) | `-0.01em` | Cake Card Vitrine Listing Price |
| `.text-label-caps` | `11px / 16px` | 700 (Bold) | `0.08em` | Category Tag Chips, Micro Badges, SKU tags |
| Body Text | `15px / 1.6` | 400 (Regular) | `0em` | Paragraphs, descriptions, allergen notes |

> **Mobile Input Guard**: On mobile viewports (`max-width: 767px`), all `input`, `select`, and `textarea` elements enforce `font-size: 16px !important` to eliminate automatic iOS Safari viewport zoom shifts.

---

## 4. Spacing, Radii & Depth

### Border Radii
- **`--radius-sm` (4px)**: Checkbox indicators, micro tags.
- **`--radius-default` (8px)**: Standard input fields, quantity incrementers.
- **`--radius-md` (12px)**: Filter chips, dropdown menus.
- **`--radius-lg` (16px)**: E-commerce Cake Cards, alert banners, image containers.
- **`--radius-xl` (24px)**: Drawers, Cart Sheet, Modal dialogs, Hero cards.
- **`--radius-full` (9999px)**: Action buttons (`.btn-primary-gold`), status pills, category pills.

### Glassmorphism & Shadow System
- **Subtle Glass Substrate (`--shadow-glass`)**:
  `0 8px 32px -4px rgba(27, 28, 26, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)`
- **Hover Elevation (`--shadow-glass-hover`)**:
  `0 16px 40px -6px rgba(239, 165, 84, 0.12), 0 4px 16px -2px rgba(27, 28, 26, 0.06)`
- **Floating Modals & Sheets (`--shadow-glass-float`)**:
  `0 20px 48px -8px rgba(27, 28, 26, 0.14), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)`
- **Gold Call-To-Action Glow (`--shadow-gold-cta`)**:
  `0 4px 20px 0 rgba(239, 165, 84, 0.35)`

---

## 5. UI Components & Patterns

### 1. Navigation Architecture
- **Tier 1 — Announcement Bar**:
  - Background: Gradient `#111111` to `#2D1F0D`.
  - Content: 4-Day advance notice highlight, branch pickup alert, operating hours.
- **Tier 2 — Glass Header (`.glass-nav`)**:
  - Sticky at top with `backdrop-filter: blur(24px)`.
  - Brand Logo (Wasana Bakers Kandy), Live Search Trigger, Category Dropdown, Atelier Branch Selector, and Cart Drawer Trigger with item counter badge.
- **Mobile Bottom Navigation Bar**:
  - Fixed dock at the bottom of small viewports for ergonomic one-thumb interaction (Catalogue, Search, Branches, Cart).

### 2. Cake Vitrine Card (`CakeCard.tsx`)
- High-resolution cake portrait in an aspect ratio container.
- **Floating Badge System**:
  - `.badge-ruby` for *Seasonal*, *Bespoke*, *Best Seller*.
  - Neutral glass pill for *Fresh Daily*, *Miniature*, *Popular*.
- Wishlist Heart toggle with smooth scale bounce.
- Typography: Clear cake title with auto-parsed catalogue code (`#WBC-...`).
- Pricing displayed via `formatLKR(price)` (e.g. `Rs. 4,500.00`).
- Dual action: Direct Customize modal trigger or Instant Add to Order.

### 3. Cake Customizer Modal (`CakeCustomizer.tsx`)
- Slide-over / modal glass substrate (`.glass-floating`).
- Visual selection steps:
  1. **Weight / Servings Tier**: 1.0 kg (6–8 pax), 1.5 kg (10–12 pax), 2.0 kg (16–20 pax).
  2. **Sponge Base**: Ribbon Sponge, Rich Chocolate Fudge, Red Velvet, Vanilla Butter.
  3. **Frosting / Piping Palette**: Swiss Meringue, Fresh Whipped Cream, Espresso Ganache.
  4. **Piped Inscription**: Live character counter for personalized message on cake board.
  5. **Pickup Atelier Selection**: Kandy City Centre, Katugastota, or Peradeniya.
- Real-time price recalculation with immediate visual feedback.

### 4. Interactive Cart Drawer (`CartDrawer.tsx`)
- Smooth right-side slide-in backdrop.
- Clear item breakdown (selected weight, flavors, inscribed message, branch).
- 4-Day advance booking advisory alert box.
- Subtotal, packaging fees (if applicable), and one-click transition to checkout.

### 5. Multi-Step Checkout Flow
- **Step 1: Contact & Collection Info** (Customer Name, Phone, Atelier Pickup Date/Time Slot).
- **Step 2: Order Review & Notes** (Dietary notes, candle counts, gift cards).
- **Step 3: Confirmation & Receipt** (Reference code generated, WhatsApp direct confirmation option).

### 6. Atelier Locations & Heritage Map (`AteliersMapSection.tsx`)
- Dedicated cards for the 3 Kandy branches:
  1. **Kandy City Centre**: 124 Dalada Veediya, Kandy
  2. **Katugastota Main**: 45 Kurunegala Road, Katugastota
  3. **Peradeniya Branch**: 310 Peradeniya Road, Kandy
- Direct telephone dialing buttons (`tel:+94812234567`) and Google Maps directions links.

### 7. Footer Architecture (`Footer.tsx`)
- Deep Charcoal backdrop (`#111111`) contrasting the warm daytime canvas.
- Integrated single-pixel SVG contour of Kandy Lake and surrounding hillside ridges.
- Atelier operating times (7:00 AM – 8:00 PM Daily).
- Social links, payment security seals, and copyright disclaimer.

---

## 6. Micro-Animations & Motion Design

All animations use an Apple-inspired cubic bezier easing curve: `cubic-bezier(0.16, 1, 0.3, 1)`.

- **`.animate-fade-in`**: Smooth 350ms opacity transition with subtle 6px Y-axis rise.
- **`.animate-slide-up`**: 450ms drawer and sheet entrance animation.
- **`.animate-scale-in`**: 250ms modal pop-in with 0.97 initial scale.
- **Staggered Children (`.animate-children`)**: Automatic sequential 60ms delay per vitrine item to create cascade loading.
- **Hover Micro-transforms**: `translateY(-2px)` on cards, `scale(1.02)` on primary CTA buttons.

---

## 7. Accessibility & Engineering Guidelines

1. **Touch Targets**: All interactive buttons and touch points have a minimum target size of 44x44px.
2. **Contrast Standards**: All body text on light backgrounds maintains a contrast ratio greater than 4.5:1 (WCAG AA).
3. **Keyboard Focus**: Focus visible states use a prominent Amber Gold ring:
   ```css
   :focus-visible {
     outline: 2px solid #F59E0B;
     outline-offset: 2px;
     border-radius: 6px;
   }
   ```
4. **Form Labels**: Every input field includes associated accessible label elements and unambiguous placeholder guidance.
5. **Currency Standardization**: All prices are formatted consistently across every view through the centralized `formatLKR(amount)` helper.
