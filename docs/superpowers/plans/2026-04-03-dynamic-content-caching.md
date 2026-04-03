# Dynamic Content + Caching Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded landing page data with database-driven content using Next.js 16 `'use cache'` + `cacheTag` for zero-cost static serving, and add caching + performance hardening to the entire project.

**Architecture:** All data queries use the `'use cache'` directive with `cacheTag()` for on-demand invalidation via `revalidateTag()`. Admin mutations trigger tag-based revalidation. Visitors always get cached static HTML. Next.js 16's `cacheComponents: true` is already enabled.

**Tech Stack:** Next.js 16.2.2 (App Router, `'use cache'` directive), Supabase (PostgreSQL), TypeScript, Tailwind CSS 4, Framer Motion

**Important:** This project uses Next.js 16 which has breaking changes. Before writing any code, check `node_modules/next/dist/docs/` for the correct API. Key difference: use `'use cache'` directive + `cacheTag()` + `cacheLife()` from `next/cache`, NOT the old `unstable_cache` or `fetch({ next: { tags } })` pattern.

---

## File Structure

### New files
```
src/lib/cache/cached-queries.ts          — Cached query functions using 'use cache' + cacheTag
src/lib/cache/revalidate.ts              — Centralized revalidation helper
src/lib/queries/banners.ts               — Banner queries
src/lib/queries/settings.ts              — Site settings queries
src/lib/queries/reviews.ts               — Review queries (for homepage)
supabase/migrations/20260403000001_banners_settings.sql  — New tables + is_featured column
src/app/error.tsx                        — Root error boundary
src/app/not-found.tsx                    — Root 404 page
src/app/account/error.tsx                — Account error boundary
src/app/account/loading.tsx              — Account loading state
src/app/admin/error.tsx                  — Admin error boundary
src/app/admin/loading.tsx                — Admin loading state
src/app/checkout/error.tsx               — Checkout error boundary
src/app/checkout/loading.tsx             — Checkout loading state
```

### Modified files
```
src/app/page.tsx                         — Async server component, orchestrates cached queries
src/components/home/bento-categories.tsx — Props-driven, remove hardcoded array, remove 'use client'
src/components/home/brands-strip.tsx     — Props-driven, remove hardcoded array
src/components/home/featured-products.tsx — Props-driven, remove mock data, split client/server
src/components/home/reviews-carousel.tsx — Props-driven, remove mock data, split client/server
src/components/home/trust-bar.tsx        — Props-driven, remove hardcoded array
src/components/hero/hero-section.tsx     — Props-driven, receive slides as prop
src/components/layout/header.tsx         — Split into server wrapper + client interactive part
src/components/layout/footer.tsx         — Receive category links as prop from layout
src/components/layout/mega-menu-data.ts  — Delete (replaced by cached category tree query)
src/components/layout/nav-links.ts       — Delete (replaced by cached category tree query)
src/lib/queries/categories.ts            — Add getTopCategories(), add 'use cache' to getCategoryTree()
src/lib/queries/products.ts              — Add getFeaturedProducts(), optimize getProductFilters()
src/lib/actions/admin.ts                 — Add revalidateTag calls to all mutations
src/app/(shop)/[category]/page.tsx       — Add 'use cache' with cacheTag
src/app/(shop)/[category]/[slug]/page.tsx — Add generateStaticParams, add 'use cache'
src/app/sitemap.ts                       — Add 'use cache' with cacheTag
src/app/layout.tsx                       — Pass nav data from server to header/footer
```

---

### Task 1: Database Migration — banners, site_settings, is_featured

