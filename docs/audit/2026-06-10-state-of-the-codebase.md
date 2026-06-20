# MotoMarket β€” State of the Codebase Audit (2026-06-10)

Repo: `C:\Users\ntont\Desktop\motosite\moto_eshop` Β· All findings verified against actual files; refuted findings dropped, adversarially-adjusted severities applied.

---

## 1. Executive Summary β€” pou vriskomaste

- **Build health is genuinely green**: typecheck (strict), 256/256 tests across 52 files, clean production build (278 pages), and CI with all four gates (lint/typecheck/test/build) **blocking** β€” the STANDARDS.md claim that lint+test are non-blocking (#28) is stale.
- **The Track A money path is sound**: checkout is server-authoritative per ADR 0001 (`(store)/checkout/actions.ts` + `src/lib/checkout/pricing.ts`), exhaustively tested including tampering attacks. ADR 0004 (single v3 storefront) is correctly shipped.
- **Two critical secrets problems are live right now**: the Entersoft API key is committed in git history (`docs/env-setup.md`, commit `2c4e8d2`) AND hardcoded in a tracked script (`scripts/pull-entersoft-data.ps1:6`). Rotation has not happened despite a standing memory flag.
- **A critical i18n logic bug ships today**: `getProduct`/`overlayListNames` bypass translation when `locale === "en"`, but the catalog source is **Greek** β€” every `/en/...` visitor sees Greek product names with zero translation attempt (`src/lib/queries/products.ts:257,133`).
- **The cart story is a faΓ§ade**: the live storefront cart is 100% localStorage; the DB cart (`src/lib/actions/cart.ts`) is fully written but unwired, blocked by RLS policies that silently reject all guest operations, accepts client/model-supplied prices into `cart_items.unit_price`, and `mergeGuestCartOnLogin` is never called β€” guest carts are always lost on login.
- **SEO plumbing contradicts ADR 0002**: the sitemap emits leaf slugs instead of `full_path` for both products and categories (wrong canonical URLs for everything nested), and cart/chat components hardcode prefixed `/product/{slug}` links.
- **Roadmap reality**: only **S-0.1** is done. R2 (β‚¬4.8k) and R3 (β‚¬3.2k) revenue remain non-invoiceable; all Entersoft sync slices (S-1.6β€“S-1.10) are absent but documented as blocked on client credentials. Live stock checks would silently truncate at 500 of ~49k ERP rows.
- **Auth has zero test coverage** despite STANDARDS.md requiring 100% branch coverage: `src/lib/auth/actions.ts`, `guards.ts`, and both OAuth callback routes are entirely untested.

---

## 2. Critical & High Issues

| # | Issue | Status | Severity | Evidence | What must be done |
|---|-------|--------|----------|----------|-------------------|
| 1 | Entersoft API key committed in git history in tracked doc | exists | **critical** | `docs/env-setup.md:15` (key + URL literal), tracked since commit `2c4e8d2`; verified `git ls-files` + `git log -S '78874555'` | Rotate key with vendor NOW; replace literals with placeholders; scrub history (BFG/filter-repo); add gitleaks to CI |
| 2 | Same key hardcoded in tracked script + plaintext `.env` | risk | **critical** | `scripts/pull-entersoft-data.ps1:6` (tracked, key in history); `.env:19` (untracked but live) | Same rotation; script must read `$env:ENTERSOFT_API_KEY` |
| 3 | `/en/` locale bypasses translation but DB source is Greek | broken | **critical** | `src/lib/queries/products.ts:257` `if (locale === "en") return product`; `:133` same in `overlayListNames`; translate-engine confirms Greek source; `categories.ts:87` has the correct `"el"` guard | Change both guards from `"en"` to `"el"`; fix misleading comment; add a test with seeded en translation row |
| 4 | RLS blocks all guest DB-cart operations (silent failure) | broken | **critical** | `supabase/migrations/20260401000006_carts.sql:22-36,58-92` β€” all `cart_items` policies gate on `user_id = auth.uid()`; guest `auth.uid()` is null; `cart.ts:5` uses RLS client. The chat (20260527) `app.session_id` GUC pattern was never backported to carts | Backport the `current_setting('app.session_id', true)` guest-scoping pattern to carts/cart_items policies (or switch actions to admin client + app-level ownership checks). Required before Track D2 |
| 5 | Auth actions, guards, OAuth callback/confirm routes: zero tests | missing | **critical** | `src/lib/auth/actions.ts` (6 functions), `src/lib/auth/guards.ts` (4 functions), `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts` β€” no matching test file anywhere in 52-file suite; STANDARDS Β§1 demands 100% branch coverage on auth | Add `auth/actions.test.ts`, `auth/guards.test.ts`, and route tests covering all redirect/error branches |
| 6 | `addToCart` (action + Pit AI tool) writes caller-supplied `unitPrice` to DB | risk | **high** | `cart.ts:13-18,135`; `chat/tools/add-to-cart.ts:7,37` β€” model can be prompted into storing an arbitrary price; `/api/cart/summary` then reports the spoofed total (`route.ts:25-27`) | Remove `unitPrice` from both schemas; fetch price server-side by productId inside `addToCart` |
| 7 | `mergeGuestCartOnLogin` never called β€” guest cart lost on login | broken | **high** | Defined `cart.ts:223`, exactly one grep hit (the definition); no call in `login-client.tsx`, `auth/actions.ts`, `use-auth.ts`, or OAuth callback. Also: live cart is localStorage, so the merge would target the wrong cart anyway | Track D2: call merge post-login AND migrate localStorage lines (slug+qty β†’ UUID resolution) into the DB cart |
| 8 | Two disconnected cart systems (localStorage UI vs unused DB cart) | risk | **high** | `v3-provider.tsx:38-89` (`mm-v3-cart` key); `buy-box.tsx`, `cart/page.tsx:16`, `checkout/page.tsx:32` all useV3-only; DB actions have zero (store) consumers; legacy `src/components/cart/cart-item-row.tsx` calls DB actions but is unmounted | Document in STATUS.md; Track D2 wires UIβ†’DB cart; adopt or delete `cart-item-row.tsx` |
| 9 | Sitemap emits leaf slug instead of `full_path` for products AND categories | broken | **high** | `src/app/sitemap.ts:28` selects `categories:category_id(slug)`, `:36` builds `/${catSlug}/${slug}`; `:54` selects only `slug`, `:56-62` emits `/${cat.slug}`. ADR 0002 mandates clean form; `productPath`/`categoryPath` helpers in `_lib/urls.ts` exist unused here | Select `full_path` in both queries; build URLs via the existing helpers |
| 10 | ADR 0002 violated: cart-panel, cart page, chat product cards emit prefixed URLs | broken | **high** | `cart-panel.tsx:126`, `cart/page.tsx:40,57,134`, `chat-product-card.tsx:24,44`, `chat-product-compare.tsx:51` β€” every cartβ†’PDP and AIβ†’PDP click takes a redirect hop | Replace with `productPath()`/`categoryPath()`; add `category_path` to `ChatProductSummary` |
| 11 | `getStockForProduct` fetches only page 1 (500 of 49,378 stock rows) | risk | **high** | `src/lib/erp/index.ts:94` single `listStock({page:1, pageSize:500})`; adapter passes `Code: WILDCARD`; `paginate()` exists unused (`client.ts:117-149`); pull script confirms 49,378 rows | Paginate, or per-SKU PQ filter, or route checkStock through synced `product_stock_locations` |
| 12 | `categories.full_path` backfilled only by external script β€” fresh deploy 404s every category | risk | **high** | Migration `20260513000003_category_full_path.sql:13` comment "Filled by scripts/backfill-category-paths.ts"; `getCategoryByPath` returns null on NULL β†’ `notFound()` in catch-all | Move backfill into an idempotent migration; keep script as repair tool |
| 13 | Missing `OPENAI_API_KEY` β†’ silent total chat failure | broken | **high** (adjusted from critical) | `api/chat/route.ts:172` calls `openai("gpt-4o")` unguarded; `chat-provider.tsx:69-72` swallows stream errors in prod | Add a 503 gate with Greek user message at top of POST; surface errors in chat UI |
| 14 | Live OpenAI key + Supabase service_role JWT in plaintext `.env` on disk | risk | **high** | `.env:43` (sk-proj-β€¦), `.env:12` (service_role). Never committed (gitignore `β€‹.env*` covers it) but used as the live runtime secrets store | Rotate; move to `.env.local`/Vercel env only |
| 15 | Campaign analytics: `cta_click` and `add_to_cart` events never fired | broken | **high** | Only two `recordCampaignEvent` call sites: `campaign-tracker.tsx:36` (view), `campaign-purchase-tracker.tsx:24` (purchase); hero/sticky-cta CTAs are plain Links | Add onClick tracking to HeroBlock/StickyCtaBlock CTAs and the product-rail add-to-cart path β€” A/B data is misleading until then |
| 16 | Cart server actions + merge: zero tests | missing | **high** | `cart.ts:84-288` β€” only the chat tool wrapper is tested, with `vi.mock('@/lib/actions/cart')` replacing everything | Add `cart.test.ts` covering Zod rejection, guest/authed branches, qty accumulation, merge branches |
| 17 | Catalog DATA i18n entirely blocked on owner | partial | **high** | Pipeline complete (`translate-catalog.ts:310` requires `ANTHROPIC_API_KEY`; migration `20260525000001` in repo); STATUS.md:58-60 documents the block | Owner: apply migration + set key in Vercel + run `pnpm i18n:translate` per locale |

**Refuted (dropped):** "Open redirect via `?next=`" β€” exploit not reproducible; `.pathname` assignment cannot escape origin (residual low-severity internal-path concern only). "Admin reindex route open when secret unset" β€” logic inverted; the route returns 401 for all callers when env var is missing.

---

## 3. By Dimension

### Build health β€” verdict: **strong**
Clean typecheck/test/build; CI fully blocking. Notable mediums: `src/middleware.ts` deprecation warning (rename to `proxy.ts` per Next 16 β€” read `node_modules/next/dist/docs/` first); `@vitest/coverage-v8` not installed so the 100%-branch-coverage standard is unenforceable; `vitest.config.mjs:9` excludes `scripts/**` and `.test.tsx` files. Low: 20 lint warnings incl. a malformed eslint-disable in `admin/campaigns/_components/product-picker.tsx:106-108`.

### Routing & rendering β€” verdict: **architecture right, links/sitemap wrong**
ADR 0004 correctly shipped: catch-all renders v3 `ProductView`/`CategoryView`, awaits `params`/`searchParams` (baked-404 regression absent), prefixed routes have no self-canonical pages. But ADR 0002 is violated at the link layer (issues 9β€“10 above). Mediums: dead if/else in `resolvePath` plus a `canonicalPath.length > 1` guard that suppresses redirects for root-category products (`[...path]/page.tsx:90-104,194`); `bikes/[slug]/page.tsx` still imports legacy `ProductCard` using `category_slug`; wishlist page same class of bug. Low: docs say 301, code ships 308 (code is right β€” fix docs); `generateStaticParams` fetches 50 slugs, seeds 10.

### Cart & checkout β€” verdict: **checkout solid, cart fictional**
ADR 0001 fully honored at checkout (gold-standard tests). Everything cart-side is scaffolding with real defects (issues 4, 6β€“8, 16). Mediums: `placeOrder` is an unauthenticated, un-rate-limited server action (order spam vector β€” add rate limit before go-live); DB cart never cleared after checkout; `FREE_SHIPPING_THRESHOLD = 50` (`src/lib/cart/utils.ts:3`) is likely a business mistake for a helmet shop β€” confirm with owner; possible header-badge inconsistency if `CartProviderServer` is ever mounted alongside V3Provider. Demoted to low (RLS already prevents cross-user mutation): missing ownership pre-checks in `updateQuantity`/`removeFromCart`.

### ERP / Entersoft β€” verdict: **seam good, operation blocked, two time bombs**
`IErpAdapter` + `EntersoftAdapter` complete; checkStock SKU resolution fixed and tested; checkout correctly Supabase-authoritative. Issues 1β€“2, 11 above. Mediums: `FAR_FUTURE_DATE = '2026-12-31'` (`mappers.ts:17`) β€” all date-filtered PQ calls return zero rows after that date, in ~6 months; zero tests for adapter/client/mappers; bulk sync is offline-snapshot-driven, bypassing the typed adapter; missing-key failure happens at request time not boot. S-1.6β€“S-1.10 absence is **documented client-blocked** (medium, not an engineering miss).

### Security & secrets β€” verdict: **fundamentals good, hygiene bad**
RLS enabled on all 47 tables; admin double-guarded via `requireAdmin()`/`getUser()`; guest checkout service_role use is intentional and documented. Issues 1β€“2, 14 above. Mediums: ~35 raw `process.env` reads outside `env.ts` violating Standard 7 (supabase factories use `!` assertions β€” worst offenders); `newsletter.ts` uses service_role with no rate limit; `alias-redirects.ts` reads service_role key raw in Edge middleware and fails open; real Supabase project URL committed in `docs/env-setup.md:9`. Low: `use-auth.ts:23` uses `getSession()` (UI-only, no authz decisions).

### Catalog & data β€” verdict: **schema excellent, cache-error handling inconsistent**
Schema well-indexed and matches TS models; negative-cache fix correctly applied to `getProduct`/`getCategory` with tests. Issue 12 above. Mediums: `getProductsByCategory` (has `"use cache"`) swallows errors as empty results β€” the exact negative-cache bug, unfixed here (`products.ts:348-351`); `searchProducts` same swallow but no cache (UX-only); `getProductFilters` caches empty filters for hours on error (`products.ts:523`); `images_cdn` never selected by storefront `getProduct` (chat tools already prefer it); `revalidateTag(tag, 'seconds')` β€” invalid second arg, silently ignored (`cache/revalidate.ts:15`); `products.stock` is the stale seeded integer, multi-warehouse view never queried. Low: memory's "`--` slug separator" claim is outdated β€” code uses `/` path separation.

### AI assistant (Pit) β€” verdict: **well-tested tools, ungated runtime**
All 9 tools have unit tests; chat-table RLS with session GUC is correctly implemented; `navigateTo` checkout block is sound. Issues 6 (tool price), 11, 13 above. Mediums: rate limiting silently disabled without Upstash AND `CHAT_DAILY_USD_CAP` declared but never enforced β€” unlimited free chat for anonymous users; `chat_user_context` has no write tool (Pit can never persist "what bike do you ride"); `handoffToHuman` `delivered:false` has no prompt instruction (Pit may claim a handoff succeeded); checkStock error shape lacks a structural `available` flag (adjusted to medium β€” error string is explicit, behavior model-dependent). Low: Meili fallback drops brand/category filters (documented).

### i18n β€” verdict: **infrastructure excellent, one critical bug, blocked data**
6 locales, 320 symmetric keys, correct next-intl setup, hreflang/sitemap alternates tested in blocking CI. Issue 3 (critical en-bypass) and 17 (blocked data) above. Mediums: hardcoded Greek 404/fallback metadata strings leak into all locales (`[...path]/page.tsx:137,160,165`; `lp/[slug]/page.tsx:25`); `LocaleProvider` combines `"use cache"` with `now={new Date()}` and no cacheTag/cacheLife. STATUS stale: i18n is merged to main, not "PR #2 open"; key count is 320 not 319.

### Campaign Engine β€” verdict: **shipped and tested, analytics half-blind**
All four subsystems exist; decisioning modules thoroughly unit-tested. Issue 15 above. Mediums: `ai/providers.ts` raw env reads; `generateCampaignVariants` untested; storage bucket SQL + AI key are pending owner actions. Lows: four block components use raw `<img>`; `getCampaignBySlug` uses `blocksSchema.parse` (one bad block 500s a published LP β€” use safeParse); LP `generateMetadata` noindex untested.

### Tests & coverage β€” verdict: **strong where it exists, absent where the standard demands it**
`priceOrder` and `placeOrder` are gold-standard. Critical/high gaps: auth actions/guards/OAuth routes (issue 5), cart actions + merge (issue 16). Mediums: `checkRateLimit` bypass branch untested; `/api/chat` POST handler untested. Lows: `.test.tsx` excluded from vitest glob (latent trap); STANDARDS Β§6 "non-blocking CI" claim stale.

---

## 4. What Exists vs What Is Missing

| EXISTS (verified working) | MISSING / NOT WIRED |
|---|---|
| Server-authoritative checkout (ADR 0001) with attack-case tests | DB-backed cart in the UI (Track D2 unstarted); guest-cart RLS policies |
| Single v3 storefront via catch-all (ADR 0004); 308 alias redirects | `mergeGuestCartOnLogin` invocation; localStorageβ†’DB cart migration |
| Strict-mode clean typecheck, 256 green tests, blocking 4-gate CI | Coverage tooling (`@vitest/coverage-v8`); any auth/cart/chat-route tests |
| ERP adapter seam (`IErpAdapter` + EntersoftAdapter, 5 methods) | Scheduled ERP sync (S-1.6β€“S-1.10, client-blocked); adapter/mapper tests |
| checkStock SKU resolution (Track A #16 fix, tested) | Per-SKU stock query (500-row truncation); `available` flag in tool result |
| RLS on all 47 tables; admin guards; chat session-GUC scoping | Carts guest policies; rate limiting (Upstash unset); `CHAT_DAILY_USD_CAP` enforcement |
| i18n UI: 6 locales Γ— 320 symmetric keys, merged to main | Catalog data translations (owner-blocked); correct `el` bypass guard |
| Campaign Engine end-to-end + decisioning tests | `cta_click`/`add_to_cart` events; storage bucket in prod; AI keys in Vercel |
| `env.ts` fail-fast schema; `reportError` seam | Enforcement of "no raw process.env" (~35 violations); monitoring provider ADR |
| Sitemap + hreflang alternates infrastructure | Correct `full_path` URLs in sitemap; clean URLs in cart/chat links |
| `full_path` column, `urls.ts` helpers, backfill script | In-migration backfill (fresh deploy breaks); `images_cdn` in storefront queries |

---

## 5. Docs-vs-Reality Drift

1. **STANDARDS.md Β§6 vs `.github/workflows/ci.yml`** β€” doc says lint+test non-blocking pending #28; workflow has all four steps blocking with no `continue-on-error`. Update the doc, close/verify #28.
2. **CONTEXT.md + ADR 0002 say "301"** β€” code ships HTTP 308 (`middleware.ts:47`, `permanentRedirect` in both prefixed routes). Code is correct; update docs to 308.
3. **STATUS.md missing Track D entries** (adjusted: medium) β€” the shipped D1 work is the catch-all `[...path]/page.tsx` rendering v3. Note: the prefixed dirs contain **no `page.tsx`** at all (only `redirect-target.ts` helpers + middleware handles aliases) β€” record D1 accurately, not as "thin redirect pages".
4. **STATUS.md lists Track C #24 (STANDARDS.md) as in-flight** β€” `docs/STANDARDS.md` exists, complete, same-day timestamp. Move to Done; verify #25.
5. **STATUS.md says "i18n PR #2 open"** β€” all i18n commits are on main (`4f962a9`β€¦`5dcd9c2`). Move to Done; correct key count 319β†’320.
6. **ADR 0002 vs sitemap.ts** β€” ADR mandates clean canonical form; sitemap emits leaf slugs (issue 9).
7. **ADR 0001 "cart_items.unit_price is display-only"** β€” the display value is writable by client/model (issue 6); the doc's safety implication doesn't hold for the cart surface.
8. **`products.ts:257` comment "catalog source text is English"** β€” false; source is Greek (translate-engine confirms). The comment justified the critical bug.
9. **GitNexus index frozen at `c8f750c` (2026-06-04)** β€” predates all Track D work; the mandated impact/detect workflow runs on a stale graph. Run `npx gitnexus analyze`.
10. **STANDARDS rule 7 ("no raw process.env outside env.ts")** β€” violated by ~35 callsites including supabase factories, middleware, ERP, Meili, campaign providers.
11. **Memory claim "slug separator `--`"** β€” superseded; code uses `/`-separated `full_path`. Verify CONTEXT.md matches.

---

## 6. Recommended Action Plan

**P0 β€” today (security + correctness, each <1 hour)**
1. Rotate the Entersoft API key with the vendor; replace literals in `docs/env-setup.md` and `scripts/pull-entersoft-data.ps1` with env-var reads/placeholders; run BFG on history; add gitleaks to CI.
2. Rotate the OpenAI key and Supabase service_role key sitting in plaintext `.env`; keep live secrets only in Vercel env / `.env.local`.
3. Fix the i18n bypass: `products.ts:257` and `:133` β€” change `"en"` β†’ `"el"`, fix the comment, add a regression test.

**P1 β€” this week (revenue-path and SEO correctness)**
4. Sitemap: select `full_path` for both products and categories; build URLs with `productPath()`/`categoryPath()` (`src/app/sitemap.ts:28,36,54-62`).
5. Replace prefixed hrefs with clean-URL helpers in `cart-panel.tsx:126`, `cart/page.tsx:40,57,134`, `chat-product-card.tsx:24,44`, `chat-product-compare.tsx:51`.
6. Remove `unitPrice` from `AddToCartSchema` and the Pit tool schema; fetch price server-side inside `addToCart`.
7. Add the OPENAI_API_KEY 503 gate to `/api/chat` with a Greek user message; surface stream errors in the chat UI.
8. Fix negative-cache swallows: throw on error in `getProductsByCategory` and `getProductFilters` (match `getProduct` pattern).
9. Move the `full_path` backfill into an idempotent migration.
10. Add rate limiting to `placeOrder` and `subscribeToNewsletter`.

**P2 β€” next 2 weeks (debt the standards already promise)**
11. Write auth tests: `auth/actions.test.ts`, `auth/guards.test.ts`, callback/confirm route tests (Standard 1 says 100% branch coverage β€” currently 0%).
12. Write `cart.test.ts` covering all action and merge branches.
13. Install `@vitest/coverage-v8`; add coverage thresholds for payment/auth paths; widen include glob to `{ts,tsx}`.
14. Fix `FAR_FUTURE_DATE` (compute dynamically or `2099-12-31`) + add a future-date assertion test.
15. Replace raw `process.env` reads with `env` imports β€” start with `supabase/{server,admin,client,public}.ts`, `middleware.ts`, `alias-redirects.ts`.
16. Rename `src/middleware.ts` β†’ `proxy.ts` per Next 16 deprecation (read `node_modules/next/dist/docs/` first).
17. Fix `getStockForProduct`: paginate via existing `client.paginate()` or per-SKU PQ; add structural `available` flag to `CheckStockResult` + prompt instruction.
18. Wire `cta_click`/`add_to_cart` campaign events; switch `getCampaignBySlug` to `safeParse`.

**P3 β€” Track D2 prerequisites and docs hygiene**
19. Fix carts RLS for guests (backport the `app.session_id` GUC pattern from the chat migration) β€” hard prerequisite for D2.
20. Track D2 proper: wire BuyBox/cart page to DB cart, call `mergeGuestCartOnLogin` + localStorage migration on login, clear DB cart post-checkout, adopt-or-delete `cart-item-row.tsx`.
21. Doc sweep in one PR: STATUS.md (Track D1 accurately, #24 done, i18n done, 320 keys), STANDARDS Β§6 (CI fully blocking), CONTEXT/ADR 0002 (308), ADR 0004 (list surviving src/components consumers); run `npx gitnexus analyze`.
22. Confirm `FREE_SHIPPING_THRESHOLD=50` with the owner; localize hardcoded Greek metadata fallbacks; resolve `LocaleProvider` `"use cache"`/`new Date()` tension.