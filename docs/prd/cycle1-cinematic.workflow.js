export const meta = {
  name: "cycle1-cinematic",
  description:
    "Implement Cycle 1 (#120-#125): cinematic dark parity + PDP gap-closers + reserved slots, via 5 file-disjoint territories run in parallel (recon -> implement -> verify).",
  phases: [
    {
      title: "Recon",
      detail: "read-only mapping of files + existing patterns per territory",
    },
    {
      title: "Implement",
      detail:
        "one agent per territory edits ONLY its files, writes a source-assertion test",
    },
    {
      title: "Verify",
      detail:
        "adversarial check: AC met, no regressions, no forbidden patterns",
    },
  ],
};

// ---------------------------------------------------------------------------
// Shared guardrails — embedded into every implementation prompt.
// ---------------------------------------------------------------------------
const SHARED_RULES = `
HARD RULES (this repo, non-negotiable):
- This is NOT the Next.js you know (see AGENTS.md). Mirror EXISTING patterns in the repo; do not invent APIs from memory. When unsure how something is wired, read a neighbouring already-cinematic surface (PDP, cart, checkout) and copy its approach.
- DO NOT run any git command (no add/commit/push/branch). Leave changes in the working tree only. The orchestrator commits.
- Edit ONLY files inside YOUR territory (listed below). Touch nothing else. Creating NEW files inside your territory is allowed.
- DO NOT edit src/app/[locale]/(store)/_styles/tokens.css. Consume the existing --v3-* tokens. If a token you need is genuinely missing, define a local CSS var inside YOUR route-scoped CSS file, never in the global tokens file.
- Performance budget (ADR 0008): NO new JS libraries / npm deps. ADR 0007: keep new CSS route-scoped (containment) so nothing lands on the home critical path. Mirror how the existing *.css files are scoped/imported.
- Respect prefers-reduced-motion. No flash of a light theme on load — use the EXISTING theme mechanism (data-v3-mode / v3-provider), do not roll your own.
- Preserve ALL existing behaviour (auth gates, grids, selectors, add-to-cart, empty states). This cycle is presentation + inert slots only: NO schema / API / server-action / data-layer changes. Reserved "slots" are inert markup with a clear marker comment/data-attr and NO functional behaviour.
- Impact rule (CLAUDE.md): before editing a SHARED component symbol (buy-box, product-view, button, card, badge, input, dialog, sheet, gallery), load mcp__gitnexus__impact via ToolSearch and run it on that symbol; include the blast-radius + risk in your report. If risk is CRITICAL, STOP and return a blocker instead of editing. Leaf route pages (wishlist/garage/account page.tsx) are low blast-radius — a note is enough.
- Tests: add a vitest SOURCE-ASSERTION test mirroring the prior art (read source via readFileSync, assert presence/absence of contract markers — NOT styling). Run ONLY your own test file: pnpm vitest run <yourTestPath>. Do not run the full suite. Report the exact command and whether it passed.
- Keep changes surgical and match surrounding style. Small focused functions. TypeScript. No console.log, no TODO left behind, no commented-out code.
`;

const RECON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "targetFiles",
    "newFiles",
    "patterns",
    "priorArtTestPath",
    "risks",
    "tokenWiring",
  ],
  properties: {
    targetFiles: {
      type: "array",
      items: { type: "string" },
      description:
        "existing files this territory must edit (absolute or repo-relative)",
    },
    newFiles: {
      type: "array",
      items: { type: "string" },
      description: "new files to create (e.g. the route-scoped css + the test)",
    },
    tokenWiring: {
      type: "string",
      description:
        "EXACTLY how --v3-* tokens + data-v3-mode reach this route today, and what (if anything) must be added so they apply. Critical for wishlist/garage which live OUTSIDE the (store) group.",
    },
    patterns: {
      type: "string",
      description:
        "concrete snippets/paths of the canonical pattern to mirror: how route-scoped css is imported, how data-v3-mode is set, CVA setup for primitives, etc.",
    },
    priorArtTestPath: {
      type: "string",
      description: "the closest existing *.css.test.ts / *.test.ts to mirror",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "collision/regression risks the implementer must avoid",
    },
  },
};