**Files:**
- Create: `supabase/migrations/20260403000001_banners_settings.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Banners for hero carousel
create table banners (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subtitle    text,
  cta_label   text,
  cta_href    text,
  image_url   text,
  gradient    text,
  accent_color text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_banners_active on banners(is_active, position);
alter table banners enable row level security;
create policy "banners_public_read" on banners for select using (true);
create policy "banners_admin_write" on banners for all to service_role using (true);

-- Site-wide key-value settings
create table site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "settings_public_read" on site_settings for select using (true);
create policy "settings_admin_write" on site_settings for all to service_role using (true);

-- Featured flag on products
alter table products add column if not exists is_featured boolean not null default false;
create index idx_products_featured on products(is_featured) where is_featured = true;

-- Seed default settings
insert into site_settings (key, value) values
  ('announcement', '{"text": "Δωρεάν αποστολή για αγορές άνω των 80€", "active": true}'::jsonb),
  ('trust_items', '[
    {"icon": "truck", "label": "Δωρεάν Αποστολή", "detail": "Για αγορές άνω των 50€"},
    {"icon": "shield", "label": "Επίσημος Αντιπρόσωπος", "detail": "Εγγυημένα προϊόντα"},
    {"icon": "clock", "label": "Άμεση Αποστολή", "detail": "Σε 1 εργάσιμη ημέρα"},
    {"icon": "star", "label": "5000+ Reviews", "detail": "Ικανοποιημένοι πελάτες"}
  ]'::jsonb);

-- Seed banners from current hardcoded data
insert into banners (title, subtitle, cta_label, cta_href, gradient, accent_color, position) values
  ('ΑΣΦΑΛΕΙΑ ΣΕ ΚΑΘΕ ΣΤΡΟΦΗ', 'Κράνη επαγγελματικής απόδοσης', 'Δες τα Κράνη AGV', '/kranea', 'linear-gradient(135deg, #0B0F14 0%, #0F1A28 40%, #0D1520 100%)', 'teal', 0),
  ('ΠΡΟΣΤΑΣΙΑ ΧΩΡΙΣ ΣΥΜΒΙΒΑΣΜΟΥΣ', 'Επαγγελματικός εξοπλισμός αναβατών', 'Δες Εξοπλισμό', '/shop', 'linear-gradient(135deg, #120B0B 0%, #1F0D0D 40%, #160B0B 100%)', 'red', 1),
  ('ΟΔΗΓΗΣΕ ΧΩΡΙΣ ΟΡΙΑ', 'Γάντια, μπότες & ένδυση υψηλών επιδόσεων', 'Εξερεύνησε', '/shop', 'linear-gradient(135deg, #0A0F0A 0%, #0D1A10 40%, #0B150C 100%)', 'emerald', 2),
  ('ΤΕΧΝΟΛΟΓΙΑ ΠΡΩΤΟΠΟΡΩΝ', 'Κράνη ιαπωνικής μηχανικής αριστείας', 'Δες τα Κράνη Shoei', '/kranea', 'linear-gradient(135deg, #0F0B14 0%, #180D28 40%, #130C1E 100%)', 'violet', 3),
  ('ΣΤΥΛ ΚΑΙ ΛΕΙΤΟΥΡΓΙΚΟΤΗΤΑ', 'Η νέα κολεξιόν έφτασε', 'Νέες Αφίξεις', '/prosfores', 'linear-gradient(135deg, #0F0F0B 0%, #1A1A0D 40%, #151508 100%)', 'amber', 4);
```

- [ ] **Step 2: Apply the migration**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx supabase db push`
Expected: Migration applied successfully, tables created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260403000001_banners_settings.sql
git commit -m "feat(db): add banners, site_settings tables and is_featured column"
```

---

### Task 2: Cached Query Layer

**Files:**
- Create: `src/lib/cache/cached-queries.ts`
- Create: `src/lib/cache/revalidate.ts`
- Create: `src/lib/queries/banners.ts`
- Create: `src/lib/queries/settings.ts`
- Create: `src/lib/queries/reviews.ts`
- Modify: `src/lib/queries/categories.ts`
- Modify: `src/lib/queries/products.ts`

- [ ] **Step 1: Create the revalidation helper**

Create `src/lib/cache/revalidate.ts`:

```typescript
"use server";

import { revalidateTag } from "next/cache";

export type ContentTag =
  | "categories"
  | "brands"
  | "products"
  | "reviews"
  | "banners"
  | "settings";

export async function revalidateContent(...tags: ContentTag[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}
```

- [ ] **Step 2: Create cached query functions**

Create `src/lib/cache/cached-queries.ts`:

```typescript
import { cacheTag, cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ─── Categories ──────────────────────────────────────────────────

export async function getTopCategories() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, image_url, position")
    .is("parent_id", null)
    .order("position", { ascending: true });

  return data ?? [];
}

export async function getCachedCategoryTree() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id, position")
    .order("position", { ascending: true });

  if (!data) return [];

  type RawNode = {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    children: RawNode[];
  };

  const nodeMap = new Map<string, RawNode>();
  for (const row of data) {
    nodeMap.set(row.id, { ...row, children: [] });
  }

  const roots: RawNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id) {
      nodeMap.get(node.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ─── Brands ──────────────────────────────────────────────────────

export async function getActiveBrands() {
  "use cache";
  cacheTag("brands");
  cacheLife("days");

  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("name", { ascending: true });

  return data ?? [];
}

// ─── Featured Products ──────────────────────────────────────────

export async function getFeaturedProducts() {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      `id, slug, name, price, compare_at_price, stock, images,
       brands:brand_id ( name, slug ),
       categories:category_id ( slug ),
       average_rating, review_count`
    )
    .eq("is_featured", true)
    .eq("status", "active")
    .limit(6);

  if (!data) return [];

  return data.map((p) => {
    const brand = p.brands as unknown as { name: string; slug: string } | null;
    const category = p.categories as unknown as { slug: string } | null;
    const images = (p.images ?? []) as unknown as {
      url: string;
      alt: string;
      position: number;
    }[];

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: brand?.name ?? "",
      brand_slug: brand?.slug ?? "",
      category_slug: category?.slug ?? "",
      price: p.price,
      compare_at_price: p.compare_at_price,
      stock: p.stock,
      primary_image_url: images[0]?.url ?? "",
      primary_image_alt: images[0]?.alt ?? p.name,
      average_rating: p.average_rating,
      review_count: p.review_count,
    };
  });
}

// ─── Banners ─────────────────────────────────────────────────────

export async function getActiveBanners() {
  "use cache";
  cacheTag("banners");
  cacheLife("hours");

  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("id, title, subtitle, cta_label, cta_href, image_url, gradient, accent_color, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  return data ?? [];
}

// ─── Reviews ─────────────────────────────────────────────────────

export async function getTopReviews() {
  "use cache";
  cacheTag("reviews");
  cacheLife("hours");

  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `id, rating, comment, created_at,
       user_profiles:user_id ( full_name ),
       products:product_id ( name )`
    )
    .eq("status", "approved")
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!data) return [];

  return data.map((r) => {
    const user = r.user_profiles as unknown as { full_name: string | null } | null;
    const product = r.products as unknown as { name: string } | null;

    return {
      id: r.id,
      name: user?.full_name ?? "Πελάτης",
      rating: r.rating,
      text: r.comment ?? "",
      product: product?.name ?? "",
    };
  });
}

// ─── Site Settings ───────────────────────────────────────────────

export async function getSiteSettings() {
  "use cache";
  cacheTag("settings");
  cacheLife("days");

  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value");

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}
```

- [ ] **Step 3: Verify the module compiles**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx tsc --noEmit src/lib/cache/cached-queries.ts src/lib/cache/revalidate.ts 2>&1 | head -20`
Expected: No errors (or only unrelated ones).

- [ ] **Step 4: Commit**

```bash
git add src/lib/cache/
git commit -m "feat(cache): add cached query layer with use cache + cacheTag"
```

---

### Task 3: Update Admin Actions with Tag-Based Revalidation

**Files:**
- Modify: `src/lib/actions/admin.ts`

- [ ] **Step 1: Add revalidateTag imports and calls to admin.ts**

At the top of `src/lib/actions/admin.ts`, add the import:
```typescript
import { revalidateTag } from "next/cache";
```

Then update each mutation to add `revalidateTag` calls alongside the existing `revalidatePath` calls:

**Products section** — after each `revalidatePath("/admin/products")`, add:
```typescript
revalidateTag("products");
```

**Categories section** — after each `revalidatePath("/admin/categories")`, add:
```typescript
revalidateTag("categories");
```

**Brands section** — after each `revalidatePath("/admin/categories")` (brands currently revalidate the categories admin page), add:
```typescript
revalidateTag("brands");
```

**Reviews section** — after each `revalidatePath("/admin/reviews")`, add:
```typescript
revalidateTag("reviews");
```

The existing `revalidatePath` calls stay so the admin pages themselves still refresh.

- [ ] **Step 2: Verify the file compiles**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx tsc --noEmit src/lib/actions/admin.ts 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/admin.ts
git commit -m "feat(admin): add revalidateTag calls to all admin mutations"
```

---

### Task 4: Refactor Homepage — Server Component Orchestrator

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx as async server component**

Replace the entire `src/app/page.tsx` with:

