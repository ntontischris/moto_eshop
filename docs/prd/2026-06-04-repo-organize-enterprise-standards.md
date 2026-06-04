# PRD — Repo Organize to Enterprise Standards

> Master PRD for the MotoMarket "organize-first" program. Four tracks (A→D) as epics. Uses the domain language in [CONTEXT.md](../../CONTEXT.md); decisions are recorded in [ADR 0001–0004](../adr/). The only build-ready epic today is **Track A** (plan: [docs/superpowers/plans/2026-06-04-track-a-commerce-bugfixes.md](../superpowers/plans/2026-06-04-track-a-commerce-bugfixes.md)). B/C/D are scoped here and get their own implementation plans when reached.

## Problem Statement

I'm bringing MotoMarket to an enterprise-grade state before invoicing. Right now the repo carries debt that will "hit me in the future": the live storefront can be made to charge the wrong [Order total] (a customer can tamper with the price in the browser), the AI assistant [Πιτ] reports false "out of stock" because it queries the ERP with the wrong identifier, there are **two parallel storefronts** doing the same job, an audit-produced "dead code" list that is partly wrong, and at least six competing documents all claiming to describe "where we are / where we're going" that drift apart. I want everything put in order so that whatever is marked "done" is genuinely safe, and any future engineer or agent can navigate the codebase and trust the docs. There is no deadline pressure — correctness over speed.

## Solution

Run a sequenced, risk-first cleanup in four tracks, each delivered as its own PR off a clean `main`:

- **Track A — Commerce correctness (build-ready).** Enforce *never trust the client* at the server boundary: the checkout action re-prices every line from the `products` table (the [Order total] is server-authoritative), and [Πιτ]'s stock tool resolves the [Product id] to a [SKU] before calling the ERP.
- **Track B — Dead-code removal (gated).** Treat the audit list as *candidates*, not decisions; every deletion is gated by GitNexus impact analysis plus a grep for imports.
- **Track C — Standards & knowledge system.** Adopt one in-repo knowledge system (one fact, one home) and a written standards doc; collapse the scattered planning docs.
- **Track D — Storefront unification.** Converge on a single presentation (the v3 components), serve it on the canonical [Clean URL], make the [Prefixed URL] a 301 alias, retire the legacy storefront, and give the storefront a server-backed cart with a correct [Guest cart] → [User cart] merge.

## User Stories

**Commerce correctness (Track A)**

1. As a customer, I want the price I'm charged to be the catalog price, so that I pay the correct amount even if my browser shows a stale or altered value.
2. As the shop owner, I want the server to recompute the [Order total] from the `products` table at order placement, so that a tampered client price (e.g. 200€ → 2€) cannot create an underpriced COD order.
3. As the shop owner, I want an order line for an unknown, inactive, or out-of-stock product to be rejected before any order row is written, so that I never accept an order I cannot fulfil.
4. As a customer, I want a clear message when a product in my cart is unavailable or out of stock, so that I understand why checkout stopped.
5. As the shop owner, I want shipping and totals derived from the same server-side rules as the cart summary, so that the figures are consistent and auditable.
6. As a customer chatting with [Πιτ], I want stock answers to reflect real ERP stock for the exact product I'm asking about, so that I trust "in stock" claims.
7. As the shop owner, I want [Πιτ] to resolve a [Product id] (a Supabase UUID or a slug) to the product's [SKU] before querying the ERP, so that stock is looked up against the only identifier the ERP understands.
8. As a customer, I want [Πιτ] to say stock is "unavailable" when a product has no [SKU], so that I'm not misled by a fake "0 in stock".
9. As an engineer, I want the price-validation logic to live in a small pure function, so that the security guarantee is fully unit-tested without depending on a database.

**Dead-code removal (Track B)**

10. As the shop owner, I want every "dead code" deletion verified before it happens, so that we never remove something still in use (the audit already mislabelled a file used by the sitemap).
11. As an engineer, I want each deletion gated by GitNexus impact analysis plus an import grep, so that dynamic or string references aren't missed.
12. As an engineer, I want unused dependencies removed only together with the code that used them, so that nothing breaks mid-cleanup.
13. As an engineer, I want each deletion batch in its own PR with the impact output attached, so that there is an audit trail for every removal.
14. As a future engineer, I want confidence that the remaining code is actually reachable, so that I don't waste time understanding orphans.

**Standards & knowledge system (Track C)**

