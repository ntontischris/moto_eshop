# Home + Product Page Redesign — Race-Grade Cinematic

**Date:** 2026-05-13
**Scope:** Homepage (`/`) + Product page (`/[...path]/{slug}`)
**Goal:** Production-quality visual presentation που να εντυπωσιάζει τον πελάτη χωρίς να θυσιάζει conversion ή accessibility.

---

## 1. Direction

**Race-Grade Cinematic.** Σκούρο, athletic, premium e-commerce ύφος εμπνευσμένο από REVZILLA, Snipes, Nike SB. Διαφοροποιείται από τα generic Greek e-shops (Skroutz/Public look) με cinematic hero και τοποθετεί το προϊόν στο επίκεντρο.

Τα δύο pages αποτελούν "showcase" για presentation σε stakeholder, οπότε ποιοτικά polish στο hero + product page προτεραιότητα over completeness.

## 2. Design tokens (no changes)

Τα tokens είναι ήδη σωστά configured στο `src/app/globals.css`:

| Token | Value | Use |
|---|---|---|
| `--brand-red` (`--brand-teal` alias) | `#DC2626` | Primary accent, CTAs, hover glow |
| `--brand-red-hover` | `#B91C1C` | Hover states |
| `--brand-red-dark` | `#991B1B` | Pressed states |
| `--brand-red-glow` | `rgba(220,38,38,0.12)` | Soft glow halos |
| `--bg-deep` | (dark) | Hero, footer, dark sections |
| `--bg-surface` | (dark) | Cards on dark bg |
| `--bg-elevated` | (dark) | Hover-elevated cards |
| `--accent` | `#F5F0EB` | Warm bone tone for premium feel |
| `--gold` | (warm gold) | Trust/badges/premium hints |
| `--chrome` (gradient) | silver | Premium highlight strips |

**Typography:**
- `Russo One` — display (h1, hero, big numbers), uppercase preference
- `Chakra Petch` — body, UI text

**Additions:**
```css
--accent-glow-strong: 0 0 30px rgba(220, 38, 38, 0.4);
--card-hover-lift: translateY(-2px);
--smooth-ease: cubic-bezier(0.4, 0, 0.2, 1);
```

## 3. Homepage redesign

Page composition order:

```
<HeroSection />          ← REWRITE: scroll-driven video sequence
<TrustBar />              ← KEEP, polish chip styling
<BentoCategories />       ← REWRITE: dark bento grid με images
<FeaturedProducts />      ← REWRITE: carousel με snap + quick-add
<BrandsStrip />           ← REWRITE: animated marquee, 73 brands
<ReviewsCarousel />       ← KEEP if reviews exist; hide gracefully if 0
```

### 3.1 HeroSection — scroll-driven video

**Technique:** Pre-rendered frames + canvas blitting driven by scroll position. Reference implementation: Apple AirPods Pro page.

**Source video:** AI-generated via Higgsfield MCP. Prompt to refine but starting from:
> "Cinematic motorcycle riding through Greek mountain road at golden hour, slow dolly forward, professional cinematography, 4K, color graded, no logos"

Output target: 4 seconds @ 30fps = **120 frames**. Saved as WebP, target 50–80 KB per frame, total budget ~7 MB lazy-loaded.

**Markup structure:**

```tsx
<section style={{ height: "200vh", position: "relative" }}>
  <div style={{ position: "sticky", top: 0, height: "100vh" }}>
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
    {/* Overlay layers fade in/out based on scroll progress */}
    <div className="absolute inset-0 flex flex-col items-start justify-end p-12">
      <p className="text-sm uppercase tracking-widest text-brand-red" style={{ opacity: opacityForLine1 }}>
        Race-Grade Equipment
      </p>
      <h1 className="font-russo text-6xl md:text-9xl uppercase leading-none text-white"
          style={{ opacity: opacityForLine2 }}>
        Ride.<br/>Protected.
      </h1>
      <div className="mt-8 flex gap-4" style={{ opacity: opacityForCta }}>
        <button className="rounded-full bg-brand-red px-8 py-4 font-bold text-white hover:shadow-[var(--accent-glow-strong)]">
          Δες τον κατάλογο
        </button>
        <button className="rounded-full border border-white/30 px-8 py-4 text-white">
          Νέες αφίξεις
        </button>
      </div>
    </div>
  </div>
</section>
```

**Scroll mapping logic:**
- 0% scroll → frame 0, line 1 opacity 0
- 20% scroll → frame 24, line 1 opacity 1 (eyebrow visible)
- 40% scroll → frame 48, line 2 opacity 1 (headline visible)
- 70% scroll → frame 84, CTAs fade in
- 100% scroll → frame 119, final state pinned