```typescript
import { HeroSection } from "@/components/hero/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { BentoCategories } from "@/components/home/bento-categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandsStrip } from "@/components/home/brands-strip";
import { ReviewsCarousel } from "@/components/home/reviews-carousel";
import { JsonLd } from "@/components/seo/json-ld";
import { generateOrganizationSchema } from "@/lib/schema/organization";
import { generateWebsiteSchema } from "@/lib/schema/website";
import {
  getTopCategories,
  getActiveBrands,
  getFeaturedProducts,
  getActiveBanners,
  getTopReviews,
  getSiteSettings,
} from "@/lib/cache/cached-queries";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export default async function HomePage() {
  const [categories, brands, products, banners, reviews, settings] =
    await Promise.all([
      getTopCategories(),
      getActiveBrands(),
      getFeaturedProducts(),
      getActiveBanners(),
      getTopReviews(),
      getSiteSettings(),
    ]);

  const announcement = settings.announcement as
    | { text: string; active: boolean }
    | undefined;
  const trustItems = settings.trust_items as
    | { icon: string; label: string; detail: string }[]
    | undefined;

  return (
    <>
      <JsonLd data={generateOrganizationSchema(BASE_URL)} />
      <JsonLd data={generateWebsiteSchema(BASE_URL)} />
      <HeroSection slides={banners} />
      <TrustBar items={trustItems ?? []} />
      <BentoCategories categories={categories} />
      <FeaturedProducts products={products} />
      <BrandsStrip brands={brands} />
      <ReviewsCarousel reviews={reviews} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): convert to async server component with cached queries"
```

---

### Task 5: Refactor BentoCategories Component

**Files:**
- Modify: `src/components/home/bento-categories.tsx`

- [ ] **Step 1: Rewrite bento-categories.tsx to accept props**

Remove `"use client"` and the hardcoded `CATEGORIES` array. Accept categories as props. Keep the `ScrollReveal` by wrapping each item in it (ScrollReveal is a client component, the parent can be server).

Replace the entire file:

```typescript
import Link from "next/link";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Container } from "@/components/layout/container";
import { H2, SectionLabel } from "@/components/ui/typography";

const GRADIENTS = [
  "from-red-900/40 to-bg-deep/80",
  "from-slate-800/60 to-bg-deep/80",
  "from-amber-900/30 to-bg-deep/80",
  "from-blue-900/30 to-bg-deep/80",
  "from-emerald-900/30 to-bg-deep/80",
];

const AREAS = ["helmets", "apparel", "boots", "accessories", "parts"];

interface BentoCategoriesProps {
  categories: {
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    position: number;
  }[];
}

export const BentoCategories = ({ categories }: BentoCategoriesProps) => (
  <section className="py-16 md:py-24">
    <Container>
      <ScrollReveal>
        <SectionLabel className="mb-3">Κατηγορίες</SectionLabel>
        <H2 className="mb-10 text-text-primary">ΕΞΟΠΛΙΣΕ ΤΗ ΜΗΧΑΝΗ ΣΟΥ</H2>
      </ScrollReveal>

      <div
        className="grid gap-3 md:grid-cols-3 md:grid-rows-2"
        style={{
          gridTemplateAreas: `
            "${AREAS[0] ?? ""} ${AREAS[0] ?? ""} ${AREAS[1] ?? ""}"
            "${AREAS[0] ?? ""} ${AREAS[0] ?? ""} ${AREAS[2] ?? ""}"
            "${AREAS[3] ?? ""} ${AREAS[4] ?? ""} ${AREAS[4] ?? ""}"
          `,
        }}
      >
        {categories.map((cat, i) => (
          <ScrollReveal key={cat.id} delay={i * 0.1}>
            <Link
              href={`/${cat.slug}`}
              className="group relative flex min-h-[160px] items-end overflow-hidden rounded-lg bg-bg-surface p-6 transition-all duration-300 hover:glow-teal md:min-h-[200px]"
              style={{ gridArea: AREAS[i] ?? undefined }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} transition-opacity duration-300 group-hover:opacity-80`}
              />
              <div className="relative z-10">
                <h3 className="font-display text-xl tracking-wider text-text-primary md:text-2xl">
                  {cat.name}
                </h3>
                <p className="mt-1 translate-y-2 text-sm text-brand-teal opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Δες τα προϊόντα &rarr;
                </p>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </Container>
  </section>
);
```

- [ ] **Step 2: Verify the dev server starts without errors**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx next build 2>&1 | tail -20`
Expected: Build succeeds (or only unrelated warnings).