const IMPL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "issues",
    "filesChanged",
    "newFiles",
    "testPath",
    "testCommand",
    "testPassed",
    "acChecklist",
    "impactRisk",
    "blockers",
    "notes",
  ],
  properties: {
    issues: { type: "array", items: { type: "string" } },
    filesChanged: { type: "array", items: { type: "string" } },
    newFiles: { type: "array", items: { type: "string" } },
    testPath: { type: "string" },
    testCommand: { type: "string" },
    testPassed: { type: "boolean" },
    acChecklist: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ac", "done", "evidence"],
        properties: {
          ac: { type: "string" },
          done: { type: "boolean" },
          evidence: { type: "string" },
        },
      },
    },
    impactRisk: {
      type: "string",
      description:
        "gitnexus impact summary for shared symbols touched, or N/A (leaf route)",
    },
    blockers: { type: "string", description: "empty string if none" },
    notes: { type: "string" },
  },
};

const VERIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "territory",
    "passed",
    "testReproduced",
    "acUnmet",
    "forbiddenPatterns",
    "regressions",
    "verdict",
  ],
  properties: {
    territory: { type: "string" },
    passed: { type: "boolean" },
    testReproduced: {
      type: "boolean",
      description: "did you re-run the territory test and see it pass",
    },
    acUnmet: { type: "array", items: { type: "string" } },
    forbiddenPatterns: {
      type: "array",
      items: { type: "string" },
      description:
        "e.g. edits to tokens.css, new npm dep, leftover light Tailwind semantic tokens, a JS lightbox lib, git commands run",
    },
    regressions: { type: "array", items: { type: "string" } },
    verdict: { type: "string" },
  },
};

