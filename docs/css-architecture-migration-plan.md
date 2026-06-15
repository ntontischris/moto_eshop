# Storefront CSS migration plan — monolith → colocated, render-budget-aware

Decision & rationale: see [ADR 0007](./adr/0007-storefront-css-architecture-colocation.md).
Performance target & measurement: see [ADR 0006](./adr/0006-performance-measured-by-psi-production.md) — success = PSI mobile ≥ 90 on `https://moto-eshop.vercel.app`. Baseline at start (2026-06-15, post-#71): **mobile 77 / desktop 86**; mobile FCP 1.5s 🟢, **LCP 4.4s 🔴**, TBT 10ms 🟢, CLS 0.084 🟢.

## The problem in one line

`src/app/[locale]/(store)/_styles/components.css` = 10,990 lines / 256 KB of `v3-*` rules, imported render-blocking at the shared `(store)/layout.tsx`, on every route. On slow-4G this clogs the pipe so the LCP hero image starts downloading ~2.93 s late (PSI load-delay).

## Prefix → usage map (audit result)

**A — GLOBAL (rendered every page via `shell/`,`fx/`,`chat/`; stays in shared bundle):**
header, footer, mega, cmdk, search, drawer, lang, mob, mobile, mode, payment, preloader, prog, reveal, trust, vt, wordmark, lqip, surface, bone, carbon, font, graphite, line, cta, utility — plus shared utilities `btn`, `label`, `display`.

**B — HOME's own (~85% of the file; stays on the home route, see "render budget" below):**
hero, cat, rail, ride, tunnel, ed, gallery, gal, hs, mb, nl, off, proof, bc, card, home, sr — plus `commerce/` styles the home product rails render: price, availability, product, imgph, odometer.

**C — ROUTE-EXCLUSIVE (movable off the home critical path → Lever 1):**
- Checkout: `v3-co`, `v3-green`, `v3-gutter`
- PDP (catch-all `[...path]`): `v3-atc`, `v3-bb`, `v3-pdp`, `v3-size`
- PLP (catch-all `[...path]`): `v3-fs`, `v3-mfd`

**D — MIXED (split required):**
- `v3-cart` → `v3-cart-panel-*` is the **global** shell drawer (stays) · the rest is the `/cart` page (moves).

## Two levers (both needed)

1. **Route-scoping (Lever 1)** — extract category C + the `/cart`-page half of D into stylesheets imported only by their route segments (`checkout/`, `[...path]`, `cart/`). Removes other routes' CSS from the home critical path. Effect on home: ~10–15% smaller render-blocking CSS. Necessary, not sufficient.
2. **Render budget (Lever 2 — the real home-LCP win)** — keep only above-the-fold **hero** CSS render-blocking; below-the-fold home sections (rail, tunnel, ed, off, proof, bc, nl, trust…) load their CSS non-render-blocking via `next/dynamic` section components (their CSS splits with them) and/or critical-CSS inlining. Frees the pipe immediately → hero image starts ~early → LCP collapses.

## Slices (each = own PR, TDD + visual regression on preview + PSI re-measure)

Ordered by value/safety. Each slice: extract the section's `v3-*` block to a colocated stylesheet next to its component; classify global/route/above-fold/below-fold; add a test asserting the home critical CSS no longer ships the moved prefixes; verify the touched routes visually; re-measure.

- **S0 — Quick wins (no CSS move):** `browserslist` config to drop legacy JS polyfills (−14 KB); responsive `sizes`/srcset on oversized `ride-selector` thumbs (−~13 KB); fix `v3-mb-chip-logo` empty `src`/missing dimensions (CLS hygiene).
- **S1 — Lever 1, checkout:** move `v3-co/green/gutter` → `checkout/checkout.css`.
- **S2 — Lever 1, PDP:** move `v3-atc/bb/pdp/size` → colocated `pdp/pdp.css` imported by the catch-all PDP branch.
- **S3 — Lever 1, PLP:** move `v3-fs/mfd` → colocated `plp/plp.css`.
- **S4 — Lever 1, cart split:** isolate `v3-cart-panel-*` (keep global in shell) from `/cart` page styles (move to `cart/cart.css`).
- **S5 — Lever 2, below-fold home sections:** convert below-fold home sections to `next/dynamic` components so their CSS leaves the render-blocking head; keep hero CSS critical. This is the slice that should move mobile LCP the most.
- **S6+ — Colocate the remainder:** migrate the remaining global/home `v3-*` blocks into per-component `.module.css` files (the `chat.module.css` pattern), shrinking the monolith toward zero. Dead/unused rules (PSI flagged ~20.5 KB unused) dropped as encountered.

## Definition of done

Monolith `components.css` → 0 lines (all styling colocated); home render-blocking CSS = above-the-fold only; PSI mobile ≥ 90 on production; CLS stays < 0.1; no visual regressions across home / PDP / PLP / cart / checkout. Progress tracked by: monolith line count ↓, PSI mobile score ↑, per-slice preview screenshots.
