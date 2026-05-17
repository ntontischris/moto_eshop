# MotoMarket v3 Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, commercial, PRD-aligned 3-screen e-shop prototype (Homepage, Full-Face PLP, Helmet PDP) under `/preview/v3/*`, reusing the existing Supabase query layer untouched.

**Architecture:** New presentation layer only. Every file ≤300 lines, server-first, one responsibility per file. A lean client provider holds cart/wishlist/lang state for the v3 tree. Zero `gsap`/`three`/`@react-three/*` imports anywhere under `preview/v3/`. Production routes (`/`, `/category/[slug]`, `/product/[slug]`) are NOT touched.

**Tech Stack:** Next.js (App Router — **non-standard build, see Conventions**), TypeScript, Supabase (existing queries), CSS variables for tokens, `next/image`, Vitest for pure-helper tests.

---

## Conventions (read before any task)

1. **This is NOT standard Next.js.** `params` and `searchParams` are `Promise`s — always `await` them. Follow the exact patterns in `src/app/product/[slug]/page.tsx` and `src/app/category/[slug]/page.tsx`. Do **NOT** use `export const revalidate` (the cacheComponents build rejects it). If unsure about an API, read `node_modules/next/dist/docs/` first.
2. **Repo is not under git.** Wherever a step says "Checkpoint", that means: stop, run the listed verification, confirm output matches "Expected", then continue. There are no commits.
3. **v3 is additive only.** Every file is newly created under `src/app/preview/v3/`. No existing symbol is modified, so `gitnexus_impact` is not required. The final task runs `gitnexus_detect_changes()` once to confirm scope stayed additive.
4. **Do not touch** `.env`, the query layer (`src/lib/queries/*`), Supabase clients, `src/lib/nav-data.ts`, or any production route.
5. **Verification gate per task:** `npx tsc --noEmit` clean AND `npm run lint` clean before the task is done. Component tasks additionally require a dev-server render check (HTTP 200, no console error).
6. **Reused query API (do not redefine):**
   - `getProduct(slug: string): Promise<Product | null>`
   - `getProductsByCategory(opts: GetProductsByCategoryOptions): Promise<PaginatedResult<ProductListItem>>`
   - `getProductFilters(slug: string): Promise<ProductFilters>`
   - `getRelatedProducts(productId: string, categorySlug: string, limit?: number): Promise<ProductListItem[]>`
   - `getPopularProductSlugs(): Promise<string[]>`
   - `getCategory(slug: string): Promise<Category | null>`
   - `getSubcategories(slug: string)` · `getCategoryTree(): Promise<CategoryTreeNode[]>`
   - `NAV: NavRoot[]` from `@/lib/nav-data` (`NavRoot/NavL2/NavL3`)
   - Types `Product`, `ProductListItem`, `ProductFilters`, `SortOption`, `Category` from the query modules.

---

## File Structure

```
src/app/preview/v3/
  _styles/tokens.css
  _lib/format.ts                 price/discount pure helpers (tested)
  _lib/plp-params.ts             URL <-> filter state (tested)
  _components/
    shell/v3-provider.tsx        client context: cart/wishlist/lang
    shell/utility-bar.tsx
    shell/header.tsx             logo + dominant search + cart
    shell/mega-menu.tsx          from NAV, CSS transition
    shell/mobile-nav.tsx
    shell/footer.tsx
    shell/trust-block.tsx
    commerce/badge.tsx
    commerce/price-display.tsx
    commerce/availability-badge.tsx
    commerce/product-card.tsx
    home/hero.tsx
    home/category-shortcut-grid.tsx
    home/product-rail.tsx
    home/offers-section.tsx
    home/my-bike-entry.tsx
    home/brand-carousel.tsx
    home/heritage-strip.tsx
    filters/filter-sidebar.tsx
    filters/mobile-filter-drawer.tsx
    pdp/product-gallery.tsx
    pdp/size-selector.tsx
    pdp/buy-box.tsx
  layout.tsx                     server shell wrapper + provider + chrome
  page.tsx                       Homepage (server, composes 10 sections)
  category/[slug]/page.tsx       PLP server
  category/[slug]/plp-client.tsx PLP client (filters/sort)
  product/[slug]/page.tsx        PDP server + JSON-LD
  product/[slug]/pdp-client.tsx  PDP client (gallery/size/cart)
```

Shared prop types are declared in the file that owns the component and imported where needed. `V3Product` is `ProductListItem`; `V3ProductFull` is `Product` (no new aliases — use the query types directly).

