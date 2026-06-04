# Track D1 — Storefront Presentation Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the canonical clean URL (`[locale]/[...path]`) serve the modern v3 presentation, turn the prefixed alias routes into permanent redirectors, point every internal link at the clean URL, and retire the legacy `src/components` PDP/PLP — without regressing the Next.js 16 per-request render that fixed the product-page 404 outage.

**Architecture:** Today the canonical catch-all renders PDP/PLP *inline* using ~14 legacy `src/components/*` imports, while the better v3 `_components` presentation is stuck on the prefixed `(store)/product/[slug]` & `category/[slug]` routes (which wrongly declare themselves canonical). We invert this: extract the v3 rendering into two **route-agnostic server components** (`_components/pdp/product-view.tsx`, `_components/plp/category-view.tsx`), call them from the catch-all, convert the prefixed routes to `permanentRedirect` to the clean URL, and rewrite the prefixed-form internal links (`/product/…`, `/category/…`) to clean form. A small pure URL module is the tested seam for clean-link construction.

**Tech Stack:** Next.js 16 (App Router, Cache Components, `await searchParams` per-request render), React 19 server/client components, Supabase (admin client in cached query layer), next-intl (`@/i18n/navigation`), Vitest (node env, `*.test.ts` only — **no DOM/React-render tests**).

**Scope:** This is **Track D1 only** (PRD stories 22–27). The server-backed cart + Guest→User merge (stories 28–29, "D2") is explicitly out of scope and will get its own brainstorm + plan.

**Mandatory gates (per `AGENTS.md`/`CLAUDE.md`):** run `gitnexus_impact({target, direction:"upstream"})` before editing/deleting any symbol; run `gitnexus_detect_changes()` before every commit; put impact evidence in the PR body. Stage explicit paths only — never `git add -A` (worktree carries unrelated untracked junk + auto-counted `AGENTS.md`/`CLAUDE.md` edits).

---

## File Structure

**New files**
- `src/app/[locale]/(store)/_lib/urls.ts` — pure clean-URL builders (`productPath`, `categoryPath`). The single home for clean-URL construction.
- `src/app/[locale]/(store)/_lib/urls.test.ts` — unit tests for the builders.
- `src/app/[locale]/(store)/_components/pdp/product-view.tsx` — route-agnostic PDP server component (fetch product+related, JSON-LD, render `PDPClient`).
- `src/app/[locale]/(store)/_components/plp/category-view.tsx` — route-agnostic PLP server component (fetch category+products+filters+subcats, render `PLPClient`).
- `src/app/[locale]/(store)/product/[slug]/redirect-target.ts` — pure resolver returning the canonical clean path for a product slug (tested).
- `src/app/[locale]/(store)/product/[slug]/redirect-target.test.ts`
- `src/app/[locale]/(store)/category/[slug]/redirect-target.ts` — pure resolver for a category slug (tested).
- `src/app/[locale]/(store)/category/[slug]/redirect-target.test.ts`

**Modified files**
- `src/lib/queries/products.ts` — add `category_path` to `Product` & `ProductListItem`; populate it in `getProduct` + all 5 list mappers.
- `src/lib/queries/products.test.ts` *(new test file, co-located)* — assert `getProduct` maps `category_path`.
- `src/app/[locale]/(store)/_components/commerce/product-card.tsx` — clean product href.
- `src/app/[locale]/(store)/product/[slug]/pdp-client.tsx` — clean breadcrumb category href.
- `src/app/[locale]/(store)/category/[slug]/plp-client.tsx` — clean `basePath`, subcategory chips, pagination.
- `src/app/[locale]/[...path]/page.tsx` — render the v3 views; drop legacy PDP/PLP imports and inline `ProductView`/`CategoryView`.
- `src/app/[locale]/(store)/product/[slug]/page.tsx` — becomes a thin `permanentRedirect` to clean URL; drop self-canonical metadata.
- `src/app/[locale]/(store)/category/[slug]/page.tsx` — same.
- Internal-link files (Task 9): `_components/shell/{header,footer,mega-menu,cart-panel}.tsx`, `_components/home/{hero,editorial-band,race-control-panel,offers-section,category-shortcut-grid}.tsx`.

**Deleted files (Task 10, each gated individually)** — candidates in `src/components/product/*` and `src/components/cart/add-to-cart-button.tsx`. **Keep** `src/components/product/product-grid.tsx` (used by `bikes/[slug]` + campaigns `product-rail`) and `src/components/product/product-card.tsx` (used by `product-grid`).

---

## Task 1: Pure clean-URL builders

**Files:**
- Create: `src/app/[locale]/(store)/_lib/urls.ts`
- Test: `src/app/[locale]/(store)/_lib/urls.test.ts`

Clean canonical forms (ADR 0002): product = `/{category_full_path}/{slug}`, category = `/{category_full_path}`. These are **locale-agnostic** (the `@/i18n/navigation` `Link`/`redirect`/`useRouter` add the locale prefix). Always return a leading-slash path with no trailing slash. Fall back gracefully when the full path is missing (older rows): a product with no category path resolves to `/{slug}` (the catch-all then 301s it to canonical).

- [ ] **Step 1: Write the failing test**

