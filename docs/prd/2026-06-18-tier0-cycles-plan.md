# Tier-0 + Commerce + Fitment — Cycle Plan

> Working tracker for breaking 13 items into grill → PRD → issues cycles.
> Created 2026-06-18. Not canonical roadmap (see `ROADMAP.md`); this is the delivery batching for the current push.

## Sequencing principle (the thing that prevents re-passes)

**Ο καμβάς πρώτα, με δεσμευμένα slots → τα features πέφτουν προσθετικά → κάθε shared data model σχεδιάζεται μία φορά.**

The cinematic home language already exists live in production (Industrial Race style). The visual cycle *extends* it to each surface and reserves slots (size-picker, reviews block, compatible badge, wishlist/garage) so later feature work drops in additively without re-styling. Building features first then re-styling = guaranteed 2–3 passes; that is what this ordering avoids.

## The 4 cycles (run in order)

| # | Cycle | Items | Shared model | Status |
|---|---|---|---|---|
| 1 | **Visual cinematic frame** | 0.1 PDP · 0.2 PLP · 0.3 Cart · 0.4 Checkout · 0.5 Account | — (design system + reserved slots) | ✅ **MERGED to main** (2026-06-19) — PRs #126–#130 squashed; issues #119–#125 all closed |
| 2 | **Size + Wishlist** | S-2.8 size variants · S-2.11 wishlist server-persisted | `wishlists` table (+ `product_stock_locations.size` exists) | ✅ grill ✅ PRD ([#131](https://github.com/ntontischris/moto_eshop/issues/131)) ✅ issues (size 1→2→3 = #132→#134→#135 · wishlist 4→5 = #133→#136) |
| 3 | **Reviews** | S-2.9 write & display · S-2.10 admin moderation | `reviews` table + verified-buyer + moderation states | ⬜ grill ⬜ PRD ⬜ issues |
| 4 | **Fitment system** | S-4.1 garage · S-4.2 fitment tagging · S-4.3 PLP filter · S-4.4 PDP badge | `user_bikes` + `products.fitment_keys` + matching logic | ⬜ grill ⬜ PRD ⬜ issues |

## Roadmap mapping

- 0.1–0.5 → new work, extends `docs/superpowers/specs/2026-05-13-home-product-cinematic-design.md`
- S-2.8–2.11 → R2 (Real Commerce)
- S-4.1–4.4 → R4 (Retention)

## Notes

- Each cycle = one grill session → one PRD (`to-prd`) → one batch of issues (`to-issues`).
- Cycle 1 MUST ship first and reserve slots for: PDP (size picker, reviews block, compatible badge), PLP (fitment filter chip), Account (wishlist, garage).

## Cycle 1 — grilled scope (2026-06-18)

**Reality check:** most surfaces are ALREADY 80–90% cinematic (tokens in `(store)/_styles/tokens.css`, v3-display/v3-body fonts, `--v3-red` #e4111f). So Cycle 1 is **Consistency + gap-closing + slot reservation**, NOT a redesign. Chosen over "Elevation" because re-touching 90%-done pages risks regressing the recent CWV/LCP perf work (ADR 0006, 0008).

| Surface | Current | Cycle-1 work | Reserved slots |
|---|---|---|---|
| Wishlist | ❌ light theme | dark theme swap → parity | — |
| Garage | ❓ likely light | audit + dark theme swap | bike-list (S-4.1) |
| Account | ✅ ~70% | polish to parity + nav slots | garage/wishlist/order-detail nav |
| PDP | ✅ ~80% | close 2 gaps: mobile sticky add-to-cart bar (CSS-only) + gallery lightbox (native `<dialog>`, no lib) | size-badge-per-size (S-2.8), Reviews tab (S-2.9), compatible-badge in buy-box (S-4.4) |
| PLP | ✅ ~85% | none (left as-is) | filter-chip «Ταιριάζει στη μηχανή μου» (S-4.3) |
| Cart | ✅ ~90% | none | — |
| Checkout | ✅ ~85% | none (payment = R2 feature work) | payment-method slot |
| Shared UI | light-only | dark v3 variants of `button`, `card`, `badge`, `input`, `dialog/sheet` (only what features need) | — |

**Explicit defers (judgment calls):** PLP bento/hero (gold-plating), Checkout payment methods (R2 feature), Account profile-edit/addresses/order-detail (feature work). Cycle 1 reserves their slots only.

**Perf guardrail:** PDP gap-closers must be lightweight — sticky bar = CSS-only, lightbox = native `<dialog>`, no JS library (ADR 0008: LCP = JS load delay).

## Cycle 2 — grilled scope (2026-06-19)

**Reality check (changed the plan):** the backend for both items already exists; this cycle is **integration + missing pieces**, not greenfield.

- **S-2.8 Size variants** — `product_stock_locations` is populated (26,862 rows; view `v_product_available_stock` sums per (product,size) with reservations) and `cart_items.size` + dedup + `mergeGuestCartOnLogin` already support a size dimension. Missing: the `Product` query doesn't load per-size availability, and the PDP `deriveSizes` shows a hardcoded `XS–XXL` fake list. Grilled decisions:
  - Size list comes from per-size stock data; the fake `XS–XXL` fallback is **deleted**. Product with no stock rows → no size picker (no invented sizes).
  - Size codes are ERP zero-padded → strip leading zeros for display, raw code to cart/ERP, messy tail (`LXL`, `39-42`) shown verbatim. See **ADR 0009**.
  - Three per-size states: **Διαθέσιμο** (>3) · **Περιορισμένα** (1–3) · **Εξαντλημένο** (0, disabled).
  - Add-to-cart: live CTA always enabled; press without size → scroll+highlight picker (`Διάλεξε μέγεθος`), no dead button, no auto-select. Server-side per-size stock check on add (ADR 0001).
  - **B1 in-cart size change** (in scope): each cart line gets a size selector; change re-validates stock server-side; changing into an existing (product,size) line merges quantities.
- **S-2.11 Wishlist** — DB `wishlists` (+RLS), `actions/wishlist.ts`, `queries/wishlist.ts` and `/wishlist` page already exist but are wired to the **legacy** storefront (UUID, login-required). The live v3 storefront uses a localStorage slug-keyed wishlist (`useV3`, `mm-v3-wishlist`). Grilled decisions:
  - **No new table.** Unify on the live wishlist; persistence mirrors the cart: [Guest wishlist] localStorage → **merge (union) on login** → [Persisted wishlist] DB → cross-device.
  - slug↔UUID resolved at the DB boundary; the **legacy wishlist button is deleted** (the duplicate).

**Legacy-UI retirement (sequencing, refines ADR 0004):** the old `src/components` UI dies **surface-by-surface as each cycle rebuilds it**, not as one big-bang demolition. Live storefront imports **zero** legacy components; legacy leaks in only via `/wishlist` + `/bikes/[slug]`. `src/components/ui` is shared shadcn primitives — **stays**. Cycle 2 removes only the duplicate wishlist button; Cycle 3 retires legacy `reviews`; Cycle 4 retires legacy `garage`/`bikes`; a final sweep after Cycle 4 removes whatever is orphaned.

**Test seams:** real logic this cycle → vitest unit tests on the pure functions (size-code normalization, per-size availability mapping, "has variants" predicate) + integration on server actions (per-size stock validation on add, wishlist merge-on-login), not CSS source-asserts.