- [ ] **Step 3: Commit**

```bash
git add src/components/home/bento-categories.tsx
git commit -m "refactor(home): make BentoCategories props-driven from cached DB data"
```

---

### Task 6: Refactor BrandsStrip Component

**Files:**
- Modify: `src/components/home/brands-strip.tsx`

- [ ] **Step 1: Rewrite brands-strip.tsx to accept props**

Replace the entire file:

```typescript
import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/ui/typography";

interface BrandsStripProps {
  brands: { id: string; name: string; slug: string; logo_url: string | null }[];
}

const BrandLogo = ({ name }: { name: string }) => (
  <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded border border-border-default bg-bg-surface px-4 text-sm font-semibold text-text-muted transition-colors duration-300 hover:border-brand-teal/30 hover:text-text-primary">
    {name}
  </div>
);

export const BrandsStrip = ({ brands }: BrandsStripProps) => (
  <section className="py-16 md:py-20">
    <Container>
      <SectionLabel className="mb-8 text-center">
        Brands που εμπιστευόμαστε
      </SectionLabel>
    </Container>

    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-bg-deep to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-bg-deep to-transparent" />

      <div
        className="flex gap-4 hover:[animation-play-state:paused]"
        style={{
          animation: "scrollInfinite 30s linear infinite",
          width: "max-content",
        }}
      >
        {[...brands, ...brands].map((brand, i) => (
          <BrandLogo key={`${brand.slug}-${i}`} name={brand.name} />
        ))}
      </div>
    </div>
  </section>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/brands-strip.tsx
git commit -m "refactor(home): make BrandsStrip props-driven from cached DB data"
```

---

### Task 7: Refactor HeroSection Component

**Files:**
- Modify: `src/components/hero/hero-section.tsx`

- [ ] **Step 1: Update HeroSection to accept slides as prop**

The component stays `"use client"` because it uses `useState`, `useEffect`, and Framer Motion. We only remove the hardcoded `slides` array and pass it as a prop.

At the top of the file, modify the interface and component:

Remove the hardcoded `const slides: BannerSlide[] = [...]` array (lines 22-78).

Change the `BannerSlide` interface to match the DB shape:
```typescript
interface BannerSlide {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  gradient: string | null;
  accent_color: string | null;
  position: number;
}
```

Add an accent color mapping helper:
```typescript
const ACCENT_STYLES: Record<string, { text: string; bg: string }> = {
  teal: { text: "text-brand-teal", bg: "bg-brand-teal/10 border border-brand-teal/20" },
  red: { text: "text-brand-red", bg: "bg-brand-red/10 border border-brand-red/20" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-400/10 border border-emerald-400/20" },
  violet: { text: "text-violet-400", bg: "bg-violet-400/10 border border-violet-400/20" },
  amber: { text: "text-amber-400", bg: "bg-amber-400/10 border border-amber-400/20" },
};

const DEFAULT_ACCENT = { text: "text-brand-teal", bg: "bg-brand-teal/10 border border-brand-teal/20" };
```

Change the component signature from:
```typescript
export const HeroSection = () => {
```
to:
```typescript
interface HeroSectionProps {
  slides: BannerSlide[];
}

export const HeroSection = ({ slides }: HeroSectionProps) => {
```

Update all references inside the component:
- `activeSlide.headline` → `activeSlide.title`
- `activeSlide.tagline` → `activeSlide.subtitle`
- `activeSlide.ctaLabel` → `activeSlide.cta_label`
- `activeSlide.ctaHref` → `activeSlide.cta_href`
- `activeSlide.brand` → remove brand badge (or derive from title)
- `activeSlide.accentColor` → `ACCENT_STYLES[activeSlide.accent_color ?? "teal"]?.text ?? DEFAULT_ACCENT.text`
- `activeSlide.brandBg` → `ACCENT_STYLES[activeSlide.accent_color ?? "teal"]?.bg ?? DEFAULT_ACCENT.bg`

Add early return if no slides:
```typescript
if (slides.length === 0) return null;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hero/hero-section.tsx
git commit -m "refactor(hero): make HeroSection props-driven from cached DB banners"
```

---

### Task 8: Refactor FeaturedProducts Component

**Files:**
- Modify: `src/components/home/featured-products.tsx`

- [ ] **Step 1: Update FeaturedProducts to accept props**

