# MotoMarket v3 Rebuild — Design Spec

> Date: 2026-05-17 · Source of truth: `prd.md` (repo root parent) · Status: approved-pending-review

## Problem

The current implementation is a 4254-line monolithic cinematic landing (`mm-landing.tsx`)
plus a 4317-line shared shell (`mm-shell.tsx`) using parallax, sticky-scroll, count-ups,
`@react-three/fiber`, `drei`, `gsap`. This is **exactly what the PRD explicitly bans**
(§6.1, §6.2): no heavy cinematic award-site, no parallax everywhere, no scroll-jacking,
no WebGL/3D for browsing, no heavy JS animation libs, no video hero LCP.

The PRD wants the opposite: a premium-but-commercial, fast, conversion-focused e-shop
where products are front-and-center and Lighthouse mobile target is 90+.

## Decisions (locked with user)

1. **Full rebuild** of the presentation layer per PRD — not a dial-back.
2. **Build in `/preview/v3/*` first.** Production routes (`/`, `/category/[slug]`,
   `/product/[slug]`) stay untouched until Chris approves the v3 prototype.
3. **All 10 homepage sections** per PRD §12 (not a reduced subset).
4. **Real Supabase data** — reuse the verified query layer, no mock files.

## Non-goals (PRD §11)

Out of scope: full checkout, payment, real Odoo sync, full account area, auth pages,
all categories, full CMS, deploy/push/commit, marketing automation.

## Scope — 3 screens

| Route | Screen | Reference content |
|---|---|---|
| `/preview/v3` | Homepage | Real categories + bestsellers from Supabase |
| `/preview/v3/category/[slug]` | PLP | Full-Face κράνη category |
| `/preview/v3/product/[slug]` | PDP | A helmet product |

## Data layer — UNCHANGED

Reuse as-is, zero modifications:

- `src/lib/queries/products.ts` — `getProduct`, `getProductsByCategory`, `getProductFilters`
- `src/lib/queries/categories.ts` — `getCategory`, `getSubcategories`, category tree
- `src/lib/supabase/{client,server,public,admin}.ts`
- `src/lib/nav-data.ts` — de-tangled static nav tree (verified consistent with PLP)

No DB/schema changes. PRD §9 data model is "adapt to existing"; existing schema is
already verified working (11862 active products, slug separator `--`, branch-wide
recursive filter via `full_path` inner-join).

## Architecture

Anti-monolith rule: every file ≤300 lines, server-first, one component per file.
No `gsap` / `three` / `@react-three/*` imports anywhere under `src/app/preview/v3/`.

```
src/app/preview/v3/
  layout.tsx                      server shell + minimal cart provider
  page.tsx                        Homepage — server, composes sections
  category/[slug]/page.tsx        PLP server (reuses category/product queries)
  category/[slug]/plp-client.tsx  client: filter/sort interactivity only
  product/[slug]/page.tsx         PDP server (reuses getProduct)
  product/[slug]/pdp-client.tsx   client: gallery/size/add-to-cart only
  _styles/tokens.css              MotoMarket design tokens
  _components/
    shell/    utility-bar · header · mega-menu · mobile-nav · footer · trust-block
    commerce/ product-card · price-display · availability-badge · badge
    filters/  filter-sidebar (desktop) · mobile-filter-drawer
    pdp/      product-gallery · buy-box · size-selector
    home/     hero · category-shortcut-grid · product-rail · offers-section ·
              find-bike · brand-carousel · my-bike-entry · heritage-strip
```

### State

Cart/wishlist/compare/lang/mode lifted to a single provider in `preview/v3/layout.tsx`
(fixes the known per-instance state tech debt **within v3 scope only**). Cart is local
state — no checkout in MVP. Client components limited to: cart drawer, filters, size
selector, live search, mobile drawers (PRD §8.1).

## Design tokens (PRD §6.1)

- Dark graphite/carbon base background
- MotoMarket red = CTA / promo / discount only
- Off-white/white for text and readability
- Cyan reserved as secondary *technical* accent (badges/specs), used sparingly
- Limited font set, safe loading (no FOIT blocking LCP)
- Tokens as CSS variables in `_styles/tokens.css`, auto dark/light

## Motion (PRD §6.2)

Allowed: CSS transform/opacity transitions, hover/tap feedback, skeleton states,
mega-menu open/close transition, small badge motion, `prefers-reduced-motion` fallback.

Banned in v3: parallax, scroll-jacking, big section parallax, video hero as LCP,
WebGL/3D, heavy JS animation libs, layout-shifting animations, effects that delay
search/filter/cart.

## Screen requirements

### Homepage (PRD §12) — all 10 sections, in order

