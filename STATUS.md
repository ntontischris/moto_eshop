# MotoMarket — STATUS

Where we are now (ADR 0003). Sequence lives in ROADMAP.md. References slice ids only.
New here? Start with [HANDOFF.md](HANDOFF.md).

_Last updated: 2026-06-29 (typecheck clean, 638/638 tests green; F-1.1 card tracer on `feat/f1-payment-tracer`)_

---

## Done

### Roadmap slices

- S-0.1 — ERP provider decision: Entersoft Phase 1-4, Odoo post-contract (2026-05-28)
- **Cycle 1 — Visual cinematic frame** (PRs #126–#130): PDP/PLP/Cart/Checkout/Account/Wishlist/Garage brought to cinematic dark parity + reserved slots
- **S-2.8 — Size variants** (Cycle 2, `abf7288`): real per-size availability on PDP (3 states, ADR 0009), add-to-cart with size + server stock guard, in-cart size change with merge
- **S-2.11 — Wishlist server-persisted** (Cycle 2, `abf7288`): account-persisted, merge-on-login, legacy button retired
- **Cart unified to one server-backed source of truth** (`abf7288`): whole storefront on `cart_items` (guest carts via service-role + cookie, IDOR-guarded; login-merge). Retired the parallel localStorage cart
- **S-2.9 / S-2.10 — Reviews** (Cycle 3, `02f1601`, PR #138): verified-buyer reviews wired into PDP + rating-sync trigger, i18n, migration applied + security-hardened
- **F-1.1 — Card payment tracer** (#140, branch `feat/f1-payment-tracer`, PR pending): `PaymentProvider` interface + Stripe adapter (hosted Checkout, no card data on our servers), pure payment state machine, two-axis order state (`payment_status` + `status`), `checkout_sessions` snapshot table, webhook-confirmed order creation (`api/webhooks/stripe`), card option behind a key-present flag (COD always available), success page resolves the real order via polling. COD path unchanged. ⏳ owner prerequisites: apply `20260629000001_payment_tracer.sql` + add Stripe TEST keys to env (then the skipped live integration test runs). Follow-ups: #141 idempotency, #142 cancel/expiry, #143 card flag

### Walking Skeleton (pre-roadmap baseline)

- Browse home — Industrial Race style live on production
- Browse PLP — 11.862 προϊόντα από Supabase seed
- Browse PDP — images, price, stock badge
- Add to cart — localStorage permanent
- Cart page — complete
- Checkout COD — γράφει `orders` + `order_items`
- Account login (email) — Supabase Auth
- Account history — complete

### Organize program (Track A–D, GitHub issues)

- Track A #14 — pure server-authoritative pricing module (`priceOrder`, exhaustively unit-tested)
- Track A #15 — checkout action re-prices server-side from `products`, rejects client price tampering
- Track A #16 — AI checkStock resolves catalog id → SKU before ERP (was a false 0)
- Track C #20 — env validation (startup guard, missing vars fail fast)
- Track C #21 — reportError utility (typed server-side error logging)
- Track C #22 — CI pipeline (lint + typecheck + test on every PR)
- Track C #23 — this PR: ROADMAP.md + STATUS.md consolidation (ADR 0003)

### i18n (PR #2, feat/i18n)

- UI fully translated — 319 keys × 6 locales, next-intl, SEO + sitemap

### Campaign Engine (feat/campaign-engine, merged main commit 8de089f)

- `/lp/[slug]` landing pages, admin builder, A/B decisioning, analytics, AI authoring live

### Infrastructure / DX (PR #13, feat/track-c-phase-1)

- Phase 1A: guard improvements
- Phase 1F: shipping utilities

---

## In flight

- **F-1 — PaymentProvider tracer** (grill 2026-06-20 → PRD #139 → issues #140-143). **Next dev step = #140** (card happy path). See [docs/MOTOMARKET_EXECUTION_PLAN.md](docs/MOTOMARKET_EXECUTION_PLAN.md).
- Strategy locked by grill 2026-06-20: foundation-first (F-1 → F-2 AI registry → F-3 ERP read-model), then fan-out. ADRs 0010-0015 + glossary terms added.

---

## Blocked

- S-2.13 — catalog data i18n: waiting on owner to apply `20260525000001_catalog_translations` migration + set `ANTHROPIC_API_KEY` in Vercel env vars
- S-0.4 — Viva merchant account + Apple/Facebook OAuth app review: waiting on owner/client credentials and app review submissions (R3: 2-3 week lead time for Apple/Facebook)
- S-1.6 through S-1.10 — all Entersoft sync slices: blocked on client delivering Entersoft API key + base URL + active Public Query list (R7 risk)
- S-0.3 — Resend + DKIM: blocked on DNS access / domain ownership handoff from client
- Order confirmation email — page exists, email confirmation not implemented (S-3.11 not started)

---

## Dead code (Track B — gate-verified)

Gate = GitNexus upstream impact + import grep. The audit's "confirmed dead" list was 2/3 wrong.

- `src/lib/actions/checkout.ts` — **REMOVED** (Track B). Verified dead: 0 upstream callers, 0 import-grep hits, no test. The legacy DB-cart COD checkout, superseded by Track A's server-authoritative `(store)/checkout/actions.ts`.
- `src/lib/actions/cart.ts` — **LIVE, retained.** Reachable from the live storefront via Πιτ's chat `add-to-cart` tool (`lib/chat/tools/add-to-cart.ts` → `tools/index.ts` → `/api/chat/route.ts`, mounted in `(store)/layout.tsx`) and legacy `components/cart/*`. Also holds the guest→user merge scaffolding (`mergeGuestCartOnLogin`, `getCartByUserId`) that Track D's server-backed cart will build on.
- `src/lib/queries/cart.ts` — **LIVE, retained.** Reachable via `/api/cart/summary/route.ts` → `use-cart-summary.ts` in the live chat provider (impact: HIGH, 4 direct callers, 3 flows). Decided in Track D alongside the cart unification.
