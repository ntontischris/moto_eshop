# Dynamic Content + Caching Layer Design

## Problem

The landing page and navigation use hardcoded data (categories, brands, products, reviews, hero banners). Adding a new category via admin doesn't reflect on the homepage, mega menu, or search. Making these dynamic with runtime DB queries would degrade Core Web Vitals. The project also lacks a caching strategy for category/product pages, resulting in unnecessary DB load per visitor.

## Solution

**Build-time static generation + on-demand revalidation via cache tags.** All content is fetched at build time and served as static HTML. When an admin mutates data, `revalidateTag()` triggers a background rebuild of affected pages. Visitors always get static HTML with zero DB overhead.

## Architecture

### Caching Layer

A central `cachedQuery` utility wraps Supabase queries with Next.js cache tags:

```
src/lib/cache/
  ├── cached-query.ts     — wrapper: cachedQuery(tag, queryFn)
  └── revalidate.ts       — helper: revalidateContent(tag)
```

**Cache tags:**

| Tag | Invalidates | Trigger |
|---|---|---|
| `categories` | Bento cards, mega menu, nav links, footer, sitemap | Admin CRUD category |
| `brands` | Brands strip, mega menu brands | Admin CRUD brand |
| `products` | Featured products, category pages, product pages, sitemap | Admin CRUD product |
| `reviews` | Reviews carousel | New approved review |
| `banners` | Hero slides | Admin CRUD banner |
| `settings` | Announcement bar, trust bar | Admin setting change |

### Database Changes

**New tables:**

#### `banners`
```sql
create table banners (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subtitle    text,
  cta_label   text,
  cta_href    text,
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index idx_banners_active on banners(is_active, position);
alter table banners enable row level security;
create policy "banners_public_read" on banners for select using (true);
create policy "banners_admin_write" on banners for all using (auth.jwt() ->> 'role' = 'service_role');
```

#### `site_settings`
```sql
create table site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "settings_public_read" on site_settings for select using (true);
create policy "settings_admin_write" on site_settings for all using (auth.jwt() ->> 'role' = 'service_role');
```

**New column on `products`:**
```sql
alter table products add column is_featured boolean not null default false;
```

**No new tables needed for:** categories (exists), brands (exists), reviews (exists).

### Component Refactoring

All hardcoded components become props-driven, receiving data from the server parent.

**Homepage `page.tsx` — Central orchestrator:**
```typescript
export default async function HomePage() {
  const [categories, brands, products, banners, reviews, settings] =
    await Promise.all([
      cachedQuery('categories', getTopCategories),
      cachedQuery('brands', getActiveBrands),
      cachedQuery('products', getFeaturedProducts),
      cachedQuery('banners', getActiveBanners),
      cachedQuery('reviews', getTopReviews),
      cachedQuery('settings', getSiteSettings),
    ])

  return (
    <>
      <HeroSection slides={banners} />
      <TrustBar items={settings.trust_items} />
      <BentoCategories categories={categories} />
      <FeaturedProducts products={products} />
      <BrandsStrip brands={brands} />
      <ReviewsCarousel reviews={reviews} />
    </>
  )
}
```

**Landing page components:**

| Component | Before | After |
|---|---|---|
| `bento-categories.tsx` | Hardcoded 5 categories | Props from parent, query: top-level categories ordered by position |
| `brands-strip.tsx` | Hardcoded 15 brand names | Props from parent, query: active brands with logos |
| `featured-products.tsx` | Mock data with fake prices | Props from parent, query: `is_featured = true` products |
| `hero-section.tsx` | Hardcoded 5 slides | Props from parent, query: active banners ordered by position |
| `reviews-carousel.tsx` | Mock reviews | Props from parent, query: top-rated approved reviews |
| `trust-bar.tsx` | Hardcoded trust items | Props from parent, query: site_settings `trust_items` |
| Announcement bar in `header.tsx` | Hardcoded string | Fetched in header server component from site_settings |

**Navigation — shared category tree:**

```
cachedQuery('categories', getCategoryTree)
        │
   ┌────┼────┐
   ▼    ▼    ▼
Mega  Nav  Footer
Menu  Links Categories
```

One query, one cache entry, three consumers. Single revalidation updates all.