Keep `"use client"` (it uses scroll interactions). Remove `MOCK_PRODUCTS`. Accept products as prop.

Change the interface and component:

```typescript
interface FeaturedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  category_slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  primary_image_url: string;
  primary_image_alt: string;
  average_rating: number | null;
  review_count: number;
}

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}
```

Change the component signature from:
```typescript
export const FeaturedProducts = () => (
```
to:
```typescript
export const FeaturedProducts = ({ products }: FeaturedProductsProps) => (
```

Update `ProductCardProps` to use `FeaturedProduct` instead of `(typeof MOCK_PRODUCTS)[number]`.

Update the product card's field mappings:
- `product.originalPrice` → `product.compare_at_price`
- `product.rating` → `product.average_rating ?? 0`
- `product.reviews` → `product.review_count`
- `product.inStock` → `product.stock > 0`
- `product.isNew` → remove (or derive from created_at in future)
- Wrap in a `Link` to `/${product.category_slug}/${product.slug}`

In the carousel rendering, replace `MOCK_PRODUCTS.map(...)` with `products.map(...)`.

- [ ] **Step 2: Commit**

```bash
git add src/components/home/featured-products.tsx
git commit -m "refactor(home): make FeaturedProducts props-driven from cached DB data"
```

---

### Task 9: Refactor ReviewsCarousel Component

**Files:**
- Modify: `src/components/home/reviews-carousel.tsx`

- [ ] **Step 1: Update ReviewsCarousel to accept props**

Keep `"use client"`. Remove `MOCK_REVIEWS`. Accept reviews as prop.

```typescript
interface ReviewItem {
  id: string;
  name: string;
  rating: number;
  text: string;
  product: string;
}

interface ReviewsCarouselProps {
  reviews: ReviewItem[];
}

export const ReviewsCarousel = ({ reviews }: ReviewsCarouselProps) => (
```

Replace `MOCK_REVIEWS.map(...)` with `reviews.map(...)`.

- [ ] **Step 2: Commit**

```bash
git add src/components/home/reviews-carousel.tsx
git commit -m "refactor(home): make ReviewsCarousel props-driven from cached DB reviews"
```

---

### Task 10: Refactor TrustBar Component

**Files:**
- Modify: `src/components/home/trust-bar.tsx`

- [ ] **Step 1: Update TrustBar to accept props**

```typescript
import { Truck, Shield, Clock, Star, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";

const ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  shield: Shield,
  clock: Clock,
  star: Star,
};

interface TrustBarProps {
  items: { icon: string; label: string; detail: string }[];
}

export const TrustBar = ({ items }: TrustBarProps) => (
  <section className="border-y border-border-default bg-bg-surface py-6">
    <Container>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {items.map(({ icon, label, detail }) => {
          const Icon = ICON_MAP[icon] ?? Star;
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10">
                <Icon className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">{detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  </section>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/trust-bar.tsx
git commit -m "refactor(home): make TrustBar props-driven from cached DB settings"
```

---

### Task 11: Refactor Navigation — Dynamic Mega Menu, Nav Links, Footer

**Files:**
- Modify: `src/app/layout.tsx` (pass nav data to header/footer)
- Modify: `src/components/layout/header.tsx` (accept category tree as prop)
- Modify: `src/components/layout/footer.tsx` (accept category links as prop)
- Delete: `src/components/layout/mega-menu-data.ts`
- Delete: `src/components/layout/nav-links.ts`

- [ ] **Step 1: Read the current layout.tsx**

Read `src/app/layout.tsx` to understand the current structure before modifying.

- [ ] **Step 2: Update layout.tsx to fetch category tree and pass to header/footer**

In `src/app/layout.tsx`, import and call the cached category tree:

```typescript
import { getCachedCategoryTree } from "@/lib/cache/cached-queries";
import { getSiteSettings } from "@/lib/cache/cached-queries";
```

Make the layout component async and fetch data:
```typescript
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categoryTree, settings] = await Promise.all([
    getCachedCategoryTree(),
    getSiteSettings(),
  ]);

  const announcement = settings.announcement as
    | { text: string; active: boolean }
    | undefined;

  return (
    <html>
      <body>
        <Header categoryTree={categoryTree} announcement={announcement} />
        {children}
        <Footer categoryTree={categoryTree} />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Split header.tsx into server wrapper + client component**

The header is `"use client"` because it uses `usePathname`, `useState`, etc. It can't be made async. So we pass the category tree as a serialized prop.

Update `src/components/layout/header.tsx`:

Remove the import of `MENU_CATEGORIES` from `mega-menu-data`. Instead, accept props:

```typescript
interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  children: CategoryNode[];
}

