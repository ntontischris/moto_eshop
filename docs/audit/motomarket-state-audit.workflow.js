// MotoMarket — autonomous full-codebase audit workflow.
// Companion to docs/audit/AUDIT-BRIEF.md. Report-only: scans, verifies, synthesizes — never fixes.
//
// HOW TO RUN: in a Claude Code session at the repo, invoke the Workflow tool with
//   { scriptPath: "<abs path to this file>" }
// The workflow returns { report, ... }; write `report` to docs/audit/<YYYY-MM-DD>-state-of-the-codebase.md.
//
// ⚠️ PORTABILITY: set ROOT below to the repo's absolute path on the target machine before running.

export const meta = {
  name: "motomarket-state-audit",
  description:
    "Autonomous full-codebase audit of moto_eshop: what exists, what is missing, what is broken, ranked findings doc",
  phases: [
    {
      title: "Recon",
      detail: "read STATUS/ROADMAP/ADRs/CONTEXT — the claimed state",
    },
    {
      title: "Audit",
      detail:
        "parallel senior-engineer auditors, one per dimension, grounded in real code",
    },
    {
      title: "Verify",
      detail: "adversarially verify every CRITICAL/HIGH finding",
    },
    { title: "Synthesize", detail: "merge + rank into one findings document" },
  ],
};

// ⚠️ Set this to the repo's absolute path on the machine that runs the audit.
const ROOT = "C:\\Users\\ntont\\Desktop\\motosite\\moto_eshop";

