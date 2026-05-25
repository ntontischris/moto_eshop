# Campaign Engine — A. Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a campaign landing page from a database row at `/[locale]/lp/[slug]` — data, not code — with a typed block library, a block renderer, and lazy auto-expiry, so a campaign created via SQL is live with no redeploy.

**Architecture:** Three Supabase tables hold campaigns, variants, and events. A Zod discriminated union defines the block library (single source of truth: renderer + builder + AI all consume it). A pure resolver picks a variant; a pure visibility helper drives lazy expiry. The `lp/[slug]` server route resolves the campaign, 301-redirects expired ones, and renders `variant.blocks` through `BlockRenderer`, which maps each block type to a React component reusing existing storefront components.

**Tech Stack:** Next.js 16 (App Router, RSC), next-intl, Supabase (Postgres + RLS), Zod v4, Vitest + jsdom + @testing-library, Tailwind v4.

**Prerequisite:** The i18n work (PR #2) must be merged to `main` first — this plan adds routes under `/[locale]/`. Rebase `feat/campaign-engine` onto updated `main` before executing.

**Scope of A:** data model, block schemas, data access, default-variant resolver, lazy-expiry visibility, `BlockRenderer`, five core blocks (`hero`, `productRail`, `richText`, `discountBanner`, `countdown`), and the `lp/[slug]` route. Split/targeting, analytics events, the admin builder, and AI authoring are sub-projects B/C/D.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20260525000001_campaign_engine.sql` | Tables `campaigns`, `campaign_variants`, `campaign_events` + RLS |
| `src/types/database.ts` | Regenerated Supabase types (includes new tables) |
| `src/lib/campaigns/blocks/schema.ts` | Zod block discriminated union + `Block`/`Blocks` types |
| `src/lib/campaigns/types.ts` | `Campaign`, `CampaignVariant` row types derived from DB |
| `src/lib/campaigns/visibility.ts` | Pure `isCampaignVisible` / `isCampaignExpired` |
| `src/lib/campaigns/resolve-variant.ts` | Pure `resolveVariant` (A: default/first; extended in C) |
| `src/lib/campaigns/queries.ts` | `getCampaignBySlug` data access (server) |
| `src/lib/campaigns/blocks/block-renderer.tsx` | Maps `block.type` → component |
| `src/lib/campaigns/blocks/components/*.tsx` | `hero`, `product-rail`, `rich-text`, `discount-banner`, `countdown` |
| `src/app/[locale]/(store)/lp/[slug]/page.tsx` | Route: resolve → expiry redirect → render |

Tests colocate as `*.test.ts(x)` beside their source (Vitest default glob).

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260525000001_campaign_engine.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Campaign Engine: dynamic landing pages. One campaign holds 1-4 variants
-- (page content as blocks JSON). Reads for published+in-window pages are
-- public; all writes are admin-only (service role / server actions).

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'draft'
    check (status in ('draft','scheduled','published','expired','archived')),
  starts_at timestamptz,
  expires_at timestamptz,
  redirect_url text not null default '/',
  serving_mode text not null default 'split'
    check (serving_mode in ('split','targeting','mixed')),
  default_variant_id uuid,
  noindex boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_variants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  blocks jsonb not null default '[]'::jsonb,
  weight int not null default 1 check (weight >= 0),
  targeting_rules jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- default_variant_id points into campaign_variants (single source of truth
-- for "which variant is default"). Added after the table exists.
alter table public.campaigns
  add constraint campaigns_default_variant_fk
  foreign key (default_variant_id)
  references public.campaign_variants(id) on delete set null;

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  variant_id uuid references public.campaign_variants(id) on delete set null,
  type text not null
    check (type in ('view','cta_click','add_to_cart','purchase')),
  session_id text,
  value numeric,
  created_at timestamptz not null default now()
);

create index if not exists campaign_variants_campaign_id_idx
  on public.campaign_variants (campaign_id);
create index if not exists campaign_events_campaign_id_idx
  on public.campaign_events (campaign_id);
create index if not exists campaigns_slug_idx on public.campaigns (slug);

alter table public.campaigns enable row level security;
alter table public.campaign_variants enable row level security;
alter table public.campaign_events enable row level security;

-- Public can read only published campaigns inside their active window.
create policy "public reads published campaigns"
  on public.campaigns for select
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at >= now())
  );

create policy "public reads variants of published campaigns"
  on public.campaign_variants for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_variants.campaign_id
        and c.status = 'published'
        and (c.starts_at is null or c.starts_at <= now())
        and (c.expires_at is null or c.expires_at >= now())
    )
  );

-- No public policies on campaign_events: inserts happen server-side with the
-- service-role key (sub-project C). RLS-enabled with no policy = deny to anon.
```

- [ ] **Step 2: Apply the migration locally**

Run: `pnpm supabase db push` (or `pnpm db:push`)
Expected: migration applies with no error; three tables exist.

- [ ] **Step 3: Verify schema**

Run: `pnpm supabase db push --dry-run` then in the Supabase SQL editor (or psql): `select count(*) from public.campaigns;`
Expected: returns `0` (table exists, empty).

- [ ] **Step 4: Regenerate types**

Run: `pnpm db:types`
Expected: `src/types/database.ts` now contains `campaigns`, `campaign_variants`, `campaign_events` row types.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260525000001_campaign_engine.sql src/types/database.ts
git commit -m "feat(campaigns): add campaign engine tables + RLS"
```

---

## Task 2: Block schemas (the block library types)

**Files:**
- Create: `src/lib/campaigns/blocks/schema.ts`
- Test: `src/lib/campaigns/blocks/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { blockSchema, blocksSchema } from "./schema";

describe("blockSchema", () => {
  it("parses a valid hero block", () => {
    const hero = {
      type: "hero",
      headline: "Black Friday AGV",
      mediaUrl: "https://cdn/x.jpg",
      mediaType: "image",
      primaryCta: { label: "Shop", href: "/lp/agv" },
    };
    expect(blockSchema.parse(hero)).toMatchObject({ type: "hero" });
  });

  it("rejects an unknown block type", () => {
    expect(() => blockSchema.parse({ type: "nope" })).toThrow();
  });

  it("rejects a hero missing its headline", () => {
    expect(() =>
      blockSchema.parse({
        type: "hero",
        mediaUrl: "x",
        mediaType: "image",
        primaryCta: { label: "a", href: "/b" },
      }),
    ).toThrow();
  });

  it("parses a manual productRail", () => {
    const rail = {
      type: "productRail",
      source: { mode: "manual", productIds: ["id-1", "id-2"] },
    };
    expect(blockSchema.parse(rail)).toMatchObject({ type: "productRail" });
  });

  it("parses an array of blocks", () => {
    const blocks = [
      { type: "richText", html: "<p>hi</p>" },
      { type: "countdown", targetAt: "2026-11-28T00:00:00Z" },
    ];
    expect(blocksSchema.parse(blocks)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/campaigns/blocks/schema.test.ts`
Expected: FAIL — `Cannot find module './schema'`.

- [ ] **Step 3: Write the schema**

```ts
import { z } from "zod";

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const heroBlock = z.object({
  type: z.literal("hero"),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  mediaUrl: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
});

const productRailBlock = z.object({
  type: z.literal("productRail"),
  title: z.string().optional(),
  source: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("manual"), productIds: z.array(z.string()).min(1) }),
    z.object({
      mode: z.literal("auto"),
      by: z.enum(["category", "brand"]),
      value: z.string().min(1),
      limit: z.number().int().min(1).max(24).default(8),
    }),
  ]),
});

const richTextBlock = z.object({
  type: z.literal("richText"),
  html: z.string(),
});

const discountBannerBlock = z.object({
  type: z.literal("discountBanner"),
  code: z.string().min(1),
  text: z.string().min(1),
  expiresAt: z.string().optional(),
});

const countdownBlock = z.object({
  type: z.literal("countdown"),
  title: z.string().optional(),
  targetAt: z.string().min(1),
});

export const blockSchema = z.discriminatedUnion("type", [
  heroBlock,
  productRailBlock,
  richTextBlock,
  discountBannerBlock,
  countdownBlock,
]);

export const blocksSchema = z.array(blockSchema);

export type Block = z.infer<typeof blockSchema>;
export type Blocks = z.infer<typeof blocksSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/campaigns/blocks/schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaigns/blocks/schema.ts src/lib/campaigns/blocks/schema.test.ts
git commit -m "feat(campaigns): block library Zod schema"
```

---

## Task 3: Row types

**Files:**
- Create: `src/lib/campaigns/types.ts`

- [ ] **Step 1: Write the types**

```ts
import type { Blocks } from "./blocks/schema";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "expired"
  | "archived";

export type ServingMode = "split" | "targeting" | "mixed";

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  starts_at: string | null;
  expires_at: string | null;
  redirect_url: string;
  serving_mode: ServingMode;
  default_variant_id: string | null;
  noindex: boolean;
}

export interface CampaignVariant {
  id: string;
  campaign_id: string;
  name: string;
  blocks: Blocks;
  weight: number;
  targeting_rules: unknown[]; // typed in sub-project C
  seo: { title?: string; description?: string };
}

export interface CampaignWithVariants extends Campaign {
  variants: CampaignVariant[];
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/campaigns/types.ts
git commit -m "feat(campaigns): row types"
```

---

## Task 4: Visibility / lazy-expiry helpers

**Files:**
- Create: `src/lib/campaigns/visibility.ts`
- Test: `src/lib/campaigns/visibility.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { isCampaignVisible, isCampaignExpired } from "./visibility";
import type { Campaign } from "./types";

const base: Campaign = {
  id: "c1",
  name: "x",
  slug: "x",
  status: "published",
  starts_at: null,
  expires_at: null,
  redirect_url: "/",
  serving_mode: "split",
  default_variant_id: null,
  noindex: true,
};

const now = new Date("2026-06-01T12:00:00Z");

describe("visibility", () => {
  it("published with no window is visible", () => {
    expect(isCampaignVisible(base, now)).toBe(true);
  });

  it("draft is never visible", () => {
    expect(isCampaignVisible({ ...base, status: "draft" }, now)).toBe(false);
  });

  it("not visible before starts_at", () => {
    const c = { ...base, starts_at: "2026-06-02T00:00:00Z" };
    expect(isCampaignVisible(c, now)).toBe(false);
  });

  it("expired when now is past expires_at", () => {
    const c = { ...base, expires_at: "2026-05-31T00:00:00Z" };
    expect(isCampaignExpired(c, now)).toBe(true);
    expect(isCampaignVisible(c, now)).toBe(false);
  });

  it("not expired when expires_at is in the future", () => {
    const c = { ...base, expires_at: "2026-12-31T00:00:00Z" };
    expect(isCampaignExpired(c, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/campaigns/visibility.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Campaign } from "./types";

export function isCampaignExpired(campaign: Campaign, now: Date): boolean {
  return campaign.expires_at !== null && now > new Date(campaign.expires_at);
}

export function isCampaignVisible(campaign: Campaign, now: Date): boolean {
  if (campaign.status !== "published") return false;
  if (campaign.starts_at !== null && now < new Date(campaign.starts_at)) {
    return false;
  }
  if (isCampaignExpired(campaign, now)) return false;
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/campaigns/visibility.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaigns/visibility.ts src/lib/campaigns/visibility.test.ts
git commit -m "feat(campaigns): visibility + lazy-expiry helpers"
```

---

## Task 5: Variant resolver (Foundation: default/first)

**Files:**
- Create: `src/lib/campaigns/resolve-variant.ts`
- Test: `src/lib/campaigns/resolve-variant.test.ts`

> In A the resolver returns the default variant (or the first). Split/targeting by signals is added in sub-project C, which extends this same function signature.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { resolveVariant } from "./resolve-variant";
import type { CampaignWithVariants } from "./types";

function make(defaultId: string | null): CampaignWithVariants {
  return {
    id: "c1",
    name: "x",
    slug: "x",
    status: "published",
    starts_at: null,
    expires_at: null,
    redirect_url: "/",
    serving_mode: "split",
    default_variant_id: defaultId,
    noindex: true,
    variants: [
      { id: "v1", campaign_id: "c1", name: "A", blocks: [], weight: 1, targeting_rules: [], seo: {} },
      { id: "v2", campaign_id: "c1", name: "B", blocks: [], weight: 1, targeting_rules: [], seo: {} },
    ],
  };
}

describe("resolveVariant", () => {
  it("returns the default variant when set", () => {
    expect(resolveVariant(make("v2")).id).toBe("v2");
  });

  it("falls back to the first variant when no default", () => {
    expect(resolveVariant(make(null)).id).toBe("v1");
  });

  it("returns null when there are no variants", () => {
    const c = { ...make(null), variants: [] };
    expect(resolveVariant(c)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/campaigns/resolve-variant.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { CampaignWithVariants, CampaignVariant } from "./types";

export function resolveVariant(
  campaign: CampaignWithVariants,
): CampaignVariant | null {
  if (campaign.variants.length === 0) return null;
  if (campaign.default_variant_id) {
    const found = campaign.variants.find(
      (v) => v.id === campaign.default_variant_id,
    );
    if (found) return found;
  }
  return campaign.variants[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/campaigns/resolve-variant.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaigns/resolve-variant.ts src/lib/campaigns/resolve-variant.test.ts
git commit -m "feat(campaigns): default variant resolver"
```

---

## Task 6: Data access — getCampaignBySlug

**Files:**
- Create: `src/lib/campaigns/queries.ts`

> Follows the existing pattern in `src/lib/queries/*` using the server Supabase client (`@/lib/supabase/server`). Parses `blocks` through `blocksSchema` so malformed rows fail loudly rather than rendering garbage.

- [ ] **Step 1: Write the implementation**

```ts
import { createClient } from "@/lib/supabase/server";
import { blocksSchema } from "./blocks/schema";
import type { CampaignWithVariants, CampaignVariant } from "./types";

export async function getCampaignBySlug(
  slug: string,
): Promise<CampaignWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `id, name, slug, status, starts_at, expires_at, redirect_url,
       serving_mode, default_variant_id, noindex,
       campaign_variants ( id, campaign_id, name, blocks, weight,
                           targeting_rules, seo )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const variants: CampaignVariant[] = (data.campaign_variants ?? []).map(
    (v: { id: string; campaign_id: string; name: string; blocks: unknown;
          weight: number; targeting_rules: unknown; seo: unknown }) => ({
      id: v.id,
      campaign_id: v.campaign_id,
      name: v.name,
      blocks: blocksSchema.parse(v.blocks),
      weight: v.weight,
      targeting_rules: Array.isArray(v.targeting_rules) ? v.targeting_rules : [],
      seo: (v.seo ?? {}) as { title?: string; description?: string },
    }),
  );

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    status: data.status,
    starts_at: data.starts_at,
    expires_at: data.expires_at,
    redirect_url: data.redirect_url,
    serving_mode: data.serving_mode,
    default_variant_id: data.default_variant_id,
    noindex: data.noindex,
    variants,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. (If the generated DB types make `campaign_variants` nullable in the join, the `?? []` guards already handle it.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/campaigns/queries.ts
git commit -m "feat(campaigns): getCampaignBySlug data access"
```

---

## Task 7: Block components (5 core blocks)

**Files:**
- Create: `src/lib/campaigns/blocks/components/hero.tsx`
- Create: `src/lib/campaigns/blocks/components/product-rail.tsx`
- Create: `src/lib/campaigns/blocks/components/rich-text.tsx`
- Create: `src/lib/campaigns/blocks/components/discount-banner.tsx`
- Create: `src/lib/campaigns/blocks/components/countdown.tsx`

> Each component takes its own block sub-type as props. Reuse storefront primitives where they exist; keep each component small and mobile-first (single-column on phones). `richText` is sanitized.

- [ ] **Step 1: hero.tsx**

```tsx
import Link from "next/link";
import type { Block } from "../schema";

type Hero = Extract<Block, { type: "hero" }>;

export function HeroBlock({ block }: { block: Hero }) {
  return (
    <section className="relative isolate overflow-hidden">
      {block.mediaType === "video" ? (
        <video
          src={block.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.mediaUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-4 py-20 text-center">
        <h1 className="font-russo text-4xl uppercase leading-tight text-white sm:text-5xl">
          {block.headline}
        </h1>
        {block.subhead && (
          <p className="max-w-xl text-base text-neutral-200">{block.subhead}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={block.primaryCta.href}
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
          >
            {block.primaryCta.label}
          </Link>
          {block.secondaryCta && (
            <Link
              href={block.secondaryCta.href}
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              {block.secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: product-rail.tsx**

```tsx
import { ProductGrid } from "@/components/product/product-grid";
import {
  getProductsByIds,
  getProductsByCategory,
  type ProductListItem,
} from "@/lib/queries/products";
import type { Block } from "../schema";

type Rail = Extract<Block, { type: "productRail" }>;

export async function ProductRailBlock({ block }: { block: Rail }) {
  let products: ProductListItem[] = [];
  if (block.source.mode === "manual") {
    products = await getProductsByIds(block.source.productIds);
  } else if (block.source.by === "category") {
    const res = await getProductsByCategory(
      { categorySlug: block.source.value, sort: "popular", page: 1, perPage: block.source.limit },
      "el",
    );
    products = res.data;
  }
  if (products.length === 0) return null;
  return (
    <section className="container mx-auto px-4 py-10">
      {block.title && (
        <h2 className="mb-6 font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
      )}
      <ProductGrid products={products} />
    </section>
  );
}
```

> If `getProductsByIds` does not yet exist in `src/lib/queries/products.ts`, add it: a `select` of the same columns used by `getProductsByCategory`, filtered with `.in("id", ids).eq("status","active")`, mapped to `ProductListItem`. The `brand=auto` path is intentionally omitted from A (added with the full block set in B).

- [ ] **Step 3: rich-text.tsx**

```tsx
import type { Block } from "../schema";

type RichText = Extract<Block, { type: "richText" }>;

// Minimal allowlist sanitizer: strips <script>/<style> and on* handlers.
// Replace with a vetted sanitizer (e.g. isomorphic-dompurify) in B if richer
// HTML is needed; A keeps zero new deps.
function sanitize(html: string): string {
  return html
    .replace(/<\/?(script|style)[^>]*>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "");
}

export function RichTextBlock({ block }: { block: RichText }) {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-10">
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitize(block.html) }}
      />
    </section>
  );
}
```

- [ ] **Step 4: discount-banner.tsx**

```tsx
import type { Block } from "../schema";

type Banner = Extract<Block, { type: "discountBanner" }>;

export function DiscountBannerBlock({ block }: { block: Banner }) {
  return (
    <section className="bg-brand-red px-4 py-4 text-center text-white">
      <p className="text-sm font-bold uppercase tracking-wider">
        {block.text}{" "}
        <span className="rounded bg-white/20 px-2 py-1 font-mono">
          {block.code}
        </span>
      </p>
    </section>
  );
}
```

- [ ] **Step 5: countdown.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Block } from "../schema";

type Countdown = Extract<Block, { type: "countdown" }>;

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export function CountdownBlock({ block }: { block: Countdown }) {
  const target = new Date(block.targetAt).getTime();
  const [t, setT] = useState(() => remaining(target));
  useEffect(() => {
    const id = setInterval(() => setT(remaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return (
    <section className="container mx-auto px-4 py-10 text-center">
      {block.title && (
        <h2 className="mb-4 font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
      )}
      <div className="flex items-center justify-center gap-4 font-russo text-3xl text-brand-red">
        <span>{t.d}d</span><span>{t.h}h</span><span>{t.m}m</span><span>{t.s}s</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

```bash
git add src/lib/campaigns/blocks/components src/lib/queries/products.ts
git commit -m "feat(campaigns): five core block components"
```

---

## Task 8: BlockRenderer

**Files:**
- Create: `src/lib/campaigns/blocks/block-renderer.tsx`
- Test: `src/lib/campaigns/blocks/block-renderer.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockRenderer } from "./block-renderer";
import type { Blocks } from "./schema";

describe("BlockRenderer", () => {
  it("renders a richText and discountBanner in order", () => {
    const blocks: Blocks = [
      { type: "discountBanner", code: "BF20", text: "Save 20%" },
      { type: "richText", html: "<p>hello world</p>" },
    ];
    render(<BlockRenderer blocks={blocks} />);
    expect(screen.getByText("BF20")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders nothing for an empty array", () => {
    const { container } = render(<BlockRenderer blocks={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

> Ensure `vitest.config.ts` uses `environment: "jsdom"` and a setup file importing `@testing-library/jest-dom`. If absent, add `src/test/setup.ts` with `import "@testing-library/jest-dom";` and reference it via `test.setupFiles`. (Note: the async `ProductRailBlock` is not exercised here — keep this test to sync blocks.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/campaigns/blocks/block-renderer.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
import type { Blocks } from "./schema";
import { HeroBlock } from "./components/hero";
import { ProductRailBlock } from "./components/product-rail";
import { RichTextBlock } from "./components/rich-text";
import { DiscountBannerBlock } from "./components/discount-banner";
import { CountdownBlock } from "./components/countdown";

export function BlockRenderer({ blocks }: { blocks: Blocks }) {
  if (blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={i} block={block} />;
          case "productRail":
            return <ProductRailBlock key={i} block={block} />;
          case "richText":
            return <RichTextBlock key={i} block={block} />;
          case "discountBanner":
            return <DiscountBannerBlock key={i} block={block} />;
          case "countdown":
            return <CountdownBlock key={i} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/campaigns/blocks/block-renderer.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaigns/blocks/block-renderer.tsx src/lib/campaigns/blocks/block-renderer.test.tsx
git commit -m "feat(campaigns): block renderer"
```

---

## Task 9: The `/lp/[slug]` route

**Files:**
- Create: `src/app/[locale]/(store)/lp/[slug]/page.tsx`

> Mirrors the resolve/redirect/metadata pattern of `src/app/[locale]/[...path]/page.tsx`. The static `lp/` segment takes precedence over the `[...path]` catch-all, so there is no collision. View-event firing is added in sub-project C.

- [ ] **Step 1: Write the route**

```tsx
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";
import { getCampaignBySlug } from "@/lib/campaigns/queries";
import { isCampaignVisible, isCampaignExpired } from "@/lib/campaigns/visibility";
import { resolveVariant } from "@/lib/campaigns/resolve-variant";
import { BlockRenderer } from "@/lib/campaigns/blocks/block-renderer";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Δεν βρέθηκε" };
  const variant = resolveVariant(campaign);
  return {
    title: variant?.seo.title ?? campaign.name,
    description: variant?.seo.description,
    robots: campaign.noindex ? { index: false, follow: false } : undefined,
    alternates: buildAlternates(locale, `/lp/${slug}`),
  };
}

export default async function CampaignPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const now = new Date();
  if (isCampaignExpired(campaign, now)) {
    redirect({ href: campaign.redirect_url, locale });
  }
  if (!isCampaignVisible(campaign, now)) notFound();

  const variant = resolveVariant(campaign);
  if (!variant) notFound();

  return (
    <main className="min-h-screen">
      <BlockRenderer blocks={variant.blocks} />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: compiles; `/[locale]/(store)/lp/[slug]` appears in the route list.

- [ ] **Step 3: Manual verification — seed a campaign**

Run this SQL in the Supabase SQL editor:

```sql
with c as (
  insert into public.campaigns (name, slug, status, redirect_url, noindex)
  values ('Test BF', 'test-bf', 'published', '/', true)
  returning id
)
insert into public.campaign_variants (campaign_id, name, blocks)
select c.id, 'A', '[
  {"type":"discountBanner","code":"BF20","text":"Black Friday -20%"},
  {"type":"richText","html":"<h2>Καλώς ήρθες</h2><p>Δοκιμαστική καμπάνια.</p>"}
]'::jsonb
from c;
```

- [ ] **Step 4: View it**

Run: `pnpm dev`, then open `http://localhost:3000/el/lp/test-bf`
Expected: the banner and rich text render. Set the campaign `expires_at` to a past date and reload → 301 to `/el`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(store)/lp/[slug]/page.tsx"
git commit -m "feat(campaigns): /lp/[slug] route with lazy expiry"
```

---

## Self-Review (done while writing)

- **Spec coverage (A scope):** data model ✔ (T1), RLS ✔ (T1), block library types ✔ (T2), row types ✔ (T3), lazy expiry ✔ (T4/T9), resolver ✔ (T5), data access ✔ (T6), block components ✔ (T7), BlockRenderer ✔ (T8), `lp/[slug]` route + noindex + redirect ✔ (T9). Analytics events, split/targeting, builder, AI = B/C/D by design.
- **Placeholders:** none — every code step has full code; the one conditional (`getProductsByIds`) has its implementation described.
- **Type consistency:** `resolveVariant(CampaignWithVariants) → CampaignVariant | null`, `isCampaignVisible/Expired(Campaign, Date)`, `BlockRenderer({ blocks: Blocks })`, `getCampaignBySlug(string) → CampaignWithVariants | null` are used identically across tasks 5/6/8/9.

## Out of scope (sub-projects B/C/D)

See `2026-05-25-campaign-engine-bcd-roadmap.md`.
