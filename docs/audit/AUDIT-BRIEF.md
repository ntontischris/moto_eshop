# MotoMarket — State-of-the-Codebase Audit Brief

> **Handoff document.** Give this to a senior engineer or a capable coding agent and they can run
> the full audit end-to-end, autonomously, with no further questions. The deliverable is **one ranked
> findings document** answering: *what exists, what is missing, what is broken, and what must be done.*

---

## Mission

Audit the entire MotoMarket codebase to establish, with hard evidence, **where the project stands today** —
then produce a single prioritized findings document of everything that must be done to resolve the open problems.

This is **report-only**. Do **not** fix anything, do **not** open PRs. Scan, verify, report.

## The project (context for the auditor)

MotoMarket is a **Next.js 16 (Cache Components)** headless motorcycle-gear storefront over a **Supabase**
catalog, synced to the **Entersoft ERP**, with an in-store AI shopping assistant called **"Pit"**.

The canonical truth lives in these in-repo artifacts — read them first, but **verify claims against code**:

| Question | Source of truth |
|----------|-----------------|
| What does a term mean? | `CONTEXT.md` (glossary) |
| Why was something decided? | `docs/adr/` (4 ADRs) |
| What are the engineering rules? | `docs/STANDARDS.md` |
| Where are we going? | `ROADMAP.md` (`S-X.Y` slices) |
| Where are we now (claimed)? | `STATUS.md` |
| What is the actual code? | the code + GitNexus index (`moto_eshop`) |

## Ground rules (non-negotiable)

1. **Ground every claim in real files.** Open them (Read/Grep/Glob). Docs and memory are *claims to verify*, never proof.
2. **Evidence required.** Each finding cites `file:line` or real command output. No vibes.
3. **Compare claim vs reality.** Flag every place `STATUS.md` / `ROADMAP.md` / the ADRs disagree with the code.
4. **Adversarially verify the serious ones.** Every CRITICAL/HIGH finding gets re-checked by an independent skeptic before it ships. Default to *refuted* if it cannot be independently reproduced.
5. **Prefer fewer high-confidence findings** over speculation.

## Scope — audit these dimensions

Each is a self-contained workstream. Cover all of them.

1. **Build health** — Run the typecheck/lint/test scripts and a production build (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` — adjust to the real scripts in `package.json`). Report exact failures, error counts, whether it compiles at all. If a command needs secrets or is too slow, say so and inspect statically.
2. **Routing & rendering** — `(store)` catch-all `[...path]` clean URLs, the `/product` & `/category` prefixed **308** aliases (middleware), `V3Provider`, `generateStaticParams`, and the history of *every-product-404* bugs under Cache Components. Verify clean + prefixed + **non-seeded** slugs render; confirm legacy PDP/PLP are truly retired.
3. **Cart & checkout** — Guest cart vs user cart **merge-on-login**; **server-authoritative Order total** (ADR 0001 — price from `products` table, never client). Hunt price-tampering exposure and guest-cart-lost-on-login. Track **D2 (cart)** is the next planned slice — assess real vs scaffolding.
4. **Entersoft ERP** — The `IErpAdapter` interface, **SKU vs Product-id** resolution (see `CONTEXT.md`), stock & price lookups. Real or stubbed? Does `checkStock` work (a known bug returned 0)? Are calls keyed by **SKU** as the glossary requires?
5. **Security & secrets** — *Highest priority.* Hunt hardcoded secrets/API keys (esp. **leaked Entersoft keys** reportedly in plaintext in `env-setup.md` or container `.md` files), Supabase **RLS** coverage, `supabaseAdmin`/service_role usage, `getUser` vs `getSession`, auth checks on API routes, Zod validation at boundaries.
6. **Catalog & data** — Supabase schema vs code, products/categories, slug separator (`--`), stock=0 issues, image architecture (legacy proxy vs Supabase storage, `SmartImage`), caching (`"use cache"`, negative-cache 404).
7. **AI assistant "Pit"** — Chat tools (`checkStock`, `addToCart`), provider/key wiring (ANTHROPIC/OPENAI), correctness (`checkStock` reportedly returns 0), failure modes.
8. **i18n** — `next-intl`, 6 locales, UI keys, SEO/sitemap, and whether **catalog DATA translation** is wired vs blocked on owner action (`ANTHROPIC_API_KEY` + migration + `pnpm i18n:translate`).
9. **Campaign Engine** — `/lp/[slug]` landing builder, admin builder, A/B decisioning, analytics, AI authoring. Reportedly merged & live — verify in code, check tests, note prod-pending owner actions (storage bucket SQL, env keys).
10. **Tests & coverage** — Inventory test files. Standards require **100%** on auth & payment flows, **80%** on business logic. Identify critical untested paths (pricing, cart merge, ERP, checkout).
11. **Docs-vs-reality drift** — Cross-check `STATUS.md` and `ROADMAP.md` slices against actual code. Are the **4 ADRs** honored (server pricing, clean URLs canonical, single knowledge system, single storefront)? Is the GitNexus index stale?

## Deliverable — one Markdown document

Write to `docs/audit/<YYYY-MM-DD>-state-of-the-codebase.md` with these sections:

1. **Executive summary** — where MotoMarket stands today, 5–8 bullets (the honest answer to *"πού βρισκόμαστε"*).
2. **Critical & high issues** — table: `Issue | Status | Severity | Evidence | What must be done`. Drop refuted findings; apply adjusted severities.
3. **By dimension** — one subsection per dimension above, with its verdict and notable medium/low findings.
4. **What exists vs what is missing** — two-column inventory.
5. **Docs-vs-reality drift** — every disagreement between `STATUS`/`ROADMAP`/ADRs and the code.
6. **Recommended action plan** — prioritized, numbered, each item small and concrete (the *"τι πρέπει να γίνει για να λυθούν όλα"*).

Per-finding shape (use in tables / lists):
`title · status(exists|partial|missing|broken|risk) · severity(critical|high|medium|low|info) · evidence(file:line) · recommendation · confidence(0–1)`

---

## How to run it

**Mode A — single capable agent.** Paste this whole file as the prompt into a fresh session opened at the repo
root and say: *"Execute this audit brief autonomously and write the deliverable. Do not ask me questions."*

**Mode B — multi-agent (faster, more thorough).** If the runner supports parallel sub-agents/workflows, use the
companion script `docs/audit/motomarket-state-audit.workflow.js` (1 recon → 11 parallel auditors → adversarial
verify of CRITICAL/HIGH → synthesis). **Before running, set the `ROOT` constant in that file to the repo's
absolute path on the target machine.** The script returns the report; the runner writes it to the path above.
