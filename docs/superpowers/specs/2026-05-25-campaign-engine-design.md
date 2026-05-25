# MotoMarket Campaign Engine Design

A native, self-serve engine that lets a marketer spin up campaign landing pages on the live site — no developer, no redeploy. Each page is data, not code: assembled from a block library that points at existing storefront components, wired live to the real catalog (prices, stock, images), sharing the same cart and checkout. On top of that foundation sit three layers: a self-serve builder, a decisioning layer that serves up to four A/B variants by audience or split, and AI authoring that drafts whole variants from a one-sentence brief.

The value is the integration: separate SaaS tools (Unbounce, Instapage) do landing pages, but none are native to the storefront and tied live to the owner's own ERP/catalog. That combination — AI mass-producing variants × automatic serving per audience × real catalog data — is the differentiator.

## Goals

- A marketer creates a campaign landing page at a URL on the live site with zero developer involvement and zero redeploy.
- Pages always show true catalog data and reuse the site's cart and checkout.
- One campaign can hold up to four variants, served either by random split (for measurement) or by targeting rules (by audience/UTM/source), or both.
- A campaign auto-expires on a date and 301-redirects to a fallback, while its data and analytics are kept for history and cloning.
- AI drafts one or more variants from a natural-language brief, assembling only from the block library and real products; a human always reviews before publish.

## Non-Goals (explicitly out of v1)

- Per-request LLM page generation (LLM building a page from scratch on every visit). Deferred — the architecture allows it later without rework.
- Dynamic block pool (individual blocks filled per-segment from a pre-generated pool). Deferred.
- Statistical-significance calculation for A/B. v1 shows raw metrics plus a simple "leading variant" highlight.
- More than four variants per campaign.
- Root-level vanity URLs (e.g. `/black-friday`). v1 uses the `/lp/` prefix. Vanity can later be added via the catch-all resolver.

## Core Concept

One data model + one dynamic route + a block library that renders existing components. Everything intelligent (AI, A/B, targeting, lifecycle) is a layer over this. No redeploy: a page is a row in the database rendered at request time, exactly as the existing `[...path]` catch-all and `bikes/[slug]` routes already prove.

```
Marketer ──brief──▶ AI authoring (Claude + catalog tool) ──▶ N variants (blocks JSON)
                                                              │  review / edit
                                                              ▼
Admin builder (/admin/campaigns) ──save──▶ Supabase: campaigns + variants + events
                                                              │
Visitor ─▶ /lp/[slug] ─▶ Decisioning (signals→rules→variant) ─▶ BlockRenderer ─▶ live page
                          UTM · geo · device · cookie · split    (existing components)
```

## Sub-Projects

The engine is decomposed into four sub-projects. Each is independently useful and gets its own implementation plan. This spec is the shared source of truth; later sub-projects must not contradict it.

| # | Sub-project | Delivers | Useful alone? |
|---|---|---|---|
| A | Foundation | data model + Zod block schemas + `BlockRenderer` + `/lp/[slug]` route + core blocks + lazy lifecycle | Yes — pages can be created via SQL |
| B | Builder | admin UI + product picker + publish/clone/archive + remaining blocks | Yes — self-serve without a dev |
| C | Decisioning + Analytics | variant serving (split + targeting) + stickiness + event tracking + per-campaign dashboard | Yes — live A/B |
| D | AI authoring | brief → N validated variants, human-reviewed | Yes — the "wow" |

## Data Model (Supabase)

Three tables. RLS on every table (project rule, no exceptions).

### `campaigns`
- `id uuid pk`, `name text`, `slug text unique`
- `status text` — one of `draft | scheduled | published | expired | archived`
- `starts_at timestamptz null`, `expires_at timestamptz null`
- `redirect_url text` — fallback target after expiry (default: site root)
- `serving_mode text` — `split | targeting | mixed`
- `default_variant_id uuid null` — served when no rule matches and no split applies
- `noindex boolean default true`
- `created_by uuid`, `created_at`, `updated_at`