// ---------------------------------------------------------------------------
// Territory definitions. Each is file-disjoint from the others.
// ---------------------------------------------------------------------------
const TERRITORIES = [
  {
    key: "wishlist",
    issues: ["#120"],
    label: "Wishlist cinematic parity",
    scope: `
TERRITORY FILES (edit only these, plus new files co-located with them):
- src/app/[locale]/wishlist/page.tsx
- src/components/wishlist/* (only if the page composes them and they need dark styling)
- NEW: a route-scoped CSS file co-located with the wishlist route (mirror how cart/checkout scope their css)
- NEW: a vitest source-assertion test for the wishlist route

GOAL (issue #120): Bring the Wishlist page to full cinematic dark (Race-Grade) parity with home/PDP. Today it renders light (white cards, light Tailwind semantic tokens). Restyle using v3 tokens (--v3-*) and .v3-* classes via a route-scoped CSS file. Apply data-v3-mode so there is NO flash of light theme. Keep ALL functionality (auth-gated grid of saved products, wishlist toggle, stock status, empty state).

CRITICAL: this route lives OUTSIDE the (store) group, so --v3-* tokens may not currently reach it. Use the recon's tokenWiring finding to ensure the tokens + data-v3-mode actually apply here (import the tokens/scoped css and set the mode the same way the (store) surfaces do).

ACCEPTANCE (must all hold + be asserted by your test where it is a source marker):
- renders dark cinematic theme, visually consistent with home/PDP/PLP
- source references --v3-* tokens and .v3-* classes and NO LONGER references the light Tailwind semantic tokens it previously used
- styles route-scoped (not on the home critical path) — mirror existing containment tests
- grid, toggle, stock, empty state, auth gate still work
- prefers-reduced-motion honored; no light-theme flash`,
  },
  {
    key: "garage",
    issues: ["#121"],
    label: "Garage cinematic parity + bike-list slot",
    scope: `
TERRITORY FILES (edit only these, plus new files co-located):
- src/app/[locale]/garage/page.tsx
- src/components/garage/{bike-selector,compatibility-badge,garage-card}.tsx (style only; keep behaviour)
- src/lib/garage/guest-garage.ts (read for behaviour; edit ONLY if strictly needed for styling wiring — prefer not to)
- NEW: a route-scoped CSS file co-located with the garage route
- NEW: a vitest source-assertion test for the garage route

GOAL (issue #121): Bring the Garage page (/garage) to cinematic dark parity, SAME approach as wishlist: v3 tokens via route-scoped CSS, data-v3-mode, reduced-motion. Keep behaviour (cascading make->model->year selector, list of user's bikes w/ primary flag, auth gate). ALSO reserve a bike-list slot: an inert, clearly-marked container where the future Garage add/remove-bikes feature (S-4.1) will attach. Slot = markup only, no data wiring, with a clear marker comment/data-attr.

CRITICAL: /garage also lives OUTSIDE the (store) group — same token-wiring concern as wishlist; honor recon's tokenWiring finding.

ACCEPTANCE:
- dark cinematic theme consistent with the store
- source uses --v3-* / .v3-* not light Tailwind semantic tokens
- styles route-scoped (off home critical path)
- bike selector + bike list + auth gate still work
- a reserved bike-list slot container present (inert markup, marked for S-4.1)
- prefers-reduced-motion honored; no light-theme flash`,
  },
  {
    key: "account",
    issues: ["#122"],
    label: "Account parity + reserved nav slots",
    scope: `
TERRITORY FILES (edit only these, plus new files co-located):
- src/app/[locale]/(store)/account/page.tsx
- NEW (if appropriate, matching neighbours): a route-scoped css for account OR keep the existing inline-style approach but bring it to parity — follow whatever the recon says the account page already does
- NEW: a vitest source-assertion test for the account page

GOAL (issue #122): Polish the Account page to the same cinematic bar as the rest of the store. It already uses v3 tokens via inline styles but is visually thin; tighten header, orders table, empty state to match home/PDP language. RESERVE navigation slots (inert markup only) for: a garage entry, a wishlist entry, an order-detail entry. The underlying profile-edit / address-book / order-detail VIEWS are OUT OF SCOPE — slots only, clearly marked.

ACCEPTANCE:
- account polished to cinematic parity (header, orders table, empty state)
- source uses --v3-* / .v3-* classes
- reserved nav slots present for garage, wishlist, order-detail (inert markup, marked)
- logged-in (orders) and guest views still work
- NO profile-edit/address-book/order-detail content built (slots only)
- prefers-reduced-motion honored; no light-theme flash`,
  },
  {
    key: "pdp-plp",
    issues: ["#123", "#124"],
    label: "PDP gap-closers + reserved PDP/PLP slots",
    scope: `
TERRITORY FILES (edit only these, plus new files co-located). You own BOTH #123 and #124 so there is NO collision — do the edits sequentially in one pass:
- src/app/[locale]/(store)/_components/pdp/{product-gallery,buy-box,product-view,size-selector}.tsx
- src/app/[locale]/(store)/_components/pdp/pdp.css
- src/app/[locale]/(store)/_components/pdp/pdp.css.test.ts (extend it)
- src/app/[locale]/(store)/_components/plp/* (the filter area component + its css; extend plp.css.test.ts)

GOAL #123 — PDP gap-closers (both lightweight):
1. Image lightbox: clicking a gallery image opens a full-screen view built on the NATIVE <dialog> element, NO JS library. Keyboard-operable: open, navigate between images with arrow keys, close with ESC; manage focus. Honor prefers-reduced-motion.
2. Mobile sticky add-to-cart bar: on screens < 768px, a bottom-fixed buy bar (price + add-to-cart) that stays visible after the user scrolls past the buy-box. CSS-ONLY (reuse the existing shell sticky-bar pattern), wired to the EXISTING add-to-cart action (no duplicate logic). The sticky-bar rule MUST be guarded by a max-width:768px media query.

GOAL #124 — reserve feature slots (ALL inert markup only, clearly marked, layout unaffected when empty):
- PDP per-size stock-badge container (marker for S-2.8)
- PDP Reviews tab/section: a 4th tab alongside Description/Specs/Shipping (marker for S-2.9, empty placeholder)
- PDP bike-compatibility badge container in the buy-box (marker for S-4.4)
- PLP "fits my bike" filter-chip container in the filter area (marker for S-4.3)

ACCEPTANCE (extend pdp.css.test.ts and plp.css.test.ts):
- gallery image opens native <dialog> lightbox; ESC + arrows work; focus managed; NO new JS dep
- on <768px a CSS-only sticky add-to-cart bar appears after scrolling past the buy-box; rule guarded by max-width:768px; wired to existing add-to-cart
- inert per-size badge container (S-2.8), Reviews tab/section (S-2.9), compatible-badge container in buy-box (S-4.4), PLP filter-chip container (S-4.3) — each present + marked, NO functional behaviour
- layout unaffected when slots empty; both gap-closers honor prefers-reduced-motion
- existing PDP/PLP behaviour unregressed`,
  },
  {
    key: "primitives",
    issues: ["#125"],
    label: "Shared UI primitives: dark variants",
    scope: `
TERRITORY FILES (edit only these):
- src/components/ui/{button,card,badge,input,dialog,sheet}.tsx
- their co-located tests (or a NEW source-assertion test if none exist)

GOAL (issue #125): Give the shared primitives a cinematic/dark variant so later cycles (Size, Reviews, Fitment) have consistent dark building blocks. Scope ONLY: button, card, badge, input, dialog (+ sheet if trivial). Implement via the EXISTING pattern: add a dark variant prop to the CVA definitions (button/badge already use CVA) and/or extend scoped styles keyed to the data-v3-mode selector already used on PDP/account. DO NOT create parallel duplicate dark components — keep the library single-sourced. Use --v3-* tokens for the dark variants.

IMPORTANT: existing LIGHT-mode usage of these primitives must be UNCHANGED (no regressions). The dark variant is additive (new variant value / new data-v3-mode scoped rules), default behaviour identical.

ACCEPTANCE:
- button, card, badge, input, dialog each render correctly in cinematic dark mode
- implemented via CVA variant props / data-v3-mode scoped selectors — no duplicate components
- existing light-mode usage unchanged
- dark variants use --v3-* tokens
- a source-assertion test confirms a dark variant exists for each primitive`,
  },
];