interface HeaderProps {
  categoryTree: CategoryNode[];
  announcement?: { text: string; active: boolean };
}

export const Header = ({ categoryTree, announcement }: HeaderProps) => {
```

Build the `MenuCategory[]` structure from the category tree inside the component:

```typescript
const menuCategories: MenuCategory[] = categoryTree.map((node) => ({
  label: node.name,
  href: `/${node.slug}`,
  columns: node.children.length > 0
    ? [
        {
          title: node.name,
          items: node.children.map((child) => ({
            label: child.name,
            href: `/${child.slug}`,
          })),
        },
      ]
    : [],
}));
```

Keep the `MenuCategory` and `SubCategory` interfaces inline in header.tsx (since we're deleting mega-menu-data.ts).

Replace the hardcoded announcement bar:
```typescript
{announcement?.active && (
  <div className="bg-brand-teal py-1.5 text-center text-xs font-medium text-white">
    {announcement.text}
  </div>
)}
```

Replace `MENU_CATEGORIES.map(...)` with `menuCategories.map(...)` in both desktop and mobile nav sections.

- [ ] **Step 4: Update footer.tsx to accept dynamic category links**

In `src/components/layout/footer.tsx`, accept category links as prop:

```typescript
interface FooterProps {
  categoryTree: {
    id: string;
    slug: string;
    name: string;
    children: { id: string; slug: string; name: string }[];
  }[];
}

export const Footer = ({ categoryTree }: FooterProps) => {
```

Replace the hardcoded `FOOTER_LINKS.shop` section with dynamic data:

```typescript
const shopLinks = categoryTree.map((cat) => ({
  label: cat.name,
  href: `/${cat.slug}`,
}));
```

Keep `help` and `company` links hardcoded (they're static pages, not DB-driven).

- [ ] **Step 5: Delete mega-menu-data.ts and nav-links.ts**

```bash
rm src/components/layout/mega-menu-data.ts
rm src/components/layout/nav-links.ts
```

- [ ] **Step 6: Search for any other imports of deleted files and fix them**

Run: `grep -r "mega-menu-data\|nav-links" src/ --include="*.ts" --include="*.tsx" -l`

Fix any remaining imports.

- [ ] **Step 7: Verify build succeeds**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx next build 2>&1 | tail -30`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(nav): replace hardcoded mega menu and nav links with cached category tree"
```

---

### Task 12: Add Caching to Category and Product Pages

**Files:**
- Modify: `src/app/(shop)/[category]/page.tsx`
- Modify: `src/app/(shop)/[category]/[slug]/page.tsx`
- Modify: `src/lib/queries/products.ts` (add `getPopularProductSlugs` with cache)

- [ ] **Step 1: Add generateStaticParams to product page**

In `src/app/(shop)/[category]/[slug]/page.tsx`, add:

```typescript
import { getPopularProductSlugs } from "@/lib/queries/products";

export async function generateStaticParams() {
  const slugs = await getPopularProductSlugs(100);
  return slugs.map((s) => ({
    category: s.category_slug,
    slug: s.slug,
  }));
}
```

Check if `getPopularProductSlugs` already exists in `src/lib/queries/products.ts`. If it does, read it and add `'use cache'` + `cacheTag("products")`. If not, add it:

```typescript
export async function getPopularProductSlugs(limit: number = 100) {
  "use cache";
  cacheTag("products");
  cacheLife("days");

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("slug, categories:category_id(slug)")
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(limit);

  return (data ?? []).map((p) => ({
    slug: p.slug,
    category_slug:
      (p.categories as unknown as { slug: string } | null)?.slug ?? "products",
  }));
}
```

Add the needed imports at the top of `src/lib/queries/products.ts`:
```typescript
import { cacheTag, cacheLife } from "next/cache";
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(shop)/[category]/[slug]/page.tsx src/lib/queries/products.ts
git commit -m "perf(shop): add generateStaticParams for top 100 products"
```

---

### Task 13: Add Caching to Sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add 'use cache' + cacheTag to sitemap queries**

Wrap each sitemap query function with `'use cache'`:

```typescript
import { cacheTag, cacheLife } from "next/cache";

async function getProductEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  // ... existing code
}

async function getCategoryEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("categories");
  cacheLife("days");
  // ... existing code
}