```ts
// src/app/[locale]/(store)/_lib/urls.test.ts
import { describe, it, expect } from "vitest";
import { productPath, categoryPath } from "./urls";

describe("categoryPath", () => {
  it("builds a clean category path from full_path", () => {
    expect(categoryPath("eksoplismos-anabath/endysh/mpoyfan")).toBe(
      "/eksoplismos-anabath/endysh/mpoyfan",
    );
  });
  it("handles a root category (full_path === slug)", () => {
    expect(categoryPath("prosfores")).toBe("/prosfores");
  });
  it("strips a leading slash if one is passed in", () => {
    expect(categoryPath("/endysh")).toBe("/endysh");
  });
});

describe("productPath", () => {
  it("builds a clean product path under its category full_path", () => {
    expect(productPath("eksoplismos-anabath/endysh", "abudisloc30")).toBe(
      "/eksoplismos-anabath/endysh/abudisloc30",
    );
  });
  it("falls back to /{slug} when category path is null", () => {
    expect(productPath(null, "abudisloc30")).toBe("/abudisloc30");
  });
  it("falls back to /{slug} when category path is empty", () => {
    expect(productPath("", "abudisloc30")).toBe("/abudisloc30");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run "src/app/[locale]/(store)/_lib/urls.test.ts"`
Expected: FAIL — cannot find module `./urls`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/[locale]/(store)/_lib/urls.ts

/** Strip leading/trailing slashes so segments join cleanly. */
function trim(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

/**
 * Clean canonical category URL (ADR 0002): `/{full_path}`.
 * `fullPath` is the category's hierarchical `full_path` (roots: == slug).
 * Locale-agnostic — the i18n Link/redirect adds the locale prefix.
 */
export function categoryPath(fullPath: string): string {
  return `/${trim(fullPath)}`;
}

/**
 * Clean canonical product URL (ADR 0002): `/{category_full_path}/{slug}`.
 * When the category path is unknown, fall back to `/{slug}`; the catch-all
 * then 301-redirects it to the canonical path.
 */
export function productPath(
  categoryFullPath: string | null | undefined,
  slug: string,
): string {
  const cat = categoryFullPath ? trim(categoryFullPath) : "";
  return cat ? `/${cat}/${slug}` : `/${slug}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run "src/app/[locale]/(store)/_lib/urls.test.ts"`
Expected: PASS (9 assertions).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(store)/_lib/urls.ts" "src/app/[locale]/(store)/_lib/urls.test.ts"
git commit -m "feat(storefront): add pure clean-URL builders (Track D1)"
```

---

## Task 2: Add `category_path` to the product data layer

**Files:**
- Modify: `src/lib/queries/products.ts` (types `Product` line 33-54, `ProductListItem` line 56-74; `getProduct` select line 178-191 + mapping line 199-251; mappers in `getProductsByCategory`, `searchProducts`, `getRelatedProducts`, `getProductsByIds`, `getProductsByBrand`)
- Test: `src/lib/queries/products.test.ts` (new, co-located)

**Why:** clean product URLs (Task 3) and the PDP breadcrumb (Task 4) and the product redirector (Task 8) all need the category `full_path`, which the product queries don't currently return. The `Category` type already has `full_path`; products must carry it too as `category_path`.

**Impact gate:** before editing, run `gitnexus_impact({target:"getProduct", direction:"upstream"})` and `gitnexus_impact({target:"getProductsByCategory", direction:"upstream"})`; report blast radius. These are widely-used — expect MEDIUM/HIGH; the change is purely additive (a new optional-to-callers field), so existing callers keep working.

- [ ] **Step 1: Write the failing test** (data contract for `getProduct`)

```ts
// src/lib/queries/products.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// getProduct dynamically imports the admin client; mock that module.
const maybeSingle = vi.fn();
const eq2 = vi.fn(() => ({ maybeSingle }));
const eq1 = vi.fn(() => ({ eq: eq2 }));
const select = vi.fn(() => ({ eq: eq1 }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from }),
}));

describe("getProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps the joined category full_path to product.category_path", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        id: "p1",
        slug: "abudisloc30",
        name: "Test Jacket",
        description: null,
        price: 100,
        compare_at_price: null,
        sku: "SKU1",
        stock: 5,
        certification: null,
        rider_type: null,
        specs: {},
        images: [],
        view_count: 0,
        average_rating: null,
        review_count: 0,
        created_at: "2026-01-01",
        brands: { name: "Acme", slug: "acme" },
        categories: {
          slug: "endysh",
          name: "Ένδυση",
          full_path: "eksoplismos-anabath/endysh",
        },
      },
      error: null,
    });

    const { getProduct } = await import("./products");
    const product = await getProduct("abudisloc30", "en");

    expect(product?.category_path).toBe("eksoplismos-anabath/endysh");
    expect(product?.category_slug).toBe("endysh");
  });
});
```

> Note: `getProduct` short-circuits for `locale === "en"` (no translation lookup), so the single mocked query suffices. Keep the chain mock minimal — it only needs to satisfy `.from().select().eq().eq().maybeSingle()`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/queries/products.test.ts`
Expected: FAIL — `category_path` is `undefined` (not yet mapped).

- [ ] **Step 3: Add `category_path` to the types**

In `src/lib/queries/products.ts`, add to `Product` (after `category_name: string;`, line 43):

```ts
  category_name: string;
  category_path: string | null;
```

Add to `ProductListItem` (after `category_slug: string;`, line 64):

```ts
  category_slug: string;
  category_path: string | null;
```

- [ ] **Step 4: Populate it in `getProduct`**

Change the `getProduct` select (line 186) to also fetch `full_path`:

```ts
      brands ( name, slug ),
      categories ( slug, name, full_path )
```