---

## Task 1: Scaffold + design tokens

**Files:**
- Create: `src/app/preview/v3/_styles/tokens.css`
- Create: `src/app/preview/v3/layout.tsx` (temporary minimal shell, finalised in Task 4)

- [ ] **Step 1: Create `tokens.css`**

```css
:root[data-v3] {
  --v3-carbon: #0c0d0f;
  --v3-graphite: #16181c;
  --v3-surface: #1e2127;
  --v3-line: #2c2f37;
  --v3-bone: #f4f3ef;
  --v3-bone-dim: #a9aab0;
  --v3-red: #e11d2e;
  --v3-red-hover: #c4111f;
  --v3-cyan: #2fb5c4;          /* secondary technical accent only */
  --v3-radius: 10px;
  --v3-shadow: 0 6px 24px rgba(0,0,0,.45);
  --v3-gutter: clamp(16px, 4vw, 56px);
  --v3-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.v3-root { background: var(--v3-carbon); color: var(--v3-bone); font-family: var(--v3-font); overflow-x: clip; }
.v3-root img, .v3-root svg, .v3-root video { max-width: 100%; height: auto; }
.v3-btn-primary { background: var(--v3-red); color: #fff; border: 0; border-radius: var(--v3-radius); padding: 14px 22px; font-weight: 700; cursor: pointer; transition: background .15s; }
.v3-btn-primary:hover { background: var(--v3-red-hover); }
.v3-btn-primary:focus-visible { outline: 2px solid var(--v3-cyan); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .v3-root * { animation: none !important; transition: none !important; } }
```

- [ ] **Step 2: Create minimal `layout.tsx`** (replaced in Task 4)

```tsx
import "./_styles/tokens.css";

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return <div className="v3-root" data-v3>{children}</div>;
}
```

- [ ] **Step 3: Checkpoint**

Run: `npx tsc --noEmit`
Expected: no errors referencing `preview/v3`.

---

## Task 2: Format helpers (TDD)

**Files:**
- Create: `src/app/preview/v3/_lib/format.ts`
- Test: `src/app/preview/v3/_lib/format.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { formatPrice, discountPercent, hasDiscount } from "./format";

describe("format", () => {
  it("formats EUR with greek locale", () => {
    expect(formatPrice(199)).toBe("199,00 €");
    expect(formatPrice(199.9)).toBe("199,90 €");
  });
  it("computes discount percent rounded", () => {
    expect(discountPercent(80, 100)).toBe(20);
    expect(discountPercent(67, 100)).toBe(33);
  });
  it("hasDiscount only when compare > price", () => {
    expect(hasDiscount(80, 100)).toBe(true);
    expect(hasDiscount(100, 100)).toBe(false);
    expect(hasDiscount(80, null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/app/preview/v3/_lib/format.test.ts`
Expected: FAIL — "Cannot find module './format'".

- [ ] **Step 3: Write minimal implementation**

```ts
const EUR = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number): string {
  return EUR.format(value);
}

export function hasDiscount(
  price: number,
  compareAt: number | null,
): boolean {
  return compareAt != null && compareAt > price;
}

export function discountPercent(
  price: number,
  compareAt: number | null,
): number {
  if (!hasDiscount(price, compareAt)) return 0;
  return Math.round(((compareAt! - price) / compareAt!) * 100);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/app/preview/v3/_lib/format.test.ts`
Expected: PASS (3 tests). If the non-breaking-space assertion mismatches the runtime locale data, adjust the expected string to the exact `Intl` output and document it in a comment — do not change the implementation.

- [ ] **Step 5: Checkpoint** — `npx tsc --noEmit` clean.

---

## Task 3: PLP URL-param helpers (TDD)

**Files:**
- Create: `src/app/preview/v3/_lib/plp-params.ts`
- Test: `src/app/preview/v3/_lib/plp-params.test.ts`