const FINDING_SCHEMA = {
  type: "object",
  required: ["dimension", "summary", "findings"],
  properties: {
    dimension: { type: "string" },
    summary: {
      type: "string",
      description: "2-4 sentence verdict for this dimension: where do we stand",
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        required: [
          "title",
          "status",
          "severity",
          "evidence",
          "recommendation",
          "confidence",
        ],
        properties: {
          title: { type: "string" },
          status: {
            type: "string",
            enum: ["exists", "partial", "missing", "broken", "risk"],
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low", "info"],
          },
          evidence: {
            type: "string",
            description:
              "concrete file:line refs or command output proving this",
          },
          recommendation: {
            type: "string",
            description: "what must be done to resolve it",
          },
          confidence: { type: "number" },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: "object",
  required: ["title", "verdict", "note"],
  properties: {
    title: { type: "string" },
    verdict: { type: "string", enum: ["confirmed", "refuted", "adjusted"] },
    adjustedSeverity: {
      type: "string",
      enum: ["critical", "high", "medium", "low", "info"],
    },
    note: {
      type: "string",
      description:
        "what the skeptic found when re-checking against the real code",
    },
  },
};

const baseRules = `You are a meticulous senior engineer auditing the MotoMarket codebase at ${ROOT}.
This is a Next.js 16 (Cache Components) headless storefront over a Supabase catalog, synced to the Entersoft ERP, with an AI assistant "Pit".
Ground EVERY claim in the actual files — open them with Read/Grep/Glob. Do NOT trust docs or memory as proof; verify against code.
The canonical truth lives in: CONTEXT.md (glossary), docs/adr/ (rationale), docs/STANDARDS.md, ROADMAP.md (where we are going), STATUS.md (where we are now).
For each finding give: status (exists/partial/missing/broken/risk), severity, hard evidence (file:line or command output), and a concrete recommendation.
Be exhaustive but precise — a senior engineer reports real gaps, not vibes. Prefer fewer high-confidence findings over speculation.`;

const DIMENSIONS = [
  {
    key: "build-health",
    focus:
      "Build, typecheck, lint and test health. Read package.json scripts. Actually RUN (Bash, cwd " +
      ROOT +
      "): the typecheck/lint/test scripts if present (e.g. pnpm typecheck, pnpm lint, pnpm test) and a production build if feasible/quick. Report exact failures, error counts, and whether the project compiles at all. If a command is too slow or needs secrets, say so and inspect statically instead.",
  },
  {
    key: "routing-rendering",
    focus:
      "Next.js app routing & rendering. The (store) catch-all [...path] clean URLs, the /product & /category prefixed 308 aliases (middleware), V3Provider, generateStaticParams, and the history of every-product-404 bugs under Cache Components. Verify clean + prefixed + non-seeded slugs render and that retired legacy PDP/PLP are truly gone.",
  },
  {
    key: "cart-checkout",
    focus:
      "Cart & checkout. Guest cart vs user cart merge-on-login, server-authoritative Order total (ADR 0001 — pricing must come from products table, never client). Look for price-tampering exposure, guest-cart-lost-on-login. Track D2 (cart) is the next planned slice — assess how much exists vs scaffolding.",
  },
  {
    key: "erp-entersoft",
    focus:
      "Entersoft ERP integration. The IErpAdapter interface, SKU vs Product-id resolution (CONTEXT.md), stock & price lookups. Is it real or stubbed? Does checkStock work (a known bug returned 0)? Are calls keyed by SKU as ADR/glossary require?",
  },
  {
    key: "security-secrets",
    focus:
      "Security. Hunt for hardcoded secrets/API keys (esp. leaked Entersoft keys reportedly in plaintext in env-setup.md or container .md files), Supabase RLS coverage, use of supabaseAdmin/service_role, getUser vs getSession, auth checks on API routes, input validation (Zod) at boundaries. This is highest priority — be thorough.",
  },
  {
    key: "catalog-data",
    focus:
      'Catalog & data layer. Supabase schema vs code, products/categories, slug separator, stock=0 issues, image architecture (legacy proxy vs Supabase storage, SmartImage). Caching ("use cache", negative-cache 404), data-access queries.',
  },
  {
    key: "ai-assistant",
    focus:
      'The AI shopping assistant "Pit" (chat). Tools it exposes (checkStock, addToCart), provider/key wiring (ANTHROPIC/OPENAI keys), and correctness — checkStock reportedly returns 0. Assess completeness and failure modes.',
  },
  {
    key: "i18n",
    focus:
      "Internationalization. next-intl setup, 6 locales, UI translation keys, SEO/sitemap, and whether catalog DATA translation is wired vs blocked on owner action (ANTHROPIC_API_KEY + migration + i18n:translate). Find drift between claimed and actual.",
  },
  {
    key: "campaign-engine",
    focus:
      "Campaign Engine: dynamic landing-page builder at /lp/[slug], admin builder, A/B decisioning, analytics, AI authoring. Reportedly merged & live. Verify it exists in code, has tests, and note any prod-pending owner actions (storage bucket SQL, env keys).",
  },
  {
    key: "tests-coverage",
    focus:
      "Test suite. Inventory test files, what is covered vs not (esp. auth & payment flows which the standards require at 100%, business logic at 80%). Identify critical untested paths (pricing, cart merge, ERP, checkout).",
  },
  {
    key: "docs-drift",
    focus:
      "Documentation truth & drift. Cross-check STATUS.md and ROADMAP.md (S-X.Y slices) against the actual code state. Are the 4 ADRs honored in code (server pricing, clean URLs canonical, single knowledge system, single storefront)? Is GitNexus index stale? Flag every place docs claim something the code contradicts.",
  },
];

phase("Recon");
const claimed = await agent(
  baseRules +
    `\n\nTASK: Read CONTEXT.md, ROADMAP.md, STATUS.md, docs/STANDARDS.md and all files under docs/adr/ at ${ROOT}. Produce a tight briefing of the CLAIMED state of the project: the intended architecture, the delivery slices done vs pending, the ADR decisions, and any known-open issues the docs admit. This briefing is handed to auditors so they can compare claim-vs-reality. Return plain text, dense, no preamble.`,
  { label: "recon:claimed-state", phase: "Recon" },
);

phase("Audit");
const audits = (
  await parallel(
    DIMENSIONS.map(
      (d) => () =>
        agent(
          baseRules +
            `\n\nCLAIMED STATE (from the docs — verify, do not trust):\n${claimed}\n\n` +
            `YOUR DIMENSION: ${d.key}\nFOCUS: ${d.focus}\n\n` +
            `Audit ONLY this dimension, deeply. Return the schema. Every finding must carry hard evidence (file:line or real command output).`,
          {
            label: `audit:${d.key}`,
            phase: "Audit",
            model: "sonnet",
            schema: FINDING_SCHEMA,
          },
        ),
    ),
  )
).filter(Boolean);

// Barrier is correct here: we need ALL findings together to pull the critical/high set across every dimension before verifying.
const allFindings = audits.flatMap((a) =>
  (a.findings || []).map((f) => ({ ...f, dimension: a.dimension })),
);
const toVerify = allFindings.filter(
  (f) => f.severity === "critical" || f.severity === "high",
);
log(
  `${allFindings.length} findings total; ${toVerify.length} CRITICAL/HIGH to adversarially verify`,
);

phase("Verify");
const verdicts = (
  await parallel(
    toVerify.map(
      (f) => () =>
        agent(
          baseRules +
            `\n\nA prior auditor reported this finding. Your job is to REFUTE it. Re-open the cited files yourself and check.\n` +
            `TITLE: ${f.title}\nDIMENSION: ${f.dimension}\nSTATUS: ${f.status}\nSEVERITY: ${f.severity}\nEVIDENCE CLAIMED: ${f.evidence}\nRECOMMENDATION: ${f.recommendation}\n\n` +
            `Return verdict: 'confirmed' if the evidence holds as-is; 'refuted' if it is wrong/outdated/non-reproducible; 'adjusted' if real but mis-severitied (give adjustedSeverity). Default to refuted if you cannot independently reproduce it.`,
          {
            label: `verify:${f.dimension}`,
            phase: "Verify",
            model: "sonnet",
            schema: VERDICT_SCHEMA,
          },
        ).then((v) => ({ ...f, verify: v })),
    ),
  )
).filter(Boolean);

// Re-merge verdicts back onto the full finding set (non-high findings carry no verdict).
const verifyByTitle = new Map(verdicts.map((v) => [v.title, v.verify]));
const finalFindings = allFindings.map((f) => ({
  ...f,
  verify: verifyByTitle.get(f.title) || null,
}));
const refutedCount = finalFindings.filter(
  (f) => f.verify?.verdict === "refuted",
).length;
log(
  `Verification done: ${refutedCount} of ${toVerify.length} high-severity findings refuted on second look`,
);

phase("Synthesize");
const report = await agent(
  baseRules +
    `\n\nYou are the lead engineer writing the final State-of-the-Codebase audit for MotoMarket.\n` +
    `Here is the CLAIMED state:\n${claimed}\n\n` +
    `Here are ALL findings (JSON), each with an optional adversarial 'verify' verdict (refuted findings should be dropped or demoted; adjusted findings re-rated):\n` +
    JSON.stringify(finalFindings, null, 2) +
    `\n\nWrite a single, well-structured Markdown document. Required sections:\n` +
    `1. **Executive summary** — where MotoMarket stands today in 5-8 bullets (the honest answer to "pou vriskomaste").\n` +
    `2. **Critical & high issues** — table: Issue | Status | Severity | Evidence | What must be done. Drop refuted findings; apply adjusted severities.\n` +
    `3. **By dimension** — one subsection per dimension with its verdict and notable medium/low findings.\n` +
    `4. **What exists vs what is missing** — a clear two-column inventory.\n` +
    `5. **Docs-vs-reality drift** — every place STATUS/ROADMAP/ADRs disagree with the code.\n` +
    `6. **Recommended action plan** — prioritized, numbered, each item small and concrete (the "ti prepei na ginei").\n\n` +
    `Be specific and cite file paths. No fluff. Return ONLY the Markdown document, starting with a top-level '# ' heading.`,
  { label: "synthesize:report", phase: "Synthesize" },
);

return {
  report,
  totalFindings: allFindings.length,
  highVerified: toVerify.length,
  refuted: refutedCount,
};