15. As the shop owner, I want exactly one document that tells me "where we are now" and one that tells me "where we're going", so that I stop maintaining six drifting copies.
16. As the shop owner, I want the delivery sequence (releases, slices) version-controlled inside the repo, so that it can be reviewed in PRs and read reliably by an agent, with a PDF export kept beside the contract for the client.
17. As an engineer/agent, I want a single in-repo knowledge system where every fact has one home and everything else links to it, so that I never get contradictory answers.
18. As an engineer/agent, I want the AI memory store demoted to pointers, preferences, and gotchas, so that it is not a competing source of project facts.
19. As an engineer, I want a written standards document covering tests, types, security, error handling, and git/PR discipline, so that "enterprise standard" is concrete and enforceable.
20. As the shop owner, I want the standards backed by a CI pipeline (tests, lint, type-check, build, performance budget, accessibility baseline), so that the rules are enforced automatically and not by memory.
21. As an engineer, I want fail-fast environment validation and error monitoring in place, so that misconfiguration and runtime errors surface immediately.

**Storefront unification (Track D)**

22. As a customer, I want every product and category page to load correctly on its [Clean URL], so that links I share and links Google indexes always work.
23. As the shop owner, I want the [Clean URL] to serve the modern (v3) presentation, so that the canonical URL shows the best UI rather than the legacy one.
24. As the shop owner, I want a [Prefixed URL] to 301-redirect to its [Clean URL], so that old links keep working and search engines consolidate ranking on one canonical address.
25. As an engineer, I want a single storefront presentation (the v3 components), so that I stop maintaining two parallel PDP/PLP implementations.
26. As an engineer, I want the canonical route to be a thin resolver that renders route-agnostic components, so that routing and presentation are cleanly separated.
27. As the shop owner, I want the legacy storefront retired once nothing live depends on it, so that the codebase has one storefront.
28. As a customer, I want my [Guest cart] to become my [User cart] when I log in, so that items I added while logged out are not lost and follow me across devices.
29. As the shop owner, I want the storefront cart server-backed, so that carts persist beyond a single browser and can be reliably merged on login.

**Process / sequencing (cross-cutting)**

30. As the shop owner, I want PR #13 reviewed and merged to a clean `main` before any track starts, so that each track branches from a known-good baseline.
31. As the shop owner, I want every track delivered as its own PR off `main`, never pushed directly, so that each change is reviewable and revertible.
32. As the shop owner, I want destructive or structural changes (deletes, the storefront switch, merges to `main`) to require my explicit approval, so that I stay in control of irreversible steps.
33. As an engineer, I want additive/reversible work (baseline docs, Track A wiring) to proceed autonomously, so that low-risk work isn't slowed by approvals.

## Implementation Decisions

**Sequencing & autonomy**
- Land PR #13 → clean `main`. Then A → B → C → D, each its own PR off `main`. Never push to `main` directly.
- Graduated autonomy by risk: autonomous on additive/reversible work; always-ask + GitNexus impact on destructive/structural work (Track B deletes, Track D switch, any merge to `main`).

**Track A — Commerce correctness** (see ADR 0001)
- The live storefront cart is a **client-side localStorage cart** (the v3 provider), not a DB cart. The fix is surgical: the checkout action keeps receiving client lines but trusts only `{ slug, qty }`; it resolves slugs against `products`, rejects unknown/inactive/out-of-stock lines, and derives the [Order total] from the fetched price. Client price/name are display-only.
- The price/validation logic is an isolated **pure module** that takes order lines plus product rows and returns a discriminated result. It is the security seam and carries no I/O. The decision is encoded by this result shape (from the Track A prototype):
  ```ts
  // input lines carry NO price — a client price is structurally untrustable
  type PriceOrderResult =
    | { ok: true; lines: PricedLine[]; subtotal: number; shipping: number; total: number }
    | { ok: false; error: string }
  // unitPrice on every PricedLine comes from the product row, never the client
  ```
- Guest COD orders insert via the admin client (RLS intentionally bypassed, documented in-code); amounts are server-derived so this is safe. An RLS insert policy for anonymous orders is a Track C hardening follow-up.
- [Πιτ]'s stock tool resolves the [Product id] → [SKU] at the boundary: UUID-shaped ids look up by `id`, otherwise by `slug`; if the product has no [SKU] the tool reports "unavailable" rather than a fake 0; only then does it call the ERP stock helper.
- `lib/actions/checkout.ts`, `lib/actions/cart.ts`, and the DB cart query module are the *legacy* DB-cart system and are confirmed unused by the live storefront → Track B/D candidates (not adopted in Track A).

