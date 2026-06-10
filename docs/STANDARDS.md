# MotoMarket Engineering Standards

The enforceable engineering standards for MotoMarket. Each rule names how it is checked.

---

## 1. Testing

Write tests before code (RED → GREEN → REFACTOR). Tests assert external behavior — inputs, outputs, side-effects — never internal implementation details. Payment and auth logic must reach 100% branch coverage; pure security functions such as `priceOrder` must be exhaustively covered with both happy-path and attack-case inputs (e.g. tampered price, zero quantity, inactive SKU). Test names read as English sentences describing behavior.

**Enforced by:** Vitest `test` step in `.github/workflows/ci.yml`; pricing security contract in `docs/adr/0001-server-authoritative-pricing.md`.

---

## 2. Types

No `any` and no `@ts-ignore` without a comment explaining why and a linked issue. Use Zod schemas at every external boundary (API route inputs, environment variables, ERP responses). Inside the codebase prefer `unknown` + type-guard narrowing over type assertions. Enums are banned — use `const` objects or union types.

**Enforced by:** `pnpm typecheck` (blocking) in `.github/workflows/ci.yml`; ESLint `@typescript-eslint/no-explicit-any` rule.

---

## 3. Security

Never trust the client. Prices, totals, and stock levels are always re-fetched from the database server-side; client-supplied values are display-only. Row-Level Security is enabled on every Supabase table without exception. Every API route checks authentication before executing any logic. Webhook signatures are verified with `constructEvent()` before the payload is read. All secrets are consumed through the validated env schema — no `process.env` raw reads.

**Enforced by:** Server-authoritative pricing seam in `docs/adr/0001-server-authoritative-pricing.md`; fail-fast env schema in `src/lib/env.ts`; security review on every PR.

---

## 4. Error handling

Functions return typed result objects (`{ data, error }`) — they do not throw across user-facing boundaries. No error is silently swallowed: every catch block either re-throws, returns an error result, or calls `reportError`. User-facing error copy is written in Greek. All runtime errors are routed through the single `reportError` seam so the monitoring provider can be swapped without touching call sites.

**Enforced by:** `src/lib/observability/report-error.ts` (the only sanctioned error-reporting path); code review checklist.

---

## 5. Git / PR discipline

All work happens on a feature branch cut from `main`; `main` is never pushed to directly. Commits follow Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`) in imperative mood. Before editing any symbol run GitNexus impact analysis; before committing run `gitnexus detect_changes` to confirm scope. PRs stay under 400 changed lines and must include a test plan.

**Enforced by:** `CLAUDE.md` GitNexus mandate (impact + detect_changes steps); CI runs on every PR against `main`.

---

## 6. CI as enforcement gate

Lint, typecheck, test, and build must all be green before a PR can merge. Current reality: `pnpm typecheck` and `pnpm build` are blocking today. `pnpm lint` and `pnpm test` are non-blocking until the pre-existing technical-debt baseline is resolved (tracked in issue #28); once that cleanup lands both steps flip to blocking.

**Enforced by:** `.github/workflows/ci.yml` (all four steps defined; blocking status per-step noted in the workflow file).

---

## 7. Fail-fast env validation

Every environment variable is declared in the centralized env schema. On startup the schema validates all values and emits a single, human-readable aggregated error listing every missing or malformed variable — so developers never chase silent `undefined` bugs. Core variables are required; feature-gated variables (e.g. `SENTRY_DSN`, `ANTHROPIC_API_KEY`) are optional and gate their features at runtime.

**Enforced by:** `src/lib/env.ts` and its co-located tests; any `process.env` read outside this file is a lint violation.

---

## 8. Error monitoring

There is exactly one error-reporting choke point in the codebase. All `catch` blocks that cannot recover call `reportError(error, context)` and nothing else — no direct `console.error` in production paths, no inline Sentry calls scattered across files. Adopting a monitoring provider (Sentry, Highlight, etc.) requires an ADR entry before the dependency is added so the decision is documented and reviewable.

**Enforced by:** `src/lib/observability/report-error.ts` (single export); provider integration gated behind ADR; code review.

---

## 9. Accessibility baseline

Core flows — PDP, PLP, cart, checkout — use semantic HTML elements (`<nav>`, `<main>`, `<button>`, `<label>`), are fully keyboard-reachable (visible focus ring, logical tab order), have meaningful `alt` text on all images, and meet WCAG AA color contrast. Interactive elements are not implemented with unsemantic `<div onClick>`.

**Enforced by:** PR review checklist (this document); a dedicated a11y CI job is planned for Track D (requires a deployed preview URL — not yet available).

---

## 10. Migration discipline

Every schema change — table, column, index, RLS policy — is a versioned SQL file committed to `supabase/migrations/`. Production is never hand-edited. After any migration `pnpm db:types` is re-run and the generated types are reviewed before commit. Watch for i18n drift: the i18n migration adds locale columns that `db:types` will surface; do not run a blind type-regen without checking the diff.

**Enforced by:** PR review (migration file required); `supabase/migrations/` as the authoritative source of schema history.

---

## 11. Performance budget gate

Every PR is audited by Lighthouse (mobile emulation) against its Vercel preview homepage (default locale `el`, Clean URL root `/`). The budget — mobile performance score ≥ 90, CLS < 0.1, LCP < 2.5 s — is asserted on the median of 3 runs to guard against flake. A budget violation fails the check. This protects every Velocità slice from performance regressions. The job triggers on the Vercel `deployment_status` event so it audits the real preview build, not a local server.

**Enforced by:** `.github/workflows/lighthouse.yml` + `.lighthouserc.json`; results posted as a PR comment.

---

## How this is checked

| # | Standard | Enforcing mechanism |
|---|----------|---------------------|
| 1 | Testing | Vitest step in `.github/workflows/ci.yml`; ADR `docs/adr/0001-server-authoritative-pricing.md` |
| 2 | Types | `pnpm typecheck` (blocking CI step); ESLint `no-explicit-any` |
| 3 | Security | `docs/adr/0001-server-authoritative-pricing.md`; `src/lib/env.ts`; security review |
| 4 | Error handling | `src/lib/observability/report-error.ts`; code review |
| 5 | Git / PR discipline | `CLAUDE.md` GitNexus mandate; CI on every PR |
| 6 | CI as enforcement gate | `.github/workflows/ci.yml` (all four steps) |
| 7 | Fail-fast env validation | `src/lib/env.ts` + co-located tests |
| 8 | Error monitoring | `src/lib/observability/report-error.ts`; ADR before provider adoption |
| 9 | Accessibility baseline | PR review checklist; planned a11y CI job (Track D) |
| 10 | Migration discipline | `supabase/migrations/`; PR review |
| 11 | Performance budget gate | `.github/workflows/lighthouse.yml` + `.lighthouserc.json` (mobile ≥90, CLS <0.1, LCP <2.5s, median of 3) |