**Mega menu structure:** Top-level categories become columns, children become links. The existing `getCategoryTree()` query already supports this hierarchy. The mega menu data file (`mega-menu-data.ts`) is replaced by a server component that fetches the tree and renders columns dynamically.

### Category/Product Page Caching

**`/[category]` — Category listing:**
- Cached with tags `['categories', 'products']`
- Revalidated when category or product changes

**`/[category]/[slug]` — Product detail:**
- Cached with tag `products`
- Top 100 products pre-built via `generateStaticParams`
- Remaining built on-demand at first visit, then cached

**Filter query optimization:**
- Current: `getProductFilters()` fetches ALL products to calculate filter counts
- New: DB-level aggregation query returning counts per brand, price ranges directly
- Cached with tag `products`

**Sitemap:**
- Current: Separate queries for products + categories
- New: Single query, cached with tags `['categories', 'products']`

### Admin Revalidation

Every admin server action calls `revalidateContent(tag)` after mutation:

```typescript
// In src/lib/actions/admin.ts
export async function createCategory(data: CategoryInput) {
  const result = await supabase.from('categories').insert(data)
  revalidateContent('categories')
  return result
}
```

This pattern applies to all admin CRUD operations across categories, brands, products, reviews, banners, and settings.

---

## Phase 2: Performance Hardening

### Error/Loading Boundaries

Add `error.tsx` and `loading.tsx` to routes that lack them:

```
src/app/
├── error.tsx              — root error fallback (new)
├── not-found.tsx          — root 404 (new)
├── account/
│   ├── error.tsx          (new)
│   └── loading.tsx        (new)
├── admin/
│   ├── error.tsx          (new)
│   └── loading.tsx        (new)
└── checkout/
    ├── error.tsx          (new)
    └── loading.tsx        (new)
```

Existing: `(shop)/[category]/loading.tsx` and `[slug]/loading.tsx` already present.

### Three.js Hero — Dynamic Import

Current: ~200KB+ JS loaded on initial page load for particle animation.

```typescript
const ParticleCanvas = dynamic(() => import('./particle-canvas'), {
  ssr: false,
  loading: () => <div className="h-full bg-bg-deep" />,
})
```

Result: Hero renders instantly, particles load after — no LCP impact.

### Suspense Boundaries — Account Page

Current: 3 queries (profile, orders, points) block entire render.

```typescript
<Suspense fallback={<OrdersSkeleton />}>
  <RecentOrders />
</Suspense>
<Suspense fallback={<PointsSkeleton />}>
  <LoyaltyPoints />
</Suspense>
```

Each section streams independently as its data resolves.

### Missing SEO Metadata

Add `generateMetadata` or static `metadata` to:
- `/checkout` — `robots: { index: false }`
- `/account/*` — `robots: { index: false }`
- `/admin/*` — `robots: { index: false }`
- `/register`, `/forgot-password` — proper title + description

---

## Performance Impact

| Metric | Before (hardcoded/uncached) | After |
|---|---|---|
| Landing TTFB | ~0ms (static) | ~0ms (static, from cache) |
| Category page TTFB | ~200-500ms (DB each request) | ~0ms (cached) |
| Product page TTFB | ~200-500ms (DB each request) | ~0ms (cached, pre-built for top 100) |
| DB queries per visitor | 1+ per page view | 0 (all cached) |
| Admin change visibility | Requires deploy | 1-2 seconds after save |
| LCP (hero) | Delayed by Three.js | Instant (dynamic import) |
| Account page render | Blocked until all queries done | Streaming, each section independent |

## Scope

**In scope:**
- Caching layer (cachedQuery, revalidateContent)
- DB schema changes (banners, site_settings, is_featured column)
- Refactor all hardcoded landing page components to props-driven
- Navigation components (mega menu, nav links, footer) from category tree
- Category/product page caching with tag-based revalidation
- generateStaticParams for top products
- Filter query optimization
- Error/loading boundaries
- Three.js dynamic import
- Suspense boundaries on account page
- Missing SEO metadata

**Out of scope:**
- Stripe payment integration
- Email notification system
- Inventory management
- Rate limiting
- Analytics/monitoring
- Cart persistence improvements
- Accessibility improvements beyond current state