**Track B — Dead-code removal**
- The audit's "confirmed dead" list is treated as candidates only. Each candidate must pass GitNexus upstream impact analysis **and** an import grep before deletion; any hit means it stays and the list is corrected.
- Dependencies are removed only alongside the code that used them. Deletions are batched per category, one PR each, with the impact output in the PR description. `detect_changes` runs before every commit.

**Track C — Standards & knowledge system** (see ADR 0003)
- One in-repo knowledge system, one fact per artifact: GitNexus = what the code is (derived); `CONTEXT.md` = the language; `docs/adr/` = why; `ROADMAP.md` (in-repo) = where we're going; `STATUS.md` = where we are now; the AI `memory/` store = pointers/preferences/gotchas only.
- `STATUS.md` references roadmap slice ids (e.g. `R2-S04 ✅`) but never copies their descriptions; `ROADMAP.md` never mentions branches/commits.
- Collapse the three out-of-repo planning docs into the single in-repo `ROADMAP.md`; keep the ecosystem curriculum as learning material (not a status tracker). Keep a PDF export of the roadmap beside the contract.
- A `docs/STANDARDS.md` records the 5 core standards (100% tests on payment/auth + TDD; no `any`/`@ts-ignore` + Zod at boundaries; never-trust-client + RLS + auth-first + webhook signature; typed action results + no swallowed errors + logging; branch+PR + conventional commits + GitNexus impact/detect) plus 5 additions (CI as enforcement; fail-fast env validation; error monitoring; accessibility baseline; migration discipline). The performance budget lives inside CI.

**Track D — Storefront unification** (see ADR 0002, ADR 0004)
- One presentation: the v3 components. The canonical [Clean URL] route renders them (resolve → fetch → render); the [Prefixed URL] routes become thin 301 redirectors that render nothing and drop their self-canonical metadata. The legacy component storefront is retired after impact checks.
- The ~250-line inline product/category logic in the catch-all is extracted into route-agnostic server components.
- The storefront cart becomes server-backed and the [Guest cart] → [User cart] merge is wired at all auth entry points (email sign-in, OAuth callback, email confirm). This subsumes the former "Bug 2".

## Testing Decisions

- A good test asserts **external behavior**, not implementation: what gets written to the database, what an action/tool returns, what URL a request redirects to — never private helpers or call counts of internal functions.
- **Track A seams (highest available, existing preferred):**
  - The pure pricing function — unit-tested directly (no I/O). This is where the price-tampering guarantee is proven: a client price is ignored, totals derive from product rows, and unknown/inactive/out-of-stock lines are rejected.
  - The checkout server action — tested at the boundary with the Supabase admin client stubbed, asserting external effects: the persisted line unit price equals the product price (not the tampered client value), and an out-of-stock line produces no order.
  - [Πιτ]'s stock tool — the existing tool test seam, extended: assert it resolves to a [SKU] before the ERP call, returns "unavailable" when there is no [SKU], and degrades gracefully on ERP error.
- **Prior art:** the existing tool test (`check-stock.test.ts`) — Vitest, node env, explicit imports (no globals), module mocks via `vi.mock`, co-located `*.test.ts`. New tests follow the same shape.
- Coverage targets per standards: 100% on payment/auth logic. The pure pricing function must be exhaustively covered.
- Tracks B/C/D define their own tests in their plans; Track D additionally requires redirect-behavior tests for [Prefixed URL] → [Clean URL] and merge-behavior tests for [Guest cart] → [User cart].

## Out of Scope

- Migrating the v3 client cart to a server-backed DB cart **in Track A** — it is deferred to Track D. Track A only stops the server from trusting client prices.
- Card payments (Viva) — checkout remains COD-only for now.
- The leaked Entersoft keys — the owner deliberately leaves them (private repo, keys will rotate anyway); no scrub/rotation work.
- The storefront `/search` Meilisearch migration noted in the audit — tracked separately, not part of this program.
- Building the legacy→Supabase image mirror — separate image-architecture work.
- Post-contract ERP migration to Odoo — out of scope; the adapter interface protects the future swap.

## Further Notes

- The audit (2026-06-03) diagnosed the Track A bugs partly against the *legacy* storefront; verification against live code this session corrected the scope (the v3 cart is localStorage; the former "guest cart lost on login" bug targeted dead code and moved to Track D).
- GitNexus FTS emits read-only warnings during this session; they are harmless — the graph still answers impact/context queries.
- Next.js here has breaking changes vs. common training data; the per-request render (`await searchParams`) that fixed the product-page 404 outage must not be regressed when Track D moves rendering into the canonical route.
- Build-ready artifact: the Track A plan is fully specified (pure pricing module + tests, checkout action wiring + boundary tests, stock-tool resolver + tests, PR off `main`).