**Frame loading strategy:**
1. **Frame 0** (1 image, ~80 KB) loads inline with the page as critical resource — instant first paint.
2. Frames 1–30 preload in parallel immediately after first paint (priority `high`).
3. Frames 31–119 preload lazily in batches of 10 with `requestIdleCallback`.

**Performance budget:** First Contentful Paint < 1.0s (frame 0 only). Total hero frame budget budget ~7 MB delivered progressively. Above-the-fold critical path < 500 KB.

**Mobile fallback:** On screens < 768px, replace canvas with single static hero image + simpler text overlay (no scroll-driven animation). Conserves bandwidth & avoids janky animation on lower-end devices.

**Accessibility:** Respect `prefers-reduced-motion: reduce` → show static frame 60 (mid-clip) with text overlay fully visible. No motion at all.

### 3.2 TrustBar (light polish)

Existing component. Apply:
- Background `--bg-surface` (slightly lifted from page bg)
- Chip-like containers με rounded-full border + subtle glow on hover
- Icons με red accent
- Items pulled from `site_settings.trust_items`; fallback to 4 defaults if empty:
  1. 🚚 Δωρεάν αποστολή
  2. ↩️ 30 ημέρες επιστροφή
  3. ✓ 100% αυθεντικά
  4. 🛡️ Εγγύηση τιμής

### 3.3 BentoCategories (rewrite)

8 L1 categories σε **3-column bento grid**:

```
┌────────────────┬──────────┬──────────┐
│ Εξοπλισμός     │  Off-    │  Λιπαν-  │
│ αναβάτη        │  Road    │  τικά    │
│  (large 2x2)   │          │          │
│                ├──────────┼──────────┤
│                │ ΠΟΔΗΛΑ-  │ Προσφο-  │
│                │ ΤΙΚΑ     │ ρές      │
├────────────────┴──────────┴──────────┤
│ Εξοπλισμός μοτοσικλέτας (wide 3x1)   │
└──────────────────────────────────────┘
```

Each tile:
- Background image (category.image_url) with dark overlay
- Bottom-left: category name (Russo One uppercase)
- Top-right: small "(N προϊόντα)" count
- Hover: scale 1.02 + red border glow + arrow icon slides in
- Click: navigate to `/{full_path}`

**Implementation:** CSS Grid με explicit row/col spans. Image lazy-loaded via Next/Image with `priority` only for above-the-fold tiles.

**Data:** Need to populate `categories.image_url` for L1 categories. If null, use gradient placeholder with category icon (Lucide icons mapping).

### 3.4 FeaturedProducts (rewrite)

6-product carousel με horizontal snap-scroll. Each card:

```
┌─────────────────┐
│                 │ ← image, aspect-square, gentle zoom on hover
│  [product img]  │
│                 │
│        ♥ +cart  │ ← top-right quick actions on hover
├─────────────────┤
│ BRAND           │ ← small uppercase
│ Product name    │ ← medium weight
│ €123,45         │ ← bold red
└─────────────────┘
```

- Pure CSS carousel με `scroll-snap-type: x mandatory`
- Left/right arrows visible on desktop
- Dot indicators on mobile
- 6 products: pick from `is_featured=true` first, fallback to top-rated active products with images

### 3.5 BrandsStrip (rewrite)

Animated infinite marquee με τα 73 brands. Each brand logo wrapped in clickable card:
- Background: subtle gradient
- Hover: red glow + pause animation
- Click: navigate to `/?brand={slug}` (filtered listing)

Use Framer Motion `motion.div` with infinite `x` animation OR pure CSS `@keyframes` with `animation: scroll 60s linear infinite`. Prefer CSS for performance.

### 3.6 ReviewsCarousel

Existing component. Show only if `reviews.length >= 3`, otherwise skip section silently.

## 4. Product page redesign

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumbs / Home › L1 › L2 › Product                       │
├──────────────────────┬───────────────────────────────────────┤
│ Gallery (60% width)  │ Sticky Info Panel (40% width)         │
│ ┌──┐                 │  brand chip                            │
│ │ T│  ┌───────────┐  │  H1 Product name                       │
│ │ h│  │           │  │  ★★★★☆ (12)                            │
│ │ u│  │  active   │  │  ──────                                │
│ │ m│  │  image    │  │  €123,45  €149,90  -18%                │
│ │ b│  │           │  │  ──────                                │
│ │ s│  │           │  │  Variant: [S M L XL]                   │
│ │  │  │           │  │  ──────                                │
│ │  │  └───────────┘  │  📍 Σίνδος ✓ · Αθήνα ✓                 │
│ └──┘                 │  ──────                                │
│                      │  [   ADD TO CART        ]              │
│                      │  ♥ wishlist  ⤴ share                    │
│                      │  Klarna · Delivery 2-4 days            │
└──────────────────────┴───────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ TABS: Description · Specs · Reviews · Q&A                    │
│ ────────────────────────────────────────                     │
│ [active tab content with smooth height transition]            │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Σχετικά προϊόντα — 6 cards carousel                          │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Gallery (rewrite)