1. Utility bar — language, account, wishlist, order tracking/help
2. Header — logo, **dominant** search input, support, cart
3. Sticky category nav / mega menu (from `nav-data.ts`, CSS transition)
4. Hero — real HTML heading + subcopy + CTAs (`Αγοράστε κράνη`, `Δείτε προσφορές`,
   `Βρείτε με βάση τη μηχανή σας`). No image-only text, no video LCP.
5. Category shortcut grid — Κράνη, Μπουφάν, Γάντια, Μπότες, Βαλίτσες, Λιπαντικά,
   Quad Lock, Off-road (real category slugs)
6. Bestsellers / new arrivals — real product cards from Supabase
7. Offers section
8. My Bike / fitment entry point
9. Brand carousel (CSS only)
10. Trust block — fast shipping, official brands, size exchange/returns, secure
    payments, store pickup (only claims that are true)

Acceptance: categories understood in 3s · search visually dominant · main CTA above
fold · hero is real HTML text · no video LCP · simple mobile sticky header.

### PLP — Full-Face κράνη (PRD §13)

Breadcrumbs · category title · short SEO intro · product count · sort selector
(Recommended/Bestsellers/Availability/Price ↑↓/Newest) · desktop filter sidebar ·
mobile filter drawer · product grid · subcategory chips.

Filters open by default: Διαθεσιμότητα, Μέγεθος, Κατασκευαστής, Τιμή, Πιστοποίηση,
Χρήση (city/touring/racing/adventure), Features (ECE 22.06, Pinlock-ready, sun visor,
Bluetooth-ready). Filters that the DB cannot back yet render display-only and are
clearly non-functional (no fake filtering).

URL-driven filters (sort/brands/price/page) via Next router — deep-linkable, SEO,
browser-back works (preserve existing PLP behavior).

Product card: image (stable aspect ratio), brand, model, price, old price + discount
badge, stock/availability, available sizes, 2–4 feature badges, wishlist icon, CTA.

Acceptance: fast scan · availability/size visible without PDP · one-thumb mobile
drawer · no CLS on image load · no full slow reload on filter.

### PDP — helmet (PRD §14)

Above fold: optimized gallery + thumbnails · brand · title · SKU · rating placeholder ·
price + compare-at + saving % · key badges (ECE 22.06, full/flip, Pinlock-ready, sun
visor, Bluetooth-ready, weight if verified) · size chips (not only dropdown) · size
guide link · availability by selected size · delivery estimate · returns reassurance ·
strong Add to Cart · trust row (secure payments, returns, official dealer/warranty).

Below fold: description · specs table · certifications · delivery/returns accordion ·
related products · similar helmets.

JSON-LD Product schema (offers, aggregateRating, brand) + breadcrumb structured data.
Disabled add-to-cart when stock 0. No unverified claims.

Acceptance: clear mobile add-to-cart path · easy size choice · availability/delivery
near CTA · scannable specs · structured data present.

## SEO & Accessibility (PRD §15–16)

Real HTML titles/headings, OpenGraph, image alt, canonical, clean slugs, product +
breadcrumb structured data. Keyboard-navigable filters/menus, real buttons/links, AA
contrast, visible focus, drawer focus trap, reduced-motion respected.

## Performance (PRD §7)

Targets: mobile Lighthouse 90+, LCP <2.5s, INP <200ms, CLS <0.1, TTFB <800ms.
Rules: `next/image` everywhere, stable dimensions, small critical JS, server-rendered
product/category content, lazy-load below-fold media, no carousel/video as LCP,
limited fonts, controlled third-party scripts. Measure before claiming wins.

## Testing (PRD §21 DoD)

- `npm run build`, `npm run lint`, typecheck (tsc) must pass
- Vitest unit tests only for new pure helpers: price/discount formatting, filter URL
  param parse/serialize. No tests for CSS/components/third-party internals
  (per project testing rules)
- Manual QA: desktop + mobile for all 3 screens; Lighthouse on homepage if available

## Definition of Done

Homepage/PLP/PDP exist under `/preview/v3/*` and are navigable, mobile usable, cards
show price/availability/sizes/badges, PDP buy box strong, no `.env`/secrets touched,
build + lint + typecheck pass, no perf-risk effects, production routes untouched,
Chris can review screenshots/local pages.

## Risks & controls

| Risk | Control |
|---|---|
| Visually nice but slow | No video hero, no WebGL, minimal client JS, Lighthouse after build |
| Wrong product claims | Only verified Supabase data, no fake certs/prices/stock |
| Odoo blocked later | Data layer untouched, stable SKU/variant shape preserved |
| Scope creep back to monolith | ≤300 line files, 3 screens only, no checkout/account |
| Repo not under git | No destructive deletes; v3 is additive, production untouched |