Change the `cat` cast (line 200-203) and the mapping (line 239-240):

```ts
  const cat = data.categories as unknown as {
    slug: string;
    name: string;
    full_path: string | null;
  } | null;
```

```ts
    category_slug: cat?.slug ?? "",
    category_name: cat?.name ?? "",
    category_path: cat?.full_path ?? null,
```

- [ ] **Step 5: Populate it in every list mapper**

For **`getProductsByCategory`** the select already joins `categories!inner ( slug, full_path )` (line 305) — only the cast + mapping change. Update the `c` cast (line 357) and add to the returned object (after `category_slug`, line 369):

```ts
    const c = row.categories as unknown as {
      slug: string;
      full_path: string | null;
    } | null;
```
```ts
      category_slug: c?.slug ?? categorySlug,
      category_path: c?.full_path ?? null,
```

For **`searchProducts`** (select line 426), **`getRelatedProducts`** (select line 609), **`getProductsByIds`** (select line 675), **`getProductsByBrand`** (select line 748): change each `categories ( slug )` to `categories ( slug, full_path )`, change each `c`/category cast to include `full_path: string | null`, and add `category_path: c?.full_path ?? null,` immediately after the `category_slug:` line in each mapper (lines 458, 637, 700, 770 respectively).

- [ ] **Step 6: Run test + typecheck**

Run: `pnpm vitest run src/lib/queries/products.test.ts && pnpm typecheck`
Expected: PASS; typecheck clean (no caller breaks — field is additive).

- [ ] **Step 7: `detect_changes` + commit**

Run `gitnexus_detect_changes()` and confirm only the products query symbols changed.

```bash
git add src/lib/queries/products.ts src/lib/queries/products.test.ts
git commit -m "feat(queries): expose category_path on Product and ProductListItem (Track D1)"
```

---

## Task 3: ProductCard emits clean product URLs

**Files:**
- Modify: `src/app/[locale]/(store)/_components/commerce/product-card.tsx` (href at line 38; also occurrences at 136, 174, 184, 212 — all derive from the same `href` const if present, verify each)

**Impact gate:** `gitnexus_impact({target:"ProductCard", direction:"upstream"})` — it's rendered by PLP, PDP related-rail, search, campaigns. Change is internal (href only); no prop/signature change → LOW risk.

- [ ] **Step 1: Read the current href construction**

Open the file; line 38 currently: `const href = `/product/${product.slug}`;`. Confirm lines 136/174/184/212 reuse `href` (not a second hard-coded prefixed string). If any re-construct `/product/...`, replace them with the `href` const too.

- [ ] **Step 2: Replace with the clean builder**

Add import (top of file, with the other imports):

```ts
import { productPath } from "../../_lib/urls";
```

Replace line 38:

```ts
  const href = productPath(product.category_path, product.slug);
```

`product` is a `ProductListItem`, which now carries `category_path` (Task 2). The `Link` from `@/i18n/navigation` adds the locale prefix.

- [ ] **Step 3: Verify typecheck + build**