function reconPrompt(t) {
  return `You are the RECON agent for the "${t.key}" territory of Cycle 1 (issues ${t.issues.join(", ")}) on the MotoMarket Next.js storefront.

READ-ONLY. Do NOT edit anything. Map the ground truth so the implementer does not thrash.

${t.scope}

Deliver a precise map:
1. targetFiles: the existing files that must be edited.
2. newFiles: the new files to create (route-scoped css + the test), using the repo's real naming/location convention (look at how cart/checkout/pdp co-locate *.css and *.css.test.ts).
3. tokenWiring: EXACTLY how --v3-* tokens and data-v3-mode currently reach this route, and what must be added so they apply. For wishlist/garage (OUTSIDE the (store) group) this is the highest-risk item — find where (store) surfaces import tokens.css / set data-v3-mode and state how to replicate it for this route WITHOUT touching tokens.css or polluting the home critical path.
4. patterns: concrete snippets + file:line of the canonical pattern to mirror (route-scoped css import, data-v3-mode set point, CVA setup for primitives, the existing sticky-bar shell pattern for PDP, the existing tab structure for PDP).
5. priorArtTestPath: the closest existing source-assertion test to mirror.
6. risks: collision/regression hazards (e.g. light Tailwind semantic tokens currently used that must be removed; anything that could regress CWV/LCP).

Use Grep/Glob/Read. Be exhaustive but return only the structured map.`;
}

function implPrompt(t, recon) {
  return `You are the IMPLEMENTATION agent for the "${t.key}" territory of Cycle 1 (issues ${t.issues.join(", ")}) on the MotoMarket Next.js storefront. Implement it in the best possible way, production quality.

${t.scope}

${SHARED_RULES}

RECON MAP (ground truth from a read-only pass — trust it, but verify by reading the files yourself before editing):
targetFiles: ${JSON.stringify(recon?.targetFiles ?? [])}
newFiles: ${JSON.stringify(recon?.newFiles ?? [])}
tokenWiring: ${recon?.tokenWiring ?? "n/a"}
patterns: ${recon?.patterns ?? "n/a"}
priorArtTestPath: ${recon?.priorArtTestPath ?? "n/a"}
risks: ${JSON.stringify(recon?.risks ?? [])}

Workflow:
1. Read the target files + the prior-art test + one neighbouring already-cinematic surface for the pattern.
2. For shared component symbols, run gitnexus_impact (via ToolSearch) and record risk; stop if CRITICAL.
3. Implement the change surgically. Keep it route-scoped, token-driven, reduced-motion-safe, no new JS deps.
4. Add the source-assertion test mirroring the prior art; assert the contract markers (v3 tokens present, light tokens absent, slot markers present, <dialog> present, max-width:768px media query present, etc. as applicable).
5. Run ONLY your test: pnpm vitest run <testPath>. If it fails, fix and re-run until green.
6. Return the structured report. Set testPassed truthfully. List every file changed. blockers = '' if none.`;
}