Mirrors the existing PLP behavior in `src/app/category/[slug]/page.tsx:49-56` (keys: `sort`, `brands` comma-joined, `price_min`, `price_max`, `page`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { parsePlpParams, buildPlpQuery } from "./plp-params";

describe("plp-params", () => {
  it("parses defaults", () => {
    expect(parsePlpParams({})).toEqual({
      sort: "popular", brands: [], priceMin: undefined,
      priceMax: undefined, page: 1,
    });
  });
  it("parses provided values", () => {
    expect(parsePlpParams({
      sort: "price_asc", brands: "agv,shoei",
      price_min: "50", price_max: "300", page: "2",
    })).toEqual({
      sort: "price_asc", brands: ["agv", "shoei"],
      priceMin: 50, priceMax: 300, page: 2,
    });
  });
  it("serializes back, omitting defaults", () => {
    expect(buildPlpQuery({
      sort: "popular", brands: [], priceMin: undefined,
      priceMax: undefined, page: 1,
    })).toBe("");
    expect(buildPlpQuery({
      sort: "newest", brands: ["agv"], priceMin: 50,
      priceMax: undefined, page: 3,
    })).toBe("?sort=newest&brands=agv&price_min=50&page=3");
  });
});
```

- [ ] **Step 2: Run test — verify FAIL** ("Cannot find module './plp-params'").

Run: `npm run test -- src/app/preview/v3/_lib/plp-params.test.ts`

- [ ] **Step 3: Write minimal implementation**

```ts
import type { SortOption } from "@/lib/queries/products";

export interface PlpState {
  sort: SortOption;
  brands: string[];
  priceMin: number | undefined;
  priceMax: number | undefined;
  page: number;
}

type Raw = Record<string, string | string[] | undefined>;
const SORTS: SortOption[] = [
  "popular", "price_asc", "price_desc", "newest", "rating",
];

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parsePlpParams(sp: Raw): PlpState {
  const sortRaw = str(sp.sort);
  const sort = SORTS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : "popular";
  const brandsRaw = str(sp.brands);
  const min = str(sp.price_min);
  const max = str(sp.price_max);
  const page = Number(str(sp.page));
  return {
    sort,
    brands: brandsRaw ? brandsRaw.split(",").filter(Boolean) : [],
    priceMin: min ? Number(min) : undefined,
    priceMax: max ? Number(max) : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function buildPlpQuery(s: PlpState): string {
  const p = new URLSearchParams();
  if (s.sort !== "popular") p.set("sort", s.sort);
  if (s.brands.length) p.set("brands", s.brands.join(","));
  if (s.priceMin != null) p.set("price_min", String(s.priceMin));
  if (s.priceMax != null) p.set("price_max", String(s.priceMax));
  if (s.page > 1) p.set("page", String(s.page));
  const q = p.toString();
  return q ? `?${q}` : "";
}
```

- [ ] **Step 4: Run test — verify PASS** (3 tests).

Run: `npm run test -- src/app/preview/v3/_lib/plp-params.test.ts`

- [ ] **Step 5: Checkpoint** — `npx tsc --noEmit` clean.

---

## Task 4: v3 provider + finalized layout/chrome

**Files:**
- Create: `src/app/preview/v3/_components/shell/v3-provider.tsx`
- Create: `src/app/preview/v3/_components/shell/utility-bar.tsx`
- Create: `src/app/preview/v3/_components/shell/header.tsx`
- Create: `src/app/preview/v3/_components/shell/mega-menu.tsx`
- Create: `src/app/preview/v3/_components/shell/mobile-nav.tsx`
- Create: `src/app/preview/v3/_components/shell/footer.tsx`
- Modify: `src/app/preview/v3/layout.tsx`

**Contracts (must hold exactly — later tasks depend on these):**

`v3-provider.tsx` exports:
- `V3Provider({ children }: { children: React.ReactNode })` — client component, wraps children in context.
- `useV3(): { lang: "el" | "en"; setLang(l): void; cart: CartLine[]; addToCart(line: CartLine): void; cartCount: number; cartOpen: boolean; setCartOpen(b: boolean): void; wishlist: string[]; toggleWishlist(slug: string): void }`
- `interface CartLine { slug: string; name: string; brand: string; price: number; size: string | null; image: string; qty: number }`
- State is module-local React state (no checkout). Cart drawer UI lives in a later task only if time allows; for MVP `cartOpen` toggles a simple panel rendered by `header.tsx`.

- [ ] **Step 1: Implement `v3-provider.tsx`** — `"use client"`, `createContext`, `useState` for `lang` (default `"el"`), `cart`, `cartOpen`, `wishlist`. `addToCart` appends or increments by `slug+size`. `cartCount` = sum of `qty`. `toggleWishlist` adds/removes slug. Export `useV3` that throws if used outside provider.

- [ ] **Step 2: Implement `utility-bar.tsx`** — server component. Slim bar (`--v3-graphite` bg, 34px tall): left = language toggle (renders a small client `<LangToggle/>` from provider), right = links `Λογαριασμός`, `Λίστα επιθυμιών`, `Παρακολούθηση παραγγελίας`, `Βοήθεια`. Real `<a>`/`<button>`, AA contrast, focus-visible ring.

- [ ] **Step 3: Implement `header.tsx`** — client component. Grid: MotoMarket wordmark (text, no image) · **dominant** search `<form role="search">` with large input (min-height 52px, flex-grow, placeholder `Αναζήτηση σε 11.000+ προϊόντα…`) · `Υποστήριξη` link · cart button showing `cartCount` from `useV3`, toggles `cartOpen`. Sticky on scroll (`position: sticky; top: 0`). No layout shift.

- [ ] **Step 4: Implement `mega-menu.tsx`** — client component. Renders sticky category nav from `NAV` (`@/lib/nav-data`). Each root is a button; hover/focus opens a panel (`max-height` + `opacity` CSS transition, 160ms) listing its `NavL2` as column headers linking `/preview/v3/category/{l2.slug}` with up to 7 `NavL3` children each. Roots flagged `noPanel` render as plain links. Keyboard: arrow/escape close, focus trap inside open panel. Hidden `<860px` (mobile-nav takes over).

- [ ] **Step 5: Implement `mobile-nav.tsx`** — client. Fixed bottom bar (`<=860px` only): Αρχική, Κατηγορίες (opens full-screen drawer of `NAV` roots→L2), Αναζήτηση, Καλάθι (`cartCount`), Λίστα. Focus trap in drawer; `prefers-reduced-motion` respected.

- [ ] **Step 6: Implement `footer.tsx`** — server. Columns: κατηγορίες (top `NAV` roots), εξυπηρέτηση (αποστολές/επιστροφές/εγγύηση/επικοινωνία), εταιρεία, πληρωμές row. Single column `<520px`. All real links to `/preview/v3/...` or `#` for not-yet-built pages (clearly inert, not fake).

- [ ] **Step 7: Finalize `layout.tsx`**

```tsx
import "./_styles/tokens.css";
import { V3Provider } from "./_components/shell/v3-provider";
import { UtilityBar } from "./_components/shell/utility-bar";
import { Header } from "./_components/shell/header";
import { MegaMenu } from "./_components/shell/mega-menu";
import { MobileNav } from "./_components/shell/mobile-nav";
import { Footer } from "./_components/shell/footer";

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v3-root" data-v3>
      <V3Provider>
        <UtilityBar />
        <Header />
        <MegaMenu />
        <main>{children}</main>
        <Footer />
        <MobileNav />
      </V3Provider>
    </div>
  );
}
```

- [ ] **Step 8: Checkpoint**

Run: `npx tsc --noEmit` and `npm run lint`
Then `npm run dev`, open `http://localhost:3000/preview/v3` (page may 404 until Task 7 — that is fine; assert chrome compiles with no console error in terminal).
Expected: tsc + lint clean; no module-resolution errors for `preview/v3`.

---

## Task 5: Commerce primitives

**Files:**
- Create: `src/app/preview/v3/_components/commerce/badge.tsx`
- Create: `src/app/preview/v3/_components/commerce/price-display.tsx`
- Create: `src/app/preview/v3/_components/commerce/availability-badge.tsx`
- Create: `src/app/preview/v3/_components/commerce/product-card.tsx`

**Contracts:**
- `Badge({ label, tone }: { label: string; tone?: "neutral" | "tech" | "promo" })` — server. `tech` uses `--v3-cyan`, `promo` uses `--v3-red`.
- `PriceDisplay({ price, compareAt }: { price: number; compareAt: number | null })` — server. Uses `formatPrice/hasDiscount/discountPercent` from `_lib/format`. Shows current price; if discount: struck `compareAt` + red `-NN%` badge.
- `AvailabilityBadge({ stock }: { stock: number })` — server. `stock>0` → green `Διαθέσιμο`; `0` → muted `Εξαντλημένο`.
- `ProductCard({ product }: { product: ProductListItem })` — server. Renders: `next/image` (fixed aspect-ratio box, `sizes` set, no CLS) · brand (uppercase, dim) · name (2-line clamp) · `PriceDisplay` · `AvailabilityBadge` · up to 3 feature `Badge`s derived from `product.certification` / `product.rider_type` (only render when present — no fabricated badges) · wishlist button (client island calling `useV3().toggleWishlist`) · link wrapping card to `/preview/v3/product/{slug}` with CTA text `Δείτε προϊόν`.

- [ ] **Step 1:** Implement `badge.tsx` per contract.
- [ ] **Step 2:** Implement `price-display.tsx` per contract, importing from `../../_lib/format`.
- [ ] **Step 3:** Implement `availability-badge.tsx` per contract.
- [ ] **Step 4:** Implement `product-card.tsx` per contract. Image box: `aspect-ratio: 4/5; position: relative` with `<Image fill sizes="(max-width:480px) 50vw, 240px" />`. Wishlist button is a tiny `"use client"` sub-component in the same file or a local island; keep file ≤300 lines.
- [ ] **Step 5: Checkpoint** — `npx tsc --noEmit` + `npm run lint` clean.

---

## Task 6: Trust block

**Files:**
- Create: `src/app/preview/v3/_components/shell/trust-block.tsx`

- [ ] **Step 1:** Implement `TrustBlock()` — server. 4–5 cells, each icon (inline SVG) + title + one line: `Γρήγορη αποστολή`, `Επίσημοι προμηθευτές/brands`, `Αλλαγές μεγέθους & επιστροφές`, `Ασφαλείς πληρωμές`, `Παραλαβή από κατάστημα`. Only claims that are true (PRD §17). Grid 5→2→1 at 900/520px. No motion beyond hover.
- [ ] **Step 2: Checkpoint** — tsc + lint clean.

---

## Task 7: Homepage sections A + page skeleton

**Files:**
- Create: `src/app/preview/v3/_components/home/hero.tsx`
- Create: `src/app/preview/v3/_components/home/category-shortcut-grid.tsx`
- Create: `src/app/preview/v3/page.tsx`

- [ ] **Step 1: Implement `hero.tsx`** — server. **Real HTML** `<h1>` `Εξοπλισμός μηχανής, χωρίς συμβιβασμούς` + `<p>` subcopy + 3 CTAs: `Αγοράστε κράνη` → `/preview/v3/category/{HELMET_SLUG}`, `Δείτε προσφορές` → `/preview/v3/category/prosfores`, `Βρείτε με βάση τη μηχανή σας` → anchor `#my-bike`. Background = a CSS gradient over a single optimized `next/image` (priority, explicit width/height, NOT a video, NOT parallax). `HELMET_SLUG` is a constant resolved in Step 4.

- [ ] **Step 2: Implement `category-shortcut-grid.tsx`** — server. 8 tiles (Κράνη, Μπουφάν, Γάντια, Μπότες, Βαλίτσες/αποσκευές, Λιπαντικά, Quad Lock, Off-road). Each tile = link to its real category slug + `next/image` thumb + label. Slugs come from `NAV`/`getCategoryTree()` — pass a resolved `{label, href, image}[]` prop from `page.tsx`; do not hardcode guessed slugs.

- [ ] **Step 3: Create `page.tsx` skeleton**

```tsx
import type { Metadata } from "next";
import { Hero } from "./_components/home/hero";
import { CategoryShortcutGrid } from "./_components/home/category-shortcut-grid";
import { getCategoryTree } from "@/lib/queries/categories";

export const metadata: Metadata = {
  title: "MotoMarket — Εξοπλισμός μηχανής & αναβάτη",
  description:
    "Κράνη, μπουφάν, γάντια, μπότες και αξεσουάρ από επίσημους προμηθευτές.",
};

const SHORTCUTS: { label: string; match: string }[] = [
  { label: "Κράνη", match: "eksoplismos-anabath" },
  { label: "Μπουφάν", match: "endysh--mpoyfan" },
  { label: "Γάντια", match: "endysh--gantia" },
  { label: "Μπότες", match: "endysh--mpotes" },
  { label: "Βαλίτσες", match: "eksoplismos-motosikletas" },
  { label: "Λιπαντικά", match: "lipantika" },
  { label: "Quad Lock", match: "aksesoyar" },
  { label: "Off-road", match: "off-road" },
];

export default async function V3Home() {
  const tree = await getCategoryTree();
  const flat = new Set(tree.flatMap(function collect(n): string[] {
    return [n.slug, ...n.children.flatMap(collect)];
  }));
  const shortcuts = SHORTCUTS.map((s) => ({
    label: s.label,
    href: `/preview/v3/category/${s.match}`,
    valid: flat.has(s.match),
  }));
  return (
    <>
      <Hero />
      <CategoryShortcutGrid items={shortcuts} />
    </>
  );
}
```

- [ ] **Step 4: Resolve `HELMET_SLUG`**

Find the Full-Face helmets leaf slug. Run dev, open `/preview/v3` mega-menu, locate the helmets (Κράνη → Full-Face) entry, copy its slug. Record it as a `const HELMET_SLUG` in `hero.tsx`. If the exact full-face leaf is unclear, use the verified working root `eksoplismos-anabath` and note the assumption in a code comment. Do **not** invent a slug.

- [ ] **Step 5: Checkpoint**

Run: `npx tsc --noEmit`, `npm run lint`, then `npm run dev` and open `http://localhost:3000/preview/v3`.
Expected: HTTP 200, hero `<h1>` is real text in DOM, 8 category tiles render, no console error.

---

## Task 8: Homepage sections B (data-driven rails)

**Files:**
- Create: `src/app/preview/v3/_components/home/product-rail.tsx`
- Create: `src/app/preview/v3/_components/home/offers-section.tsx`
- Modify: `src/app/preview/v3/page.tsx`

- [ ] **Step 1:** Implement `product-rail.tsx` — server. Props `{ title: string; products: ProductListItem[] }`. Horizontal scroll-snap row of `ProductCard`, section header with title + "Δείτε όλα" link. CSS scroll only (no JS carousel).
- [ ] **Step 2:** Implement `offers-section.tsx` — server. Props `{ products: ProductListItem[] }`. Same as rail but red-accented header `Προσφορές`; cards already show `-NN%` via `PriceDisplay`.
- [ ] **Step 3:** Wire into `page.tsx`: after the category grid, fetch and render two rails.

```tsx
import { getProductsByCategory } from "@/lib/queries/products";
import { ProductRail } from "./_components/home/product-rail";
import { OffersSection } from "./_components/home/offers-section";
// inside V3Home, after `flat`:
const [bestRes, offersRes] = await Promise.all([
  getProductsByCategory({ categorySlug: "eksoplismos-anabath", perPage: 10, sort: "popular" }),
  getProductsByCategory({ categorySlug: "eksoplismos-anabath", perPage: 10, sort: "newest" }),
]);
// render: <ProductRail title="Δημοφιλή" products={bestRes.data} />
//         <OffersSection products={offersRes.data} />
```

(Offers is sourced from real products until a discount-flag query exists — PRD §22: no fake discounts; `PriceDisplay` only shows `-NN%` when `compare_at_price` is genuinely higher.)

- [ ] **Step 4: Checkpoint** — tsc + lint clean; `/preview/v3` shows two product rails with real images, no CLS on scroll.

---

## Task 9: Homepage sections C + full compose

**Files:**
- Create: `src/app/preview/v3/_components/home/my-bike-entry.tsx`
- Create: `src/app/preview/v3/_components/home/brand-carousel.tsx`
- Create: `src/app/preview/v3/_components/home/heritage-strip.tsx`
- Modify: `src/app/preview/v3/page.tsx`
- Modify: `src/app/preview/v3/_components/shell/trust-block.tsx` (import only)

- [ ] **Step 1:** Implement `my-bike-entry.tsx` — server, `id="my-bike"`. Two `<select>` placeholders (Μάρκα / Μοντέλο) + CTA `Βρες εξοπλισμό για τη μηχανή σου` linking to the my-bike category root. Selects are display-only for MVP with a visible note `Σύντομα διαθέσιμο` (no fake behavior).
- [ ] **Step 2:** Implement `brand-carousel.tsx` — server. CSS-only marquee/scroll-snap row of carried brand wordmarks (text, not logos, to avoid asset risk). `prefers-reduced-motion` stops animation.
- [ ] **Step 3:** Implement `heritage-strip.tsx` — server. Compact 3–4 stat band (e.g. `11.000+ προϊόντα`, `Επίσημοι προμηθευτές`, `Αποστολή σε 24h`). Static numbers only, no count-up animation, no unverified claims.
- [ ] **Step 4:** Final `page.tsx` order (PRD §12): Hero → CategoryShortcutGrid → ProductRail(Δημοφιλή) → OffersSection → MyBikeEntry → BrandCarousel → HeritageStrip → TrustBlock. (Utility/Header/Nav/Footer come from `layout.tsx`.) Import `TrustBlock` from `_components/shell/trust-block`.
- [ ] **Step 5: Checkpoint**

Run: `npx tsc --noEmit`, `npm run lint`, dev open `/preview/v3`.
Expected: all 10 PRD sections present in order (utility+header+nav from layout, 7 body sections, footer), HTTP 200, no console error, no horizontal scroll at 375px width.

---

## Task 10: PLP — Full-Face helmets

**Files:**
- Create: `src/app/preview/v3/_components/filters/filter-sidebar.tsx`
- Create: `src/app/preview/v3/_components/filters/mobile-filter-drawer.tsx`
- Create: `src/app/preview/v3/category/[slug]/page.tsx`
- Create: `src/app/preview/v3/category/[slug]/plp-client.tsx`

- [ ] **Step 1: Create `page.tsx`** — mirror `src/app/category/[slug]/page.tsx` exactly (async `params`/`searchParams`, `generateMetadata`, `Promise.all` of `getProductsByCategory`/`getProductFilters`/`getSubcategories`), but: no `MMShell` wrapper (layout provides chrome), use `parsePlpParams` from `_lib/plp-params`, render `<PLPClient .../>`. Canonical → `/preview/v3/category/{slug}`.

- [ ] **Step 2: Implement `filter-sidebar.tsx`** — client. Props `{ filters: ProductFilters; state: PlpState; basePath: string }`. Sections, functional ones bound to URL via `next/navigation` `useRouter().push(basePath + buildPlpQuery(next))`:
  - Διαθεσιμότητα (in-stock toggle — client-side filter on rendered list)
  - Κατασκευαστής (brand checkboxes with real `filters.brands` counts)
  - Τιμή (min/max from `filters.price_range`)
  - Πιστοποίηση, Χρήση, Features — render from `filters.certifications`/`filters.rider_types` where data exists; any sub-filter with no DB backing renders **disabled with a `display-only` tag** (PRD §22: no fake filtering).
- [ ] **Step 3: Implement `mobile-filter-drawer.tsx`** — client. Same controls as sidebar in a one-thumb bottom sheet (`<=860px`), focus trap, `Εφαρμογή (N)` apply button, backdrop close, `prefers-reduced-motion`.
- [ ] **Step 4: Implement `plp-client.tsx`** — client. Props match the server payload (slug, category{name,description,seo_intro,image_url}, subcategories, products: ProductListItem[], total, page, totalPages, filters, state). Layout: breadcrumbs · `<h1>` category title · short `seo_intro` (clamped) · product count · sort `<select>` (Recommended/Bestsellers/Availability/Price↑↓/Newest → `SortOption`) wired to URL · subcategory chips · active-filter chips with ✕ · grid of `ProductCard` (4→3→2→1 at 1100/800/480) · `Link` pagination using `buildPlpQuery`. Desktop shows `FilterSidebar`; mobile shows a `Φίλτρα` button opening `MobileFilterDrawer`.
- [ ] **Step 5: Resolve `TEST_PLP_SLUG`** — navigate the v3 mega-menu to Full-Face κράνη; record the working slug. Verify the route renders real products.
- [ ] **Step 6: Checkpoint**

Run: `npx tsc --noEmit`, `npm run lint`, dev `/preview/v3/category/{TEST_PLP_SLUG}`.
Expected: HTTP 200, real products, count + breadcrumbs + sort visible, brand filter changes URL and result set, no CLS on image load, mobile drawer usable one-thumb.

---

## Task 11: PDP — Helmet

**Files:**
- Create: `src/app/preview/v3/_components/pdp/product-gallery.tsx`
- Create: `src/app/preview/v3/_components/pdp/size-selector.tsx`
- Create: `src/app/preview/v3/_components/pdp/buy-box.tsx`
- Create: `src/app/preview/v3/product/[slug]/page.tsx`
- Create: `src/app/preview/v3/product/[slug]/pdp-client.tsx`

- [ ] **Step 1: Create `page.tsx`** — mirror `src/app/product/[slug]/page.tsx` exactly: `generateMetadata`, `getProduct`, `getRelatedProducts(product.id, product.category_slug, 8)`, build the same JSON-LD `Product` object (offers/aggregateRating/brand), canonical `/preview/v3/product/{slug}`, render `<script type="application/ld+json">` + `<PDPClient product related />`. No `MMShell`.
- [ ] **Step 2: Implement `product-gallery.tsx`** — client. Props `{ images: Product["images"]; name: string }`. Main `next/image` (priority, explicit dims) + thumbnail strip; click swaps main. Keyboard accessible (arrow keys, real buttons). No zoom-lib, no parallax.
- [ ] **Step 3: Implement `size-selector.tsx`** — client. Props `{ sizes: string[]; value: string | null; onChange(s: string): void }`. Size **chips** (real `<button>`s, not only dropdown), selected state, focus ring. Sizes derived from `product.specs` size field if present, else a documented fallback set with a `display-only` note.
- [ ] **Step 4: Implement `buy-box.tsx`** — client. Sticky (desktop) box: brand · `<h1>` name · SKU · rating placeholder (only if `average_rating != null`) · `PriceDisplay` + saving · key `Badge`s from `certification`/`specs` (ECE/Pinlock/sun visor/Bluetooth only when present) · `SizeSelector` · size-guide link · availability by selected size (`AvailabilityBadge`) · delivery estimate line · returns/exchange reassurance line · **strong** `v3-btn-primary` `Προσθήκη στο καλάθι` calling `useV3().addToCart` (disabled when `stock===0`) · trust row (secure payments / returns / official dealer). 
- [ ] **Step 5: Implement `pdp-client.tsx`** — client. Above fold: breadcrumbs · `ProductGallery` · `BuyBox`. Below fold: tabs/accordions Περιγραφή · Πίνακας χαρακτηριστικών (`product.specs`) · Πιστοποιήσεις · Αποστολή/Επιστροφές · related grid (`ProductCard[]`) `Παρόμοια κράνη`. No unverified claims.
- [ ] **Step 6: Checkpoint**

Run: `npx tsc --noEmit`, `npm run lint`, dev a real product URL `/preview/v3/product/{slug}` (pick a slug from the PLP grid in Task 10).
Expected: HTTP 200, gallery swaps, size chips selectable, add-to-cart updates header cart count, JSON-LD present in DOM, disabled CTA when stock 0.

---

## Task 12: QA + scope verification

**Files:** none (verification only)

- [ ] **Step 1: Static gates**

Run: `npx tsc --noEmit` && `npm run lint` && `npm run test`
Expected: all clean; helper tests (Tasks 2–3) pass.

- [ ] **Step 2: Production-build sanity**

Run: `npm run build`
Expected: build succeeds, `/preview/v3`, `/preview/v3/category/[slug]`, `/preview/v3/product/[slug]` listed, no `revalidate` errors.

- [ ] **Step 3: Manual matrix** — for each of the 3 screens, check desktop (1440) + mobile (375): no horizontal scroll, chrome consistent, images no CLS, keyboard nav + focus visible, `prefers-reduced-motion` honored.

- [ ] **Step 4: Performance check** — if Lighthouse CLI is available, run mobile audit on `/preview/v3`. Record Performance/LCP/CLS/INP vs PRD §7 targets (90+/<2.5s/<0.1/<200ms). Report numbers; do not claim a win without the number.

- [ ] **Step 5: Scope verification**

Run: `gitnexus_detect_changes()`
Expected: all changes are new files under `src/app/preview/v3/` (+ this plan/spec doc). No production route or query-layer symbol modified. Report the affected-scope summary to Chris.

- [ ] **Step 6: Handoff** — summarize for Chris: 3 screens live at `/preview/v3/*`, production untouched, build/lint/tsc/tests green, Lighthouse numbers, what is display-only (filters/my-bike/sizes lacking DB backing), recommended next step (swap to production after visual approval).

---

## Self-Review

- **Spec coverage:** Tokens (T1) · helpers/tests (T2–3) · shell+nav+footer (T4) · cards/price/availability/badges (T5) · trust (T6) · all 10 homepage sections (T7–9) · PLP filters/sort/url/cards/mobile drawer (T10) · PDP gallery/buybox/size/JSON-LD/related (T11) · SEO via mirrored metadata+JSON-LD+canonical (T10–11) · a11y + reduced-motion (tokens + each component step) · perf gates (T12) · non-goals excluded (no checkout/account/auth/Odoo). All PRD §12–16 + §21 DoD items mapped.
- **Placeholder scan:** No "TBD/handle edge cases/similar to Task N". Unknown slugs are explicit *resolve* steps (T7.4, T10.5) with a documented non-invented fallback, not placeholders.
- **Type consistency:** `PlpState`, `CartLine`, `useV3` signature, `ProductListItem`/`Product` query types used identically across T3–T11. `formatPrice/hasDiscount/discountPercent` names match between T2 and T5/T11.
