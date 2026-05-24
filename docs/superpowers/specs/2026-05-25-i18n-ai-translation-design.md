# i18n + AI Translation — Design Spec

- **Date:** 2026-05-25
- **Status:** Approved direction (brainstorm) — pending written-spec review
- **Branch:** `feat/i18n`
- **Related:** `src/i18n/config.ts` (existing), `project-image-architecture` memory (gap #2), Entersoft stock sync (gap #3)

## Σύνοψη (Greek)

Κάνουμε το storefront πραγματικά πολύγλωσσο, με **ξεχωριστό crawlable URL ανά γλώσσα** (SEO-σωστό), επεκτάσιμο σε **όσες γλώσσες θέλουμε**. Launch με 6 γλώσσες (el default + en, bg, sr, ro, sq). Το **UI/κατηγορίες** τα μεταφράζει ο Claude (δωρεάν, τώρα)· ο **κατάλογος (~11.862 προϊόντα)** γεμίζει από **αυτοματοποιημένο AI batch** (Claude Haiku για όγκο + Sonnet για κρίσιμα, engine-swappable). Νέα γλώσσα = ένα config entry + ένα batch run.

---

## 1. Goal

A fully multilingual storefront where every language is a real, server-rendered, crawlable surface — not a client-side text swap. The system is the "ladder": built once, scales to any number of languages. Catalog text is filled by an automated AI pipeline; UI/static text is filled by Claude during implementation.

**Launch locales (6):** `el` (default), `en`, `bg`, `sr`, `ro`, `sq`. Adding a language later = one entry in `i18n/config.ts` + one batch run. No re-architecture.

## 2. Non-negotiable: the SEO model

A browser-side toggle is invisible to Google → zero ranking in other languages. Therefore:

- **Unique URL per language**, server-rendered. `localePrefix: "as-needed"` → Greek stays at `/` (preserves existing rankings), others at `/en/…`, `/bg/…`, `/sr/…`, `/ro/…`, `/sq/…`.
- **`hreflang` alternates** on every page + `x-default` → `el`.
- **Localized `<title>` / meta** from translated fields.
- **Per-locale sitemap** entries; **canonical per locale**.
- Auto-detect on first visit (cookie `NEXT_LOCALE` + `Accept-Language`) → redirect to the right locale; manual switcher always available.

## 3. Current state (measured 2026-05-25)

- `next-intl` **installed but unused** → we wire it for real.
- `src/i18n/config.ts` already lists the 6 locales → keep & extend.
- Dead `lang: "el"|"en"` toggle in `_components/shell/v3-provider.tsx` → replace with URL-based switcher.
- **Product TEXT is 100% in Supabase** (not proxied): `name` avg 38 chars, `description` avg 505 chars, **11,862 active** (8,566 draft ignored), ~18.8% have empty description.
- ~**719 hardcoded Greek UI strings** across **41** `(store)` components.
- `categories` table has `name`, `description`, `meta_title`, `meta_description`.

**Out of scope here (separate projects, flagged):**
- Gap #2 — **image independence**: `images` column points to `motomarket-shop.gr` (908/1000 active); bytes not yet mirrored to Supabase Storage.
- Gap #3 — **stock**: all active products `stock = 0` (inventory never synced from Entersoft).

## 4. Architecture

### 4.1 Routing (next-intl)
- Wrap the storefront under a `[locale]` segment: `src/app/[locale]/(store)/…`.
- next-intl **middleware** handles detection (cookie + `Accept-Language`) and redirect.
- `localePrefix: "as-needed"`, `defaultLocale: "el"` → existing Greek URLs unchanged.

### 4.2 Two translation layers
**Layer A — Static (UI + category labels + static page copy)**
- next-intl message catalogs: `messages/{el,en,bg,sr,ro,sq}.json`.
- Components refactored from hardcoded Greek → `t("namespace.key")`.
- **Filled by Claude during implementation — €0.**

**Layer B — Dynamic catalog (products + category DB content)**
- New tables `product_translations`, `category_translations`.
- Query layer reads the active locale, `LEFT JOIN` translation, `COALESCE` → `el` fallback (never blank).
- **Filled by the AI batch pipeline.**

### 4.3 DB schema (new migration)
```sql
create table product_translations (
  product_id   bigint references products(id) on delete cascade,
  locale       text not null,
  name         text,
  description  text,
  source_hash  text,            -- hash of source fields → re-translate only on change
  engine       text,            -- e.g. "claude-haiku" / "claude-sonnet"
  translated_at timestamptz default now(),
  primary key (product_id, locale)
);
create table category_translations (
  category_id      bigint references categories(id) on delete cascade,
  locale           text not null,
  name             text,
  description      text,
  meta_title       text,
  meta_description text,
  source_hash      text,
  engine           text,
  translated_at    timestamptz default now(),
  primary key (category_id, locale)
);
-- RLS: public read; service-role write only.
```

### 4.4 AI translation pipeline
- `scripts/translate-catalog.ts` — **engine-agnostic interface** (swap Claude Haiku / Sonnet; could swap to MT later).
- **Hybrid:** Sonnet for short, SEO-critical fields (`name`, category meta); Haiku for the bulk (`description`).
- **Glossary of non-translatables:** brand names, model names, sizes (S/M/L + numeric), CE levels, SKU/EAN, units → preserved verbatim.
- **Resumable & idempotent:** selects rows missing a translation for locale X *or* whose `source_hash` changed; batches via the Batch API (−50%); writes back.
- **Validation gate:** `--sample N` translates N products first; user reviews the EN output before the full run.
- Runs from any environment with Supabase access — **does not need the legacy origin** (text only).
- **Cost (measured):** ~€9 / language for the full active catalog. 6 langs ≈ €45–55; + Sonnet on names ≈ +€10–20. UI/categories by Claude = €0.

### 4.5 Query-layer changes
- `getProduct`, `getProductsByCategory`, `searchProducts`, `getRelatedProducts`, and the `categories.ts` functions accept a `locale`, join the translation table, `COALESCE` to `el`.
- Preserve `"use cache"` + `cacheTag` (tag per locale).

### 4.6 Language switcher
- Replace the dead toggle. URL-based locale change **preserving the current path**; persist `NEXT_LOCALE` cookie. Mobile-first (verify on phone per project rule).

### 4.7 Slugs
- Keep the `el` slug across all locales initially (e.g. `/en/product/<el-slug>`). Localized slugs = future option (adds routing complexity; YAGNI now).

## 5. Scope

**In:** next-intl wiring, `[locale]` routing + middleware, two translation layers, new schema, AI pipeline + validation gate, SEO tags + per-locale sitemap, URL switcher, 6 locales, UI translation by Claude.

**Out (separate projects):** image mirror (gap #2), Entersoft stock sync (gap #3), fallback MT widget for non-enabled languages, localized slugs, currency/number/date formatting beyond next-intl defaults.

## 6. Phasing

1. **Infra** — wire next-intl, `[locale]` routing, middleware, switcher, message scaffolding; translate **el + en** UI. Site is bilingual el/en (catalog falls back to el).
2. **SEO** — hreflang + `x-default`, localized metadata, per-locale sitemap, canonical.
3. **Schema + read path** — translation tables + query-layer join + el fallback.
4. **AI pipeline** — build + validation gate; run **en first**, verify quality, then full.
5. **Scale** — add `bg/sr/ro/sq` UI catalogs + run their batches.

## 7. Testing

- **Unit:** locale detection/redirect; message-key coverage; translation fallback (missing → el); query-layer `COALESCE`.
- **Pipeline:** glossary non-translatables preserved; `source_hash` triggers re-translation; idempotent re-runs.
- **SEO:** hreflang + canonical present per page; sitemap contains all locale URLs; localized `<title>`/meta render server-side.
- **Mobile-first:** switcher verified on phone viewport.

## 8. Risks / gotchas

- **Next 16 is non-standard** (see `AGENTS.md`) — read `node_modules/next/dist/docs/` for App Router i18n before coding routing.
- Moving `(store)` under `[locale]` is a **large structural change** — do it on `feat/i18n`, verify `pnpm build` green (not just `tsc`).
- `components.css` flips to **CRLF after edits/checkout** → normalize to LF or reveal/hero source-string tests break.
- Per-locale pages multiply route count on Vercel → confirm caching holds.
- **Never push to `main`** without explicit per-deploy authorization.