- **Desktop:** Vertical thumbs strip (80px wide) on left + main image (rest). Click thumb → smooth fade swap.
- **Mobile:** Horizontal carousel με dot indicators.
- Zoom on hover (desktop): cursor-tracked magnifier or full lightbox.
- Lightbox: full-screen modal με keyboard nav (arrows + ESC).
- Loading: skeleton with brand-red shimmer.

### 4.3 Sticky info panel

Sticky on desktop (sticky top: 80px). Contains:
1. Brand chip — small uppercase, clickable to `/brand/{slug}`
2. H1 — Russo One, mid-size (not as big as hero)
3. Rating row (only if reviews > 0)
4. Price block (large, with strikethrough compare-at if discounted)
5. Variant selector (sizes/colors as toggle buttons)
6. Stock per warehouse — chips με green/red dot based on availability
7. Quantity stepper + Add to cart (full-width, red, glow on hover)
8. Secondary actions row: Wishlist heart toggle + Share button
9. Klarna info banner
10. Delivery estimate

### 4.4 Tabs

Animated underline indicator. Tab content:
- **Description:** `product.description`, marked-up paragraphs με `prose` styling
- **Specs:** `product.specs` table
- **Reviews:** Existing ReviewsSection
- **Q&A:** Existing QASection

Default open tab: Description. URL hash sync (`#description`, `#reviews`) for shareable deep-links.

### 4.5 Related products

ProductGrid με 6 items, horizontally scrollable on mobile. Selection criteria:
- Same brand_id first
- Then same category_id
- Active + has images

### 4.6 Mobile sticky add-to-cart bar

Below 768px: bottom-fixed bar (always visible after scrolling past hero):
```
[ €123,45 ]  [    Στο καλάθι    ]
```

## 5. Animation principles

- **Durations:** 200ms for hover; 300-400ms for transitions; 600ms+ for page-level
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (material standard)
- **Stagger:** 50ms between items in grids
- **No motion** if `prefers-reduced-motion: reduce` — all transitions become instant or duration:0
- **Smooth scroll:** Lenis (already installed) wired at root layout

## 6. Performance budgets

| Metric | Budget |
|---|---|
| LCP | < 2.0s |
| FCP | < 1.0s |
| TTI | < 3.5s |
| CLS | < 0.05 |
| Bundle (first load JS) | < 200 KB |
| Hero frames total (lazy) | < 8 MB |
| Above-the-fold page weight | < 1.5 MB |

Verify με Lighthouse on each PR.

## 7. Out of scope (explicit non-goals)

- Newsletter signup widget
- Live chat / support widget
- AI-assisted product search (separate epic)
- 3D model viewer (could add later for top products)
- Wishlist persistence across devices (already works via Supabase Auth)
- Currency switcher
- Multi-language switcher (already exists, not redesigning here)
- Checkout flow polish (separate epic)
- Admin panel polish (separate epic)

## 8. Dependencies

All already installed:
- `framer-motion` (animations)
- `lenis` (smooth scroll)
- `next/image` (optimized images)
- `@react-three/fiber`, `three` (3D — not used in this scope)
- `shadcn/ui` primitives
- `lucide-react` (icons)

New requirements:
- Higgsfield MCP OAuth (one-time) for video generation
- `ffmpeg` (CLI, system-level) for video → frames conversion (only needed during generation, not runtime)
- `sharp` for WebP conversion (already pulled in transitively by Next/Image)

## 9. Open questions / risks

1. **Hero video generation quality** — Higgsfield output may need 2-3 prompt iterations. Fallback: stock Pexels clip.
2. **Frame storage** — initially in `/public/hero-frames/*.webp`; if too large, move to Cloudflare R2 + CDN.
3. **Empty states** — banners table is empty, so the original `HeroSection`'s slide-based logic doesn't apply; new scroll-video Hero replaces it entirely.
4. **Featured products** — `is_featured` column might not exist or be unpopulated. Plan B: manually flag 6-10 products in admin.
5. **Category images** — `categories.image_url` is likely empty. Plan B: gradient backgrounds with icon during development; polish later.

## 10. Acceptance criteria

Done means:
- ✓ Homepage renders cinematic scroll-driven hero with at least 60 frames (target 120)
- ✓ All 6 home sections render with quality polish and Greek text
- ✓ Product page renders with vertical thumbs gallery + sticky info
- ✓ Mobile shows sticky bottom add-to-cart bar
- ✓ `prefers-reduced-motion` is honored
- ✓ Lighthouse Performance ≥ 85 on both pages (desktop)
- ✓ No TypeScript errors
- ✓ Existing data (8.572 ready-for-storefront products) renders correctly
- ✓ User confirms "this looks professional enough to show the client"