Run: `pnpm typecheck`
Expected: PASS. (No unit test — component rendering isn't supported in this node-env test infra; the URL logic is covered by `urls.test.ts`. Behavior is verified live in Task 11.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(store)/_components/commerce/product-card.tsx"
git commit -m "feat(storefront): product cards link to clean canonical URLs (Track D1)"
```

---

## Task 4: PDPClient breadcrumb uses the clean category URL

**Files:**
- Modify: `src/app/[locale]/(store)/product/[slug]/pdp-client.tsx` (breadcrumb link line 29)

The breadcrumb currently links `/category/${product.category_slug}` (prefixed). The PDP renders for a single `Product`, which now has `category_path`.

- [ ] **Step 1: Add the import**

```ts
import { categoryPath } from "../../_lib/urls";
```

- [ ] **Step 2: Replace the breadcrumb href (line 29)**

```tsx
        <Link href={product.category_path ? categoryPath(product.category_path) : `/${product.category_slug}`}>
          {product.category_name}
        </Link>
```

(The fallback to `/${category_slug}` 301s to canonical via the catch-all if a row lacks `full_path`.)

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(store)/product/[slug]/pdp-client.tsx"
git commit -m "feat(storefront): PDP breadcrumb links to clean category URL (Track D1)"
```

---

## Task 5: PLPClient uses clean basePath, subcategory chips, and pagination

**Files:**
- Modify: `src/app/[locale]/(store)/category/[slug]/plp-client.tsx` (basePath line 47; subcategory chip hrefs line 99; the `subcategories` prop shape line 24)
- Modify: `src/app/[locale]/(store)/category/[slug]/page.tsx` (the props it passes — lines 79-93) *(temporary; this route becomes a redirector in Task 8, but Task 6's `CategoryView` reuses `PLPClient` so the prop contract must be clean-URL based now)*

**Why:** `PLPClient` drives filter/sort/pagination navigation via `router.push(basePath + query)`. If `basePath` stays `/category/${slug}` while the page is served at the clean URL, every filter click bounces through a 301 — janky and wrong. `basePath` must be the **clean** category path, and subcategory chips must link to **clean** child paths.

- [ ] **Step 1: Change the `subcategories` prop to carry the clean path**

In `PLPClientProps` (line 24), change:

```ts
  subcategories: { slug: string; name: string }[];
```
to:
```ts
  subcategories: { path: string; name: string }[];
```

- [ ] **Step 2: Accept an explicit clean `basePath` prop**

Add to `PLPClientProps` (after `slug: string;`, line 21):

```ts
  slug: string;
  basePath: string;
```

Destructure it in the component params (line 33-44 list) and **remove** the line that derives it (line 47):

```ts
  // delete: const basePath = `/category/${slug}`;
```

(`basePath` now comes from props. `slug` is still used elsewhere? It is only used to build `basePath` today — if no other use remains after this change, remove `slug` from props and destructuring too. Verify with a search within the file before removing.)

- [ ] **Step 3: Use the clean subcategory path (line 97-104)**

```tsx
          {subcategories.map((s) => (
            <Link key={s.path} href={s.path} className="v3-plp-chip">
              {s.name}
            </Link>
          ))}
```

(Pagination at lines 156-173 already uses `basePath + buildPlpQuery(...)`, so it becomes clean automatically once `basePath` is clean. No change needed there.)

- [ ] **Step 4: Update the category route to pass clean values (temporary)**

In `src/app/[locale]/(store)/category/[slug]/page.tsx`, update the `PLPClient` call (lines 78-94). Add the import:

```ts
import { categoryPath } from "../../_lib/urls";
```

Change the props passed:

```tsx
    <PLPClient
      slug={slug}
      basePath={cat.full_path ? categoryPath(cat.full_path) : `/${slug}`}
      title={cat.name}
      seoIntro={cat.seo_intro ?? cat.description}
      subcategories={subcats.map((s) => ({
        path: s.full_path ? categoryPath(s.full_path) : `/${s.slug}`,
        name: s.name,
      }))}
      filters={filters}
      state={state}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
    >
```

(`cat` is a `Category` with `full_path`; `subcats` are `Category[]` with `full_path` — both already available, see `getCategory`/`getSubcategories`.)

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(store)/category/[slug]/plp-client.tsx" "src/app/[locale]/(store)/category/[slug]/page.tsx"
git commit -m "feat(storefront): PLP navigation uses clean category URLs (Track D1)"
```

---

## Task 6: Extract route-agnostic v3 PDP & PLP server components

**Files:**
- Create: `src/app/[locale]/(store)/_components/pdp/product-view.tsx`
- Create: `src/app/[locale]/(store)/_components/plp/category-view.tsx`
- Modify: `src/app/[locale]/(store)/product/[slug]/page.tsx` (render `<ProductView slug locale />`)
- Modify: `src/app/[locale]/(store)/category/[slug]/page.tsx` (render `<CategoryView slug locale searchParams />`)

**Why:** the v3 fetch+render logic currently lives inside the prefixed route files. To render it from the catch-all too, move it into route-agnostic server components that take a `slug` (+ locale, + searchParams for PLP) and own the fetch→render. The prefixed routes (until Task 8 turns them into redirectors) and the catch-all (Task 7) both call these. **`await searchParams` must remain on the caller path that the catch-all uses — Task 7 keeps the catch-all's existing `await searchParams`; these view components do not need to re-await it.**

- [ ] **Step 1: Create `ProductView` (server component)** — body adapted from `product/[slug]/page.tsx` `V3ProductPageContent` (lines 41-108), minus the `await searchParams` (the caller owns request-time reads) and minus `notFound` behavior choice (keep `notFound()` so a missing product 404s correctly).

```tsx
// src/app/[locale]/(store)/_components/pdp/product-view.tsx
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getProduct, getRelatedProducts } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";
import { PDPClient } from "../../product/[slug]/pdp-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export async function ProductView({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
  const product = await getProduct(slug, locale);
  if (!product) notFound();

  const relatedAll = await getRelatedProducts(
    product.id,
    product.category_slug,
    8,
    locale,
  );
  const related = relatedAll.filter((p) => p.slug !== product.slug).slice(0, 4);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    image: product.images.map((i) => i.url),
    description: product.description ?? product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    aggregateRating: product.average_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.average_rating,
          reviewCount: product.review_count,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}${product.category_path ? `/${product.category_path}` : ""}/${product.slug}`,
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <PDPClient
        product={product}
        related={related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      />
    </>
  );
}
```

(Note: the JSON-LD `offers.url` now emits the **clean** canonical URL instead of the old `/product/${slug}`.)

- [ ] **Step 2: Create `CategoryView` (server component)** — body adapted from `category/[slug]/page.tsx` `V3CategoryPageContent` (lines 46-94). It receives the already-awaited `searchParams` object (the catch-all awaits it; the prefixed route awaits and passes it).

```tsx
// src/app/[locale]/(store)/_components/plp/category-view.tsx
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getCategory, getSubcategories } from "@/lib/queries/categories";
import {
  getProductFilters,
  getProductsByCategory,
} from "@/lib/queries/products";
import { parsePlpParams } from "../../_lib/plp-params";
import { categoryPath } from "../../_lib/urls";
import { ProductCard } from "../commerce/product-card";
import { PLPClient } from "../../category/[slug]/plp-client";

type SearchParams = Record<string, string | string[] | undefined>;

export async function CategoryView({
  slug,
  locale,
  searchParams,
}: {
  slug: string;
  locale: Locale;
  searchParams: SearchParams;
}) {
  const cat = await getCategory(slug, locale);
  if (!cat) notFound();

  const state = parsePlpParams(searchParams);

  const [result, filters, subcats] = await Promise.all([
    getProductsByCategory(
      {
        categorySlug: slug,
        page: state.page,
        perPage: 24,
        sort: state.sort,
        brands: state.brands.length ? state.brands : undefined,
        priceMin: state.priceMin,
        priceMax: state.priceMax,
      },
      locale,
    ),
    getProductFilters(slug),
    getSubcategories(slug, locale),
  ]);

  return (
    <PLPClient
      slug={slug}
      basePath={cat.full_path ? categoryPath(cat.full_path) : `/${slug}`}
      title={cat.name}
      seoIntro={cat.seo_intro ?? cat.description}
      subcategories={subcats.map((s) => ({
        path: s.full_path ? categoryPath(s.full_path) : `/${s.slug}`,
        name: s.name,
      }))}
      filters={filters}
      state={state}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
    >
      {result.data.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </PLPClient>
  );
}
```

