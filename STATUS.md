# MotoMarket — STATUS

Where we are now (ADR 0003). Sequence lives in ROADMAP.md. References slice ids only.

_Last updated: 2026-06-04_

---

## Done

### Roadmap slices

- S-0.1 — ERP provider decision: Entersoft Phase 1-4, Odoo post-contract (2026-05-28)

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

- Track A #14 — checkout price-tampering fix (client-trusted prices corrected server-side)
- Track A #15 — guest-cart persistence on login fixed
- Track A #16 — AI checkStock returning 0 fixed
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

- Track C #24 — STANDARDS.md (coding standards document)
- Track C #25 — knowledge-map (codebase navigation guide)

---

## Blocked

- S-2.13 — catalog data i18n: waiting on owner to apply `20260525000001_catalog_translations` migration + set `ANTHROPIC_API_KEY` in Vercel env vars
- S-0.4 — Viva merchant account + Apple/Facebook OAuth app review: waiting on owner/client credentials and app review submissions (R3: 2-3 week lead time for Apple/Facebook)
- S-1.6 through S-1.10 — all Entersoft sync slices: blocked on client delivering Entersoft API key + base URL + active Public Query list (R7 risk)
- S-0.3 — Resend + DKIM: blocked on DNS access / domain ownership handoff from client
- Order confirmation email — page exists, email confirmation not implemented (S-3.11 not started)

---

## Verified dead (Track B candidates)

- `src/lib/actions/checkout.ts` — candidate, pending Track B impact-gated verification
- `src/lib/actions/cart.ts` — candidate, pending Track B impact-gated verification
- Legacy DB-cart query module — candidate, pending Track B impact-gated verification