function verifyPrompt(t, impl) {
  return `You are the ADVERSARIAL VERIFY agent for the "${t.key}" territory of Cycle 1 (issues ${t.issues.join(", ")}). Your job is to try to FALSIFY the implementer's claims. Be skeptical; default to "not passed" unless the evidence is in the files.

${t.scope}

The implementer reported:
filesChanged: ${JSON.stringify(impl?.filesChanged ?? [])}
newFiles: ${JSON.stringify(impl?.newFiles ?? [])}
testPath: ${impl?.testPath ?? "n/a"}
testCommand: ${impl?.testCommand ?? "n/a"}
testPassed(claimed): ${impl?.testPassed}
blockers: ${impl?.blockers ?? ""}

Checks (read the actual files; do not edit anything):
1. Re-run the territory test: ${impl?.testCommand || "the reported test command"}. Set testReproduced to whether it actually passes now.
2. acUnmet: list any acceptance criterion from the scope NOT actually satisfied in the source.
3. forbiddenPatterns: flag ANY of — edits to src/app/[locale]/(store)/_styles/tokens.css; a new npm dependency (check package.json git diff); leftover light Tailwind semantic tokens where they should be gone (wishlist/garage); a JS lightbox library instead of native <dialog>; missing max-width:768px guard on the sticky bar; any git command evidence; a slot wired to real behaviour instead of inert markup.
4. regressions: anything that could break existing behaviour (auth gate, add-to-cart, selectors, light-mode primitive usage) or the home critical path / CWV.
5. verdict: one paragraph. passed = true ONLY if testReproduced AND acUnmet empty AND forbiddenPatterns empty AND regressions empty.

Use Bash to re-run the test, Read/Grep to inspect. Return the structured verdict.`;
}

// ---------------------------------------------------------------------------
// Run: each territory independently through recon -> implement -> verify.
// Territories are file-disjoint, so they run fully in parallel with no race.
// pipeline() gives no barrier between stages: territory A can be implementing
// while territory B is still in recon.
// ---------------------------------------------------------------------------
log(
  `Cycle 1: ${TERRITORIES.length} file-disjoint territories -> recon -> implement -> verify, in parallel.`,
);

const results = await pipeline(
  TERRITORIES,
  (t) =>
    agent(reconPrompt(t), {
      label: `recon:${t.key}`,
      phase: "Recon",
      schema: RECON_SCHEMA,
      effort: "medium",
    }),
  (recon, t) =>
    agent(implPrompt(t, recon), {
      label: `impl:${t.key}`,
      phase: "Implement",
      schema: IMPL_SCHEMA,
      effort: "high",
      agentType: "general-purpose",
    }).then((impl) => ({ territory: t.key, issues: t.issues, recon, impl })),
  (prev, t) =>
    agent(verifyPrompt(t, prev.impl), {
      label: `verify:${t.key}`,
      phase: "Verify",
      schema: VERIFY_SCHEMA,
      effort: "high",
    }).then((verify) => ({ ...prev, verify })),
);

const clean = results.filter(Boolean);
const passed = clean.filter((r) => r.verify?.passed).map((r) => r.territory);
const failed = clean.filter((r) => !r.verify?.passed).map((r) => r.territory);
log(
  `Done. passed=[${passed.join(", ")}] needs-attention=[${failed.join(", ")}]`,
);

return {
  summary: {
    territories: clean.length,
    passed,
    failed,
  },
  results: clean.map((r) => ({
    territory: r.territory,
    issues: r.issues,
    filesChanged: r.impl?.filesChanged ?? [],
    newFiles: r.impl?.newFiles ?? [],
    testPath: r.impl?.testPath,
    testPassed: r.impl?.testPassed,
    implBlockers: r.impl?.blockers ?? "",
    impactRisk: r.impl?.impactRisk ?? "",
    verifyPassed: r.verify?.passed,
    acUnmet: r.verify?.acUnmet ?? [],
    forbiddenPatterns: r.verify?.forbiddenPatterns ?? [],
    regressions: r.verify?.regressions ?? [],
    verdict: r.verify?.verdict ?? "",
  })),
};