### `campaign_variants`
- `id uuid pk`, `campaign_id uuid fk → campaigns`
- `name text` — human label (e.g. "Sport riders")
- `blocks jsonb` — ordered array of block objects (the page content)
- `weight int default 1` — relative weight for random split
- `targeting_rules jsonb` — ordered rule list (see Decisioning)
- `seo jsonb` — `{ title, description }`

The default variant is referenced solely by `campaigns.default_variant_id` (single source of truth); there is no per-variant default flag.

### `campaign_events`
- `id uuid pk`, `campaign_id uuid fk`, `variant_id uuid fk`
- `type text` — `view | cta_click | add_to_cart | purchase`
- `session_id text` — anonymous session/cookie id for de-duplication and attribution
- `value numeric null` — revenue on `purchase`
- `created_at timestamptz default now()`

### RLS
- Writes on all three tables: admin only (authenticated admin role; service-role for server actions).
- Public `SELECT` on `campaigns` and `campaign_variants`: only where `status = 'published'` and `now()` within `[starts_at, expires_at]`. Drafts/expired are invisible to anon.
- `campaign_events`: inserted **server-side only** (server action / route handler), never directly by the client, to prevent metric tampering.

## Block Library

Each block is a discriminated union member with a Zod schema and a React renderer. The Zod schema is the single source of truth: the renderer consumes it, the builder edits it, and the AI fills it (structured output validated against it). The AI can never emit arbitrary HTML — only block fields. `richText` content is sanitized before render.

| Block | Reuses | Notes |
|---|---|---|
| `hero` | `home/hero.tsx` patterns | image or video, headline, subhead, primary + secondary CTA |
| `productRail` | `home/product-rail.tsx`, product queries | manual product IDs **or** auto source (category / brand / bike-compatibility) |
| `countdown` | new (small) | urgency timer to a target datetime |
| `discountBanner` | new | code + copy + optional expiry |
| `editorial` | `home/editorial-band.tsx` | text + image, alternating layout |
| `comparison` | new | 2–4 products side by side with key specs |
| `faq` | new | accordion |
| `socialProof` | `home/social-proof.tsx` | reviews / ratings / trust stats |
| `brandStrip` | `home/brand-carousel.tsx` | brand logos |
| `emailCapture` | `home/newsletter-band.tsx` | reuses existing newsletter server action |
| `richText` | new | sanitized rich text |
| `stickyCta` | `pdp/mobile-cta-bar` patterns | mobile sticky action |

All blocks are mobile-first: ad traffic is predominantly mobile, and mobile rendering is verified on every UI change (project rule).

## Dynamic Route and Renderer (Sub-project A)

- Route: `/[locale]/lp/[slug]/page.tsx`. The static `lp/` segment takes precedence over the `[...path]` catch-all, so there is no routing collision.
- Request flow:
  1. Resolve campaign by `slug`.
  2. If not found or `status` not publicly visible → `notFound()`.
  3. **Lazy expiry:** if `now > expires_at` → `301` redirect to `redirect_url` (data untouched).
  4. Run the decisioning resolver to pick a variant.
  5. Render `variant.blocks` through `BlockRenderer` (maps `block.type` → component).
  6. Fire a `view` event (server-side).
- `generateMetadata` reads `variant.seo`; campaigns are `noindex` by default (ad-targeted, avoids thin/duplicate-content penalties), overridable per campaign.
- `BlockRenderer` lives in `lib/campaigns/` (or `_components/campaigns/`), is pure, and is unit-testable independently of the route.

## Decisioning Layer (Sub-project C)

A server-side resolver, `lib/campaigns/resolve-variant.ts`, pure and unit-testable. Inputs (signals):

- UTM params / `source` from `searchParams`
- `geo` (country/city) and `device` from Vercel request headers
- new vs returning + sticky bucket from a cookie

Rule application depends on `serving_mode`:

- `targeting` — step 1 then step 3 (no split).
- `split` — step 2 then step 3 (rules ignored).
- `mixed` — step 1, then step 2, then step 3.

Steps:

1. **Targeting** — evaluate each variant's `targeting_rules`; first match wins (e.g. `source = instagram AND device = mobile → this variant`).
2. **Random split** — among eligible variants by `weight`, using a hashed sticky bucket so the same visitor always sees the same variant.
3. **Default** — `default_variant_id`.

The resolver sets a stickiness cookie on first assignment. It performs **no AI call at request time** — assignment is instant and edge-friendly. (Middleware-based assignment is a possible later optimization; v1 resolves in the server component.)

## AI Authoring (Sub-project D)

A server action calls Claude with:

- **System context:** brand voice + the block JSON schema (derived from Zod) + an instruction to assemble only from blocks and never invent HTML, prices, or stock.
- **Tool:** `searchCatalog(query, filters)` returning real products (id, name, price, image) so the model selects existing product IDs.
- **Output:** up to four variants, each a blocks array, returned as structured output and validated against Zod. Invalid output is repaired or rejected, never persisted blind.

The marketer's brief may include audience descriptions, tone, products/categories to feature, and discount. Output is saved as **draft** variants; the marketer previews, edits (it is just builder state), and publishes. Human review is always in the loop.

**Cost tiering:** Haiku for the initial draft, optional Sonnet "polish" pass — matching the existing i18n translation tiering. Generation cost is cents per campaign.

## Admin Builder (Sub-project B)

Under `/admin/campaigns` (existing admin shell):

- **List:** campaigns with status, dates, variant count, and headline metrics.
- **New / edit:** a brief box (AI draft) **plus** a manual block editor.
- **Variant editor:** reorder blocks, edit fields, product picker with catalog search, live preview pane.
- **Serving config:** mode (split / targeting / mixed), per-variant weights, a targeting-rule builder, default-variant selection.
- **Schedule:** `starts_at`, `expires_at`, `redirect_url`.
- **Actions:** publish, unpublish, **clone** (reuse last year's campaign), archive.

## Analytics (Sub-project C)

`campaign_events` powers a per-campaign dashboard: views, CTA clicks, add-to-cart, conversions, and revenue, broken down per variant, with a simple "leading variant" highlight (no significance math in v1). Attribution: when a product is added to cart from an LP, the cart/session is tagged with `campaign + variant`; on `checkout/success`, a `purchase` event is recorded with revenue.

## Lifecycle

Auto-expire → redirect, keep data (the chosen behavior):

- Expiry is evaluated **lazily** at request time — no cron infrastructure required. If `now > expires_at`, the route 301-redirects to `redirect_url`.
- Data, variants, and events are retained for history and cloning.
- An optional `pg_cron` job may flip `status` to `expired` for a clean admin list, but correctness does not depend on it.

## Security

- RLS as specified; writes admin-only; public reads limited to published, in-window campaigns.
- AI output validated against Zod before persistence; no arbitrary HTML; `richText` sanitized.
- `campaign_events` inserted server-side only.
- Service-role key never exposed to client code.
- `noindex` default avoids SEO penalties and any appearance of cloaking.

## Success Criteria

- A marketer publishes a working, on-brand campaign page at `/lp/<slug>` from a one-sentence brief, reviews it, and ships it without a developer or redeploy.
- The page shows live prices/stock and uses the shared cart and checkout.
- A campaign serves up to four variants by split and/or targeting, with sticky per-visitor assignment.
- After `expires_at`, the URL 301-redirects to the fallback and the campaign's data and metrics remain queryable.
- The per-campaign dashboard shows per-variant views, conversions, and revenue with a leading-variant highlight.
- Everything renders mobile-first and passes the project's mobile verification.

## Build Sequence

A → B → C → D. A is the foundation everything else targets. B makes it self-serve. C adds the A/B intelligence and measurement. D adds AI authoring on top. Each sub-project gets its own spec-derived implementation plan.