- [ ] **Step 3: Point the prefixed routes at the extracted views** (interim — proves the extraction renders identically before Task 7/8).

`product/[slug]/page.tsx` `V3ProductPageContent` body becomes:

```tsx
async function V3ProductPageContent({ params, searchParams }: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  await searchParams; // keep per-request render (Next 16 Cache Components)
  return <ProductView slug={slug} locale={locale} />;
}
```
Add `import { ProductView } from "../../_components/pdp/product-view";`, and remove the now-unused imports (`getProduct`/`getRelatedProducts`/`ProductCard`/`PDPClient`/`BASE_URL`) **only if** `generateMetadata` no longer needs them — `generateMetadata` still calls `getProduct`, so keep that import. Remove `getRelatedProducts`, `ProductCard`, `PDPClient`, `BASE_URL` if unreferenced after the edit (verify with a search).

`category/[slug]/page.tsx` `V3CategoryPageContent` body becomes:

```tsx
async function V3CategoryPageContent({ params, searchParams }: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  return <CategoryView slug={slug} locale={locale} searchParams={sp} />;
}
```
Add `import { CategoryView } from "../../_components/plp/category-view";`, remove now-unused imports (`getCategory` is still used by `generateMetadata` — keep; remove `getSubcategories`, `getProductFilters`, `getProductsByCategory`, `parsePlpParams`, `ProductCard`, `PLPClient` if unreferenced).

- [ ] **Step 4: Verify typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. Build must not reopen the 404 (per-request render preserved).

- [ ] **Step 5: `detect_changes` + commit**

```bash
git add "src/app/[locale]/(store)/_components/pdp/product-view.tsx" "src/app/[locale]/(store)/_components/plp/category-view.tsx" "src/app/[locale]/(store)/product/[slug]/page.tsx" "src/app/[locale]/(store)/category/[slug]/page.tsx"
git commit -m "refactor(storefront): extract route-agnostic v3 ProductView/CategoryView (Track D1)"
```

---

## Task 7: Catch-all renders the v3 presentation