async function getBrandEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("brands");
  cacheLife("days");
  // ... existing code
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "perf(seo): add cache tags to sitemap queries"
```

---

### Task 14: Error Boundaries and Loading States

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/account/error.tsx`
- Create: `src/app/account/loading.tsx`
- Create: `src/app/admin/error.tsx`
- Create: `src/app/admin/loading.tsx`
- Create: `src/app/checkout/error.tsx`
- Create: `src/app/checkout/loading.tsx`

- [ ] **Step 1: Create root error.tsx**

```typescript
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-text-primary">
        Κάτι πήγε στραβά
      </h2>
      <p className="max-w-md text-sm text-text-secondary">
        Παρουσιάστηκε ένα απρόσμενο σφάλμα. Παρακαλούμε δοκιμάστε ξανά.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-hover"
      >
        Δοκιμάστε ξανά
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create root not-found.tsx**

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-4xl font-bold text-text-primary">404</h2>
      <p className="max-w-md text-sm text-text-secondary">
        Η σελίδα που ψάχνετε δεν βρέθηκε.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-brand-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-hover"
      >
        Πίσω στην Αρχική
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Create account/error.tsx and account/loading.tsx**

`src/app/account/error.tsx` — same pattern as root error.tsx.

`src/app/account/loading.tsx`:
```typescript
export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-elevated" />
        <div className="h-64 animate-pulse rounded-lg bg-bg-elevated" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create admin/error.tsx and admin/loading.tsx**

Same patterns, adapted for admin layout.

- [ ] **Step 5: Create checkout/error.tsx and checkout/loading.tsx**

Same patterns, adapted for checkout.

- [ ] **Step 6: Commit**

```bash
git add src/app/error.tsx src/app/not-found.tsx src/app/account/ src/app/admin/error.tsx src/app/admin/loading.tsx src/app/checkout/
git commit -m "feat(ux): add error boundaries and loading states to all routes"
```

---

### Task 15: Three.js Hero Dynamic Import

**Files:**
- Modify: `src/components/hero/hero-section.tsx` (or wherever ParticleCanvas is imported)

- [ ] **Step 1: Find and read the particle canvas import**

Run: `grep -r "ParticleCanvas\|particle-canvas\|@react-three" src/ --include="*.tsx" --include="*.ts" -l`

Read the file that imports ParticleCanvas. If it's imported statically in the hero or elsewhere, change to dynamic import:

```typescript
import dynamic from "next/dynamic";

const ParticleCanvas = dynamic(() => import("@/components/effects/particle-canvas"), {
  ssr: false,
  loading: () => <div className="h-full bg-bg-deep" />,
});
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "perf(hero): dynamic import Three.js particle canvas to reduce initial bundle"
```

---

### Task 16: Missing SEO Metadata

**Files:**
- Modify: `src/app/checkout/page.tsx` (or layout)
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/account/layout.tsx` (or page)

- [ ] **Step 1: Add robots noindex to private pages**

In `src/app/admin/layout.tsx`, add:
```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | MotoMarket",
  robots: { index: false, follow: false },
};
```

In `src/app/account/layout.tsx` (or create one), add:
```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Λογαριασμός | MotoMarket", template: "%s | MotoMarket" },
  robots: { index: false, follow: false },
};
```

In `src/app/checkout/page.tsx` or layout, add:
```typescript
export const metadata: Metadata = {
  title: "Ολοκλήρωση Παραγγελίας | MotoMarket",
  robots: { index: false, follow: false },
};
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(seo): add robots noindex to admin, account, and checkout routes"
```

---

### Task 17: Final Verification

- [ ] **Step 1: Run full build**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx next build 2>&1 | tail -40`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && pnpm lint 2>&1 | tail -20`
Expected: No errors (warnings acceptable).

- [ ] **Step 3: Run type check**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx tsc --noEmit 2>&1 | tail -20`
Expected: No type errors.

- [ ] **Step 4: Verify dev server loads homepage**

Run: `cd C:/Users/ntont/Desktop/motomaarket_website/motomarket && npx next dev &` then `curl -s http://localhost:3000 | head -50`
Expected: HTML response with page content.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build/lint issues from dynamic content migration"
```
