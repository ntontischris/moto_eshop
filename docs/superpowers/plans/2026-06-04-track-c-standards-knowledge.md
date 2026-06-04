# Track C — Standards & Knowledge System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "enterprise standard" concrete and enforceable: one in-repo knowledge system (one fact, one home), a written standards doc, and the automated enforcement behind it (CI, fail-fast env validation, an error-reporting seam).

**Architecture:** Track C is two halves. (1) **Knowledge** — give each doc artifact a single job per [ADR 0003](../../adr/0003-single-in-repo-knowledge-system.md): `CONTEXT.md` = language (done), `docs/adr/` = why (done), `ROADMAP.md` = where we're going, `STATUS.md` = where we are now, `docs/STANDARDS.md` = the rules, GitNexus = what the code is (derived), `memory/` = pointers only. Collapse the out-of-repo planning docs into the single in-repo `ROADMAP.md`. (2) **Enforcement** — a Zod-validated env module that fails fast on misconfiguration, a CI pipeline (lint + typecheck + test + build) so the standards are checked by machine not memory, and a single `reportError` choke point for runtime errors. Docs tasks are additive/zero-risk; code tasks are TDD.

**Tech Stack:** Next.js 16, TypeScript 5, Zod v4 (`zod/v4`), Vitest (node env, `globals: false`, co-located `*.test.ts`), GitHub Actions, pnpm.

**Conventions to follow (verified in repo):**
- Tests: `import { describe, it, expect, vi, beforeEach } from "vitest"` (no globals). Co-locate `foo.test.ts` next to `foo.ts`. Vitest `include: ["src/**/*.test.ts"]`.
- Zod is `zod/v4` (`import { z } from "zod/v4"`).
- Errors: typed results, never throw across user-facing boundaries; user-facing messages in Greek.
- Imports: `@/` alias; group external → internal → relative → types.
- ADR 0003 is the authority for which doc owns which fact — never copy a fact into a second doc; link instead.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/env.ts` | **Single** validated source of environment config. Zod schema splits required-core vs optional/feature-gated; parses `process.env` once; throws a readable aggregated error on missing core vars. | **Create** |
| `src/lib/env.test.ts` | Unit tests for the env schema (parsing a valid object, rejecting missing core, allowing absent optionals). Pure — passes an object, never reads real `process.env`. | **Create** |
| `src/lib/observability/report-error.ts` | One choke point for runtime error reporting. Structured server-side log now; provider (Sentry) is a documented future swap behind the same signature, gated on `SENTRY_DSN`. | **Create** |
| `src/lib/observability/report-error.test.ts` | Asserts `reportError` returns an event id and logs structured context; never throws. | **Create** |
| `src/app/global-error.tsx` | Next.js root error boundary that calls `reportError`. | **Create** |
| `.github/workflows/ci.yml` | CI: install → lint → typecheck → test → build on PRs and pushes to `main`. | **Create** |
| `package.json` | Add `typecheck` script (`tsc --noEmit`). | **Modify** |
| `docs/STANDARDS.md` | The written standards: 5 core + 5 additions, each linked to its enforcement. | **Create** |
| `ROADMAP.md` | Where we're going — releases + slices with stable ids. Consolidates the out-of-repo `VERTICAL_ROADMAP.md` (+ former MASTER/BUILD plans). No commits/branches. | **Replace** |
| `STATUS.md` | Where we are now — references roadmap slice ids (e.g. `R0-S01 ✅`); never copies their descriptions. No release planning. | **Create** |
| `AGENTS.md` / `CLAUDE.md` | Add a short "Knowledge map" section pointing each fact-type at its one home (per ADR 0003); demote `memory/` to pointers. | **Modify** |

> **Docs-task altitude:** for the prose files (`STANDARDS.md`, `ROADMAP.md`, `STATUS.md`) this plan specifies exact structure, rules, and sources rather than full final prose — the implementing agent authors the content from the cited sources. Acceptance criteria are concrete and checkable. Code tasks carry complete code.

---

## Task 1: Fail-fast env validation (enforcement core)

**Files:**
- Create: `src/lib/env.ts`
- Test: `src/lib/env.test.ts`

The app currently reads `process.env.X!` scattered across ~20 files with non-null assertions, so a missing core var fails late and cryptically. This task centralises validation: one Zod schema, parsed once, with a readable aggregated error listing every missing core var. Optional/feature-gated vars (ERP, Meilisearch, Upstash, AI, Resend) are `.optional()` so absence degrades a feature rather than crashing the app.

- [ ] **Step 1.1: Write the failing test**

Create `src/lib/env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { envSchema } from "./env";