**Files:**
- Modify: `src/app/[locale]/[...path]/page.tsx` — replace inline legacy `ProductView` (lines 248-390), `RelatedProductsSection` (392-412), and `CategoryView` (417-500) with calls to the v3 server components; delete the legacy `src/components/*` PDP/PLP imports (lines 36-53, keeping only what's still referenced).

**Impact gate:** `gitnexus_impact({target:"CatchAllContent", direction:"upstream"})` and review the route's processes. This is the storefront switch — **HIGH/structural**; per graduated autonomy this requires the user's explicit go-ahead before merge. Preserve **exactly**: `generateStaticParams` (lines 60-69), `resolvePath` (84-133), `await searchParams` (line 198), and the non-canonical→canonical `redirect` (lines 204-209). These are load-bearing for the Next 16 Cache Components 404 fix and canonical behavior.

- [ ] **Step 1: Replace the render branches in `CatchAllContent`** (lines 203-226)

```tsx
  if (resolved.kind === "product") {
    const currentPath = segments.join("/");
    const canonical = resolved.canonicalPath.join("/");
    if (currentPath !== canonical && resolved.canonicalPath.length > 1) {
      redirect({ href: `/${canonical}`, locale });
    }
    return <ProductView slug={resolved.productSlug} locale={locale} />;
  }

  // category
  return (
    <CategoryView fullPath={resolved.fullPath} searchParams={sp} locale={locale} />
  );
```

**Wait — interface mismatch:** the catch-all resolves a category by **full_path**, but `CategoryView` (Task 6) takes a **slug**. Add a slug to the resolver's category result so we don't double-resolve. In `resolvePath`, the category branch (lines 127-130) already has the `Category` object from `getCategoryByPath`; change the `Resolved` category variant (line 81) and the return (line 129) to carry the slug:

```ts
  | { kind: "category"; categoryId: string; categorySlug: string; fullPath: string }
```
```ts
  if (category) {
    return { kind: "category", categoryId: category.id, categorySlug: category.slug, fullPath };
  }
```

Then render `CategoryView` by slug:

```tsx
  return (
    <CategoryView slug={resolved.categorySlug} searchParams={sp} locale={locale} />
  );
```

- [ ] **Step 2: Swap the imports**

Add:
```ts
import { ProductView } from "@/app/[locale]/(store)/_components/pdp/product-view";
import { CategoryView } from "@/app/[locale]/(store)/_components/plp/category-view";
```
Delete the inline functions `ProductView` (248-390), `RelatedProductsSection` (392-412), `CategoryView` (417-500). Delete the legacy PDP/PLP imports that were only used by them (lines 37-52: `ImageGallery`, `PriceDisplay`, `StockBadge`, `CertificationBadge`, `RatingStars`, `ProductGrid`, `VariantSelector`, `AddToCartButton`, `SpecificationsTable`, `DeliveryEstimate`, `KlarnaInfo`, `ProductJsonLd`, `MobileCtaBar`, `CategoryHeader`, `FilterSidebar`, `SortDropdown`, and `Pagination` line 53, and `Breadcrumbs` line 36) **if** unreferenced after deletion. Keep `getProduct`/`getRelatedProducts`/`getProductsByCategory`/`getProductFilters`/`getPopularProductSlugs`/`getCategoryByPath`/`createClient`/`buildAlternates` only as still used by `resolvePath`/`generateMetadata`/`generateStaticParams` — verify each import with a search; remove orphans.

- [ ] **Step 3: Verify typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. The catch-all now renders v3 on clean URLs.

- [ ] **Step 4: `detect_changes` + commit**

```bash
git add "src/app/[locale]/[...path]/page.tsx"
git commit -m "feat(storefront): canonical clean URL renders v3 presentation (Track D1)"
```

---

## Task 8: Prefixed routes become permanent redirectors

**Files:**
- Create: `src/app/[locale]/(store)/product/[slug]/redirect-target.ts` + `.test.ts`
- Create: `src/app/[locale]/(store)/category/[slug]/redirect-target.ts` + `.test.ts`
- Modify: `src/app/[locale]/(store)/product/[slug]/page.tsx` (replace render with redirect; drop self-canonical metadata)
- Modify: `src/app/[locale]/(store)/category/[slug]/page.tsx` (same)

**Decision (ADR 0002 says "301"):** Next App Router has no first-class 301 from a server component; `permanentRedirect()` issues **308** (permanent, method-preserving), which Google treats equivalently to 301 for canonical consolidation. We use `permanentRedirect` from `@/i18n/navigation` (locale-aware). The redirect-behavior test asserts the **target path** (the SEO-meaningful part), which is what the PRD's "what URL a request redirects to" testing guidance targets.

- [ ] **Step 1: Write the failing product-resolver test**

```ts
// src/app/[locale]/(store)/product/[slug]/redirect-target.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getProduct = vi.fn();
vi.mock("@/lib/queries/products", () => ({ getProduct }));

describe("productRedirectTarget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the clean canonical path for a product", async () => {
    getProduct.mockResolvedValueOnce({
      slug: "abudisloc30",
      category_path: "eksoplismos-anabath/endysh",
    });
    const { productRedirectTarget } = await import("./redirect-target");
    expect(await productRedirectTarget("abudisloc30", "el")).toBe(
      "/eksoplismos-anabath/endysh/abudisloc30",
    );
  });

  it("returns null when the product does not exist", async () => {
    getProduct.mockResolvedValueOnce(null);
    const { productRedirectTarget } = await import("./redirect-target");
    expect(await productRedirectTarget("nope", "el")).toBeNull();
  });
});
```

- [ ] **Step 2: Run → fails (module missing). Then implement:**

```ts
// src/app/[locale]/(store)/product/[slug]/redirect-target.ts
import type { Locale } from "@/i18n/config";
import { getProduct } from "@/lib/queries/products";
import { productPath } from "../../_lib/urls";

/** Canonical clean path for a product slug, or null if it doesn't exist. */
export async function productRedirectTarget(
  slug: string,
  locale: Locale,
): Promise<string | null> {
  const product = await getProduct(slug, locale);
  if (!product) return null;
  return productPath(product.category_path, product.slug);
}
```

Run: `pnpm vitest run "src/app/[locale]/(store)/product/[slug]/redirect-target.test.ts"` → PASS.

- [ ] **Step 3: Category resolver — test then implement**

```ts
// src/app/[locale]/(store)/category/[slug]/redirect-target.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCategory = vi.fn();
vi.mock("@/lib/queries/categories", () => ({ getCategory }));

describe("categoryRedirectTarget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the clean canonical path for a category", async () => {
    getCategory.mockResolvedValueOnce({
      slug: "endysh",
      full_path: "eksoplismos-anabath/endysh",
    });
    const { categoryRedirectTarget } = await import("./redirect-target");
    expect(await categoryRedirectTarget("endysh", "el")).toBe(
      "/eksoplismos-anabath/endysh",
    );
  });

  it("returns null when the category does not exist", async () => {
    getCategory.mockResolvedValueOnce(null);
    const { categoryRedirectTarget } = await import("./redirect-target");
    expect(await categoryRedirectTarget("nope", "el")).toBeNull();
  });
});
```

```ts
// src/app/[locale]/(store)/category/[slug]/redirect-target.ts
import type { Locale } from "@/i18n/config";
import { getCategory } from "@/lib/queries/categories";
import { categoryPath } from "../../_lib/urls";

/** Canonical clean path for a category slug, or null if it doesn't exist. */
export async function categoryRedirectTarget(
  slug: string,
  locale: Locale,
): Promise<string | null> {
  const cat = await getCategory(slug, locale);
  if (!cat?.full_path) return null;
  return categoryPath(cat.full_path);
}
```

Run both resolver tests → PASS.

- [ ] **Step 4: Replace `product/[slug]/page.tsx` with a redirector**

Replace the entire file with:

```tsx
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { productRedirectTarget } from "./redirect-target";

// Legacy prefixed alias → 308 permanent redirect to the canonical clean URL
// (ADR 0002). No metadata: a redirector must not declare itself canonical.
export default async function LegacyProductRedirect({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const target = await productRedirectTarget(slug, locale);
  if (!target) notFound();
  permanentRedirect({ href: target, locale });
}
```

Delete `pdp-client.tsx`? **No** — `pdp-client.tsx` is still imported by `_components/pdp/product-view.tsx` (Task 6). Keep it. (Its location under the route folder is fine; moving it is out of scope.)

- [ ] **Step 5: Replace `category/[slug]/page.tsx` with a redirector**

```tsx
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { categoryRedirectTarget } from "./redirect-target";

export default async function LegacyCategoryRedirect({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const target = await categoryRedirectTarget(slug, locale);
  if (!target) notFound();
  permanentRedirect({ href: target, locale });
}
```

Keep `plp-client.tsx` — imported by `_components/plp/category-view.tsx`.

> **Verify `permanentRedirect` is exported by `@/i18n/navigation`.** Open `src/i18n/navigation.ts`: it wraps `createNavigation` from next-intl, which exports `permanentRedirect`. If it is not re-exported there, import `permanentRedirect` from `next/navigation` and prepend the locale manually (`/${locale}${target}` for non-default locale). Confirm before writing.

- [ ] **Step 6: Run tests + typecheck + build**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: PASS. Prefixed routes 308 → clean; catch-all renders v3.

- [ ] **Step 7: `detect_changes` + commit**

```bash
git add "src/app/[locale]/(store)/product/[slug]/page.tsx" "src/app/[locale]/(store)/product/[slug]/redirect-target.ts" "src/app/[locale]/(store)/product/[slug]/redirect-target.test.ts" "src/app/[locale]/(store)/category/[slug]/page.tsx" "src/app/[locale]/(store)/category/[slug]/redirect-target.ts" "src/app/[locale]/(store)/category/[slug]/redirect-target.test.ts"
git commit -m "feat(storefront): prefixed routes 308-redirect to clean canonical URLs (Track D1)"
```

---

## Task 9: Rewrite internal prefixed links to clean form

**Files (from the exploration map):**
- `_components/shell/mega-menu.tsx:81` — `/category/prosfores` → `/prosfores`
- `_components/shell/header.tsx:58` — `/category/prosfores` → `/prosfores`
- `_components/shell/cart-panel.tsx:107` — `/category/eksoplismos-anabath` → `/eksoplismos-anabath`
- `_components/shell/footer.tsx:54` — `/category/${root.slug}` → `/${root.slug}`
- `_components/home/category-shortcut-grid.tsx:66` — `/category/eksoplismos-anabath` → `/eksoplismos-anabath`
- `_components/home/editorial-band.tsx:31` — `/category/eksoplismos-anabath` → `/eksoplismos-anabath`
- `_components/home/race-control-panel.tsx:111` — `/category/eksoplismos-anabath` → `/eksoplismos-anabath`
- `_components/home/hero.tsx:87,93` — `/category/eksoplismos-anabath…` → `/eksoplismos-anabath…`
- `_components/home/offers-section.tsx:23` — `/category/prosfores` → `/prosfores`

**Why clean = `/{slug}` here:** every hard-coded target is a **root** category, whose `full_path` equals its `slug`, so the clean URL is simply `/{slug}`. For the dynamic footer case use the root's slug directly. These hrefs are static strings, not built from query data, so the `urls.ts` helper isn't needed — but the values must match a real category's clean path.

- [ ] **Step 1: For each file/line above, replace the prefixed string with the clean string.** Example (header.tsx:58):

```tsx
// before
href="/category/prosfores"
// after
href="/prosfores"
```

For footer.tsx:54:
```tsx
// before
href={`/category/${root.slug}`}
// after
href={`/${root.slug}`}
```

Apply the analogous edit to each listed line. **Do not** touch `pdp-client.tsx`/`plp-client.tsx` here (already done in Tasks 4–5).

- [ ] **Step 2: Verify no prefixed links remain in the storefront**

Run (Grep tool, not bash): search `src/app/[locale]/(store)/_components` for `/category/` and `/product/` literals. Expected: zero matches except inside `urls.ts` comments and the redirector resolvers. Investigate any remaining hit.

- [ ] **Step 3: Verify the special `prosfores` root resolves**

Confirm a category row with slug `prosfores` exists and its `full_path` is `prosfores` (so `/prosfores` renders via the catch-all, and the old `/category/prosfores` 308s to `/prosfores`). If `prosfores` is NOT a real category, flag to the user before shipping — its clean URL would 404. (Use the Supabase REST access noted in memory `reference-supabase-access`, or ask the user.)

- [ ] **Step 4: Typecheck + commit**

Run: `pnpm typecheck`
```bash
git add "src/app/[locale]/(store)/_components/shell/mega-menu.tsx" "src/app/[locale]/(store)/_components/shell/header.tsx" "src/app/[locale]/(store)/_components/shell/cart-panel.tsx" "src/app/[locale]/(store)/_components/shell/footer.tsx" "src/app/[locale]/(store)/_components/home/category-shortcut-grid.tsx" "src/app/[locale]/(store)/_components/home/editorial-band.tsx" "src/app/[locale]/(store)/_components/home/race-control-panel.tsx" "src/app/[locale]/(store)/_components/home/hero.tsx" "src/app/[locale]/(store)/_components/home/offers-section.tsx"
git commit -m "feat(storefront): internal links point to clean canonical URLs (Track D1)"
```

---

## Task 10: Retire the legacy `src/components` PDP/PLP (gated, one PR section)

**Files (deletion CANDIDATES — gate each before removing):**
- `src/components/product/image-gallery.tsx`
- `src/components/product/variant-selector.tsx`
- `src/components/product/specifications-table.tsx`
- `src/components/product/delivery-estimate.tsx`
- `src/components/product/klarna-info.tsx`
- `src/components/product/product-json-ld.tsx`
- `src/components/product/mobile-cta-bar.tsx`
- `src/components/product/category-header.tsx`
- `src/components/product/filter-sidebar.tsx`
- `src/components/product/sort-dropdown.tsx`
- `src/components/cart/add-to-cart-button.tsx` (only after `mobile-cta-bar` is gone — it was its last non-catch-all consumer)

**KEEP (proven live consumers):** `src/components/product/product-grid.tsx` (`bikes/[slug]/page.tsx`, campaigns `product-rail.tsx`), `src/components/product/product-card.tsx` (used by `product-grid`). Leave `src/components/ui/*` primitives alone unless a gate proves a specific file orphaned.

**Procedure per candidate (the Track B gate that already corrected one audit):**

- [ ] **Step 1: For each candidate, run the upstream impact gate**

```
gitnexus_impact({ target: "<ComponentName>", direction: "upstream" })
```
AND a repo-wide import grep (Grep tool): search `src/` for the file's import specifier (e.g. `product/image-gallery`). The candidate is deletable **only if** both show zero remaining consumers (after Tasks 7–9 removed the catch-all usage). Any hit → it stays; note why.

- [ ] **Step 2: Delete only the confirmed-orphaned files**

Delete each cleared file. Process `mobile-cta-bar.tsx` before re-checking `add-to-cart-button.tsx` (deleting the former may orphan the latter). Re-run the gate on `add-to-cart-button.tsx` after.

- [ ] **Step 3: Typecheck + build + full tests**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: PASS — no dangling imports.

- [ ] **Step 4: `detect_changes` + commit**

Run `gitnexus_detect_changes()`; confirm only the deleted symbols + their (already-edited) former importers changed.
```bash
git add -- <each deleted path>
git commit -m "chore(storefront): retire legacy PDP/PLP components (Track D1, gated)"
```

---

## Task 11: Final verification & PR

- [ ] **Step 1: Full green gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all PASS (CI mirrors this and is blocking).

- [ ] **Step 2: Live behavior verification** (use the `verify` skill or `pnpm dev`)

Confirm against a running app (the 404 outage taught us to check **body + headers**, not just 200 status, and to use **non-seeded** slugs):
- A **non-seeded** product clean URL `/{category_full_path}/{slug}` renders the **v3** PDP (not legacy), 200, real product body.
- A category clean URL `/{full_path}` renders the **v3** PLP; filter/sort/pagination keep you on the clean URL (no 301 bounce).
- `/product/{slug}` responds **308** with `Location` = clean product URL; `/category/{slug}` responds **308** → clean category URL.
- Product cards, PDP breadcrumb, subcategory chips, and nav links all emit clean hrefs (view source).
- A genuinely unknown slug still 404s (notFound preserved).

- [ ] **Step 3: `detect_changes` final + open PR**

```bash
gh pr create --base main --title "feat: Track D1 — storefront presentation unification" --body "<summary + ADR 0002/0004 refs + gitnexus impact evidence for the catch-all switch and each deletion + 'Closes #<issues>'>"
```
Let CI go green (`gh run watch <id> --exit-status`). **Do not merge without the user's explicit approval** (structural switch + prod deploy; the classifier will also block the merge until re-authorized in-session).

- [ ] **Step 4: After merge** — `git checkout main && git pull`; update `STATUS.md` (Track D1 done; D2 pending); write/refresh memory pointer.

---

## Self-Review

**Spec coverage (PRD stories 22–27):**
- 22 (every product/category loads on clean URL) → Task 7 (catch-all renders v3) + Task 11 verify.
- 23 (clean URL serves v3) → Task 6 + Task 7.
- 24 (prefixed 301→clean) → Task 8 (308 permanent; rationale documented).
- 25 (single presentation) → Task 10 (retire legacy) + Tasks 6–7.
- 26 (canonical route = thin resolver of route-agnostic components) → Task 6 (extracted views) + Task 7 (catch-all calls them).
- 27 (legacy retired once nothing depends) → Task 10 (gated).
- ADR 0002 internal-links-must-be-clean → Tasks 3–5, 9.
- 404 non-regression (PRD line 127) → `await searchParams` preserved in Tasks 6–7; verified Task 11 with non-seeded slugs.

**Out of scope confirmed:** server-backed cart + Guest→User merge (stories 28–29) — not in any task. ✅

**Placeholder scan:** no TBD/"handle edge cases"/"similar to" — code shown for every code step. ✅

**Type consistency:** `category_path` (string|null) added in Task 2 and consumed identically in Tasks 3 (`product.category_path`), 4, 6, 8. `PLPClient` prop rename `subcategories:{path,name}` + new `basePath` defined in Task 5 and supplied identically in Tasks 5 & 6. `Resolved` category variant gains `categorySlug` in Task 7 to match `CategoryView({slug})` from Task 6. `productRedirectTarget`/`categoryRedirectTarget` names consistent between Task 8 impl, tests, and page imports. ✅

**Known follow-up to flag at execution:** verify `permanentRedirect` is re-exported by `@/i18n/navigation` (Task 8 Step 5) and that `prosfores` is a real category (Task 9 Step 3) — both have written fallbacks.
```