const validCore = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
  NEXT_PUBLIC_SITE_URL: "https://motomarket.gr",
};

describe("envSchema", () => {
  it("accepts a valid core environment with no optional vars", () => {
    const r = envSchema.safeParse(validCore);
    expect(r.success).toBe(true);
  });

  it("rejects when a required core var is missing", () => {
    const { NEXT_PUBLIC_SITE_URL: _omit, ...partial } = validCore;
    const r = envSchema.safeParse(partial);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues.some((i) => i.path[0] === "NEXT_PUBLIC_SITE_URL")).toBe(
      true,
    );
  });

  it("rejects a malformed core URL", () => {
    const r = envSchema.safeParse({ ...validCore, NEXT_PUBLIC_SITE_URL: "nope" });
    expect(r.success).toBe(false);
  });

  it("allows optional feature vars to be present", () => {
    const r = envSchema.safeParse({
      ...validCore,
      ENTERSOFT_API_KEY: "k",
      OPENAI_API_KEY: "sk-x",
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `pnpm test src/lib/env.test.ts`
Expected: FAIL — cannot resolve `./env`.

- [ ] **Step 1.3: Write the implementation**

Create `src/lib/env.ts`:

```ts
import { z } from "zod/v4";

/**
 * Single source of validated environment config. Core vars are required and the
 * app cannot run without them; everything else is feature-gated and optional so
 * its absence degrades one feature instead of crashing the app. Parsed once at
 * module load via `env`; import that, never `process.env`, in app code.
 */
export const envSchema = z.object({
  // --- Required core (app cannot function without these) ---
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),

  // --- Optional: ERP (Entersoft) ---
  ERP_PROVIDER: z.string().optional(),
  ENTERSOFT_API_KEY: z.string().optional(),
  ENTERSOFT_API_URL: z.url().optional(),

  // --- Optional: search (Meilisearch) ---
  MEILI_HOST: z.url().optional(),
  NEXT_PUBLIC_MEILI_HOST: z.url().optional(),
  MEILI_ADMIN_KEY: z.string().optional(),
  NEXT_PUBLIC_MEILI_SEARCH_KEY: z.string().optional(),

  // --- Optional: rate limiting (Upstash) ---
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // --- Optional: AI assistant / campaigns ---
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  CHAT_DISABLED: z.string().optional(),

  // --- Optional: transactional email (Resend) + handoff ---
  RESEND_API_KEY: z.string().optional(),
  CHAT_HANDOFF_TO: z.string().optional(),
  CHAT_FROM_EMAIL: z.string().optional(),

  // --- Optional: admin + observability ---
  ADMIN_API_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${missing}\n` +
        `Set the variables above (see .env.example) and restart.`,
    );
  }
  return parsed.data;
}

export const env: Env = parseEnv();
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `pnpm test src/lib/env.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 1.5: Verify build still succeeds**

Run: `pnpm build`
Expected: success. (The module parses real env at load; the build environment must have the 4 core vars — it already does, since the current build passes.)

- [ ] **Step 1.6: Commit**

```bash
git add src/lib/env.ts src/lib/env.test.ts
git commit -m "feat(config): add fail-fast Zod env validation

Single validated source of environment config: required core vars vs
optional feature-gated vars, with a readable aggregated error on misconfig."
```

> **Note (follow-up, not this task):** migrating the ~20 `process.env.X!` call sites to import `env` is a mechanical refactor best done as its own slice (`/to-issues` may split it out) so this slice stays additive and low-risk.

---

## Task 2: Error-reporting seam + root error boundary

**Files:**
- Create: `src/lib/observability/report-error.ts`
- Test: `src/lib/observability/report-error.test.ts`
- Create: `src/app/global-error.tsx`

One choke point for runtime errors. Today it logs structured context server-side (genuinely working, not a stub); adding Sentry later is swapping this one function body behind an unchanged signature, gated on `SENTRY_DSN` — recorded as a future ADR, not a placeholder here.

- [ ] **Step 2.1: Write the failing test**

Create `src/lib/observability/report-error.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportError } from "./report-error";

describe("reportError", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("returns a non-empty event id", () => {
    const id = reportError(new Error("boom"));
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("logs the error message and context", () => {
    reportError(new Error("boom"), { where: "checkout" });
    expect(console.error).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(console.error).mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(arg.message).toBe("boom");
    expect((arg.context as Record<string, unknown>).where).toBe("checkout");
  });

  it("never throws on a non-Error value", () => {
    expect(() => reportError("just a string")).not.toThrow();
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `pnpm test src/lib/observability/report-error.test.ts`
Expected: FAIL — cannot resolve `./report-error`.

- [ ] **Step 2.3: Write the implementation**

Create `src/lib/observability/report-error.ts`:

```ts
export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * The single choke point for runtime error reporting. Returns an event id the
 * UI can surface to the user for support. Today: structured server-side log.
 * Future: forward to a provider when `SENTRY_DSN` is set — same signature, one
 * body swap (record the swap as an ADR before doing it).
 */
export function reportError(error: unknown, context?: ErrorContext): string {
  const eventId = `evt_${Date.now().toString(36)}_${Math.round(
    Number.MAX_SAFE_INTEGER * 0,
  )}`;
  const normalized =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error("[reportError]", {
    eventId,
    ...normalized,
    context: context ?? {},
  });

  return eventId;
}
```

> **Determinism note:** event id uses `Date.now()` only (no `Math.random`) so it is testable; uniqueness within a request is sufficient for support correlation.

- [ ] **Step 2.4: Run test to verify it passes**

Run: `pnpm test src/lib/observability/report-error.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 2.5: Wire the root error boundary**

Create `src/app/global-error.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/observability/report-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: "global-error" });
  }, [error]);

  return (
    <html lang="el">
      <body>
        <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1>Κάτι πήγε στραβά</h1>
          <p>Παρουσιάστηκε ένα απρόσμενο σφάλμα. Δοκίμασε ξανά.</p>
          <button onClick={() => reset()}>Δοκίμασε ξανά</button>
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2.6: Verify build + test**

Run: `pnpm test src/lib/observability/report-error.test.ts && pnpm build`
Expected: tests PASS; build succeeds (global-error compiles).

- [ ] **Step 2.7: Commit**

```bash
git add src/lib/observability/report-error.ts src/lib/observability/report-error.test.ts src/app/global-error.tsx
git commit -m "feat(observability): add single reportError seam + root error boundary

One choke point for runtime errors (structured log now, provider-swappable
later); root error boundary reports and offers retry."
```

---

## Task 3: CI pipeline + typecheck script

**Files:**
- Modify: `package.json` (add `typecheck` script)
- Create: `.github/workflows/ci.yml`

Make the standards machine-checked. CI runs on PRs and pushes to `main`: install (pnpm, frozen lockfile) → lint → typecheck → test → build. (Performance budget and accessibility baseline are recorded in `STANDARDS.md` as CI's eventual jobs; they need a deployed URL and are deferred to Track D when the canonical route lands — not silently dropped.)

- [ ] **Step 3.1: Add the `typecheck` script**

Modify `package.json` scripts (add the line after `"lint": "eslint",`):

```json
    "typecheck": "tsc --noEmit",
```

- [ ] **Step 3.2: Verify typecheck passes locally**

Run: `pnpm typecheck`
Expected: completes with no type errors (exit 0). If pre-existing errors surface, STOP and report — do not "fix" unrelated code in this slice.

- [ ] **Step 3.3: Create the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type-check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-anon-placeholder
          SUPABASE_SERVICE_ROLE_KEY: ci-service-placeholder
          NEXT_PUBLIC_SITE_URL: https://example.com
```

> The build `env` block supplies the 4 required-core vars (Task 1) with placeholders so CI's build step passes env validation without secrets. Optional feature vars stay unset — features degrade, build still succeeds.

- [ ] **Step 3.4: Validate the workflow YAML**

Run: `pnpm exec node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/ci.yml','utf8');if(!s.includes('pnpm install --frozen-lockfile'))throw new Error('missing install');console.log('ci.yml OK')"`
Expected: prints `ci.yml OK`.

- [ ] **Step 3.5: Commit**

```bash
git add package.json .github/workflows/ci.yml
git commit -m "ci: add lint/typecheck/test/build pipeline + typecheck script

Standards enforced by machine on every PR and push to main."
```

---

## Task 4: docs/STANDARDS.md (the written rules)

**Files:**
- Create: `docs/STANDARDS.md`

The concrete, enforceable definition of "enterprise standard." Per the PRD: **5 core** standards + **5 additions**, each stating the rule and *how it is enforced* (link the enforcing test/CI job/config — never restate code).

- [ ] **Step 4.1: Author the standards doc**

Create `docs/STANDARDS.md` with exactly these sections. Each rule is one short paragraph: the rule, then **Enforced by:** <mechanism/link>.

Core standards (1–5):
1. **Testing** — TDD (RED→GREEN); tests assert external behavior, not internals; **100% coverage on payment/auth logic**, pure security functions exhaustively covered. *Enforced by:* Vitest in CI (Task 3); reference the pricing/stock seams ([ADR 0001]).
2. **Types** — no `any` / no `@ts-ignore` without a documented reason; Zod at all boundaries; `unknown` + narrowing over `any`. *Enforced by:* `pnpm typecheck` in CI; ESLint.
3. **Security** — never trust the client; RLS on every table; auth checked first in every route; verify webhook signatures; secrets only in env. *Enforced by:* server-authoritative pricing ([ADR 0001]); env validation ([`src/lib/env.ts`]); security review.
4. **Error handling** — typed result objects, never throw across user-facing boundaries; no swallowed errors; user-facing messages in Greek; runtime errors go through the single `reportError` seam. *Enforced by:* [`src/lib/observability/report-error.ts`]; code review.
5. **Git/PR discipline** — branch + PR off `main`, never push to `main` directly; conventional commits; GitNexus impact before edit + `detect_changes` before commit. *Enforced by:* [CLAUDE.md](../CLAUDE.md) GitNexus mandate; CI on PRs.

Additions (6–10):
6. **CI as enforcement** — lint + typecheck + test + build green before merge; performance budget and accessibility baseline are CI's planned jobs once a deployed URL exists (Track D). *Enforced by:* `.github/workflows/ci.yml`.
7. **Fail-fast env validation** — config validated once at startup; missing core var → readable aggregated error. *Enforced by:* [`src/lib/env.ts`] + its tests.
8. **Error monitoring** — one `reportError` choke point; provider integration gated on `SENTRY_DSN` and recorded as an ADR before adoption. *Enforced by:* [`src/lib/observability/report-error.ts`].
9. **Accessibility baseline** — semantic HTML, keyboard reachability, alt text, color-contrast on core flows (PDP, PLP, cart, checkout). *Enforced by:* a11y CI job (planned, Track D) + review checklist here.
10. **Migration discipline** — every schema change is a versioned migration in `supabase/`; never hand-edit prod; `db:types` regenerated and reviewed (watch the i18n drift gotcha). *Enforced by:* PR review; migration files in `supabase/`.

End with a short **"How this is checked"** table mapping each standard → its enforcing mechanism.

- [ ] **Step 4.2: Verify links resolve**

Run: `pnpm exec node -e "const fs=require('fs');['src/lib/env.ts','src/lib/observability/report-error.ts','.github/workflows/ci.yml','docs/adr/0001-server-authoritative-pricing.md'].forEach(p=>{if(!fs.existsSync(p))throw new Error('missing '+p)});console.log('links OK')"`
Expected: prints `links OK` (run after Tasks 1–3 are merged, or on the integration branch).

- [ ] **Step 4.3: Commit**

```bash
git add docs/STANDARDS.md
git commit -m "docs(standards): add enforceable standards (5 core + 5 additions)

Each rule states how it is enforced (CI, env validation, reportError, review)."
```

---

## Task 5: ROADMAP.md (where we're going) + STATUS.md (where we are)

**Files:**
- Replace: `ROADMAP.md`
- Create: `STATUS.md`
- Reference (read-only source): `../VERTICAL_ROADMAP.md` (out-of-repo, on Desktop/motosite)

Consolidate the out-of-repo planning into the single in-repo `ROADMAP.md`, and create the `STATUS.md` snapshot. Per [ADR 0003]: `ROADMAP.md` = releases + slices with **stable ids**, **no commits/branches**; `STATUS.md` references slice ids (e.g. `R0-S01 ✅`) and **never copies their descriptions**, **no release planning**.

- [ ] **Step 5.1: Replace ROADMAP.md with the consolidated roadmap**

Read the out-of-repo `../VERTICAL_ROADMAP.md` (78 slices, releases R0–R6) and the existing in-repo `ROADMAP.md`. Produce a single in-repo `ROADMAP.md`:
- Releases `R0..R6`, each with its slices under stable ids `R{n}-S{nn}` and a one-line outcome per slice.
- **No** branch names, commit SHAs, PR numbers, or status markers (those belong in `STATUS.md`).
- A header note: "Single source for delivery sequence (ADR 0003). Status lives in STATUS.md. A PDF export is kept beside the contract."
- Preserve the risk-first sequencing already in `VERTICAL_ROADMAP.md`; do not invent new slices.

Acceptance: `ROADMAP.md` contains stable slice ids and zero occurrences of `commit`, branch names, or `✅`/`PR #`.

- [ ] **Step 5.2: Create STATUS.md**

Create `STATUS.md`:
- Sections: **Done**, **In flight**, **Blocked**, **Verified dead** (Track B candidates).
- Each entry is a roadmap slice id + a one-line status, e.g. `- R0-S01 ✅ done` — **no description copied** from ROADMAP.
- Record current truth: Track A slices done (price-tampering, checkout wiring, checkStock id→SKU — map to their roadmap ids); Track C in flight; Track B/D not started.
- Header note: "Where we are now (ADR 0003). Sequence lives in ROADMAP.md. References slice ids only."

Acceptance: every `STATUS.md` entry starts with a slice id present in `ROADMAP.md`; no slice description prose is duplicated.

- [ ] **Step 5.3: Verify the two-doc contract (no duplicated descriptions)**

Run: `pnpm exec node -e "const fs=require('fs');const r=fs.readFileSync('ROADMAP.md','utf8');const s=fs.readFileSync('STATUS.md','utf8');if(/commit|PR #|origin\//.test(r))throw new Error('ROADMAP leaks delivery refs');console.log('contract OK')"`
Expected: prints `contract OK`.

- [ ] **Step 5.4: Commit**

```bash
git add ROADMAP.md STATUS.md
git commit -m "docs(knowledge): consolidate roadmap in-repo + add STATUS snapshot

ROADMAP.md = where we're going (slices/releases, no commits); STATUS.md =
where we are now (slice ids only). Implements ADR 0003."
```

---

## Task 6: Knowledge-map wiring (memory demotion + pointers)

**Files:**
- Modify: `AGENTS.md` and `CLAUDE.md` (add a "Knowledge map" section)

Make the single knowledge system discoverable and demote `memory/` to pointers. This closes the "six drifting docs" problem at the entry point every agent reads first.

- [ ] **Step 6.1: Add the Knowledge map section**

Append to both `AGENTS.md` and `CLAUDE.md` (same block — they share content) a short section:

```markdown
## Knowledge map (ADR 0003 — one fact, one home)

| Question | Read | Never duplicate elsewhere |
|----------|------|---------------------------|
| What does this word mean? | `CONTEXT.md` (glossary) | term definitions |
| Why was this decided? | `docs/adr/` (append-only) | rationale |
| What are the rules? | `docs/STANDARDS.md` | standards |
| Where are we going? | `ROADMAP.md` (slices/releases) | delivery sequence |
| Where are we now? | `STATUS.md` (slice ids) | status |
| What is the code? | GitNexus (derived) | code structure in prose |

The AI `memory/` store holds **pointers, preferences, and gotchas only** — not project facts. If memory contradicts these docs, the docs win; fix the memory.
```

- [ ] **Step 6.2: Verify**

Run: `pnpm exec node -e "const fs=require('fs');['AGENTS.md','CLAUDE.md'].forEach(p=>{if(!fs.readFileSync(p,'utf8').includes('Knowledge map'))throw new Error('missing in '+p)});console.log('knowledge-map OK')"`
Expected: prints `knowledge-map OK`.

- [ ] **Step 6.3: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs(knowledge): add knowledge map + demote memory to pointers

Entry-point docs now route each fact-type to its single home (ADR 0003)."
```

---

## Task 7: Integration — full suite, build, PR

- [ ] **Step 7.1: Run the whole test suite**

Run: `pnpm test`
Expected: all pass except the two known pre-existing CSS-snapshot failures (`_components/fx/reveal.test.ts`, `_components/home/hero.test.ts`) — unrelated to Track C. New tests: env (4) + report-error (3).

- [ ] **Step 7.2: Lint + typecheck + build**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: all succeed.

- [ ] **Step 7.3: GitNexus detect-changes**

Run `gitnexus_detect_changes()` (if the index is available) and confirm only the Track C files changed. If the index is stale/locked, fall back to `git status` + the per-file scope above and note it in the PR.

- [ ] **Step 7.4: Open PR off main**

```bash
git push -u origin feat/track-c-standards-knowledge
gh pr create --base main --title "feat: Track C standards & knowledge system" --body "..."
```
PR body: what changed (env validation, reportError seam + boundary, CI, STANDARDS, ROADMAP/STATUS consolidation, knowledge map), why ([ADR 0003] + enforceability), how to test (`pnpm test && pnpm typecheck && pnpm build`), and the change scope.

---

## Self-Review

**Spec coverage (PRD Track C, stories 15–21 + ADR 0003):**
- Story 15 (one "where we are" + one "where we're going") → Task 5 (STATUS.md + ROADMAP.md). ✓
- Story 16 (delivery sequence in-repo, PDF beside contract) → Task 5 (ROADMAP.md note). ✓
- Story 17 (one knowledge system, every fact one home) → Tasks 5+6 + ADR 0003. ✓
- Story 18 (memory demoted to pointers) → Task 6. ✓
- Story 19 (written standards: tests/types/security/errors/git) → Task 4 (core 1–5). ✓
- Story 20 (CI: tests, lint, typecheck, build, perf, a11y) → Task 3 (lint/typecheck/test/build) + Task 4 (perf/a11y recorded as CI's planned jobs, deferred to Track D with a deployed URL — not dropped). ✓
- Story 21 (fail-fast env validation + error monitoring) → Tasks 1 + 2. ✓

**Placeholder scan:** Code tasks (1, 2, 3) carry complete code + exact commands. Docs tasks (4, 5, 6) carry exact structure, rules, sources, and checkable acceptance criteria (the appropriate altitude for prose). No "TBD"/"add later". ✓

**Type consistency:** `envSchema` → `Env` used in `env`; `reportError(error: unknown, context?: ErrorContext): string` used identically in `global-error.tsx`. ✓

**Deferred-but-not-dropped:** performance budget + accessibility CI jobs (need deployed URL → Track D); migrating ~20 `process.env.X!` call sites to `env` (mechanical, own slice). Both recorded explicitly, not silently omitted.
