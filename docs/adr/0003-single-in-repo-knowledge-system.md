# Single in-repo knowledge system

The project's "where are we / where are we going" knowledge was scattered across ≥6 places (out-of-repo `VERTICAL_ROADMAP.md`, `MOTOMARKET_MASTER_PLAN.md`, `MOTOMARKET_BUILD_PLAN.md`, the `docs/ecosystem/` curriculum, the AI `memory/` store, and GitNexus), which drift and contradict each other. We adopt one rule — **every fact lives in exactly one artifact; everything else links, never copies** — and give each artifact a single job:

- **GitNexus** — derived: what the code *is*. Never hand-duplicated in prose.
- **`CONTEXT.md`** — the language (glossary only).
- **`docs/adr/`** — why a decision was made (append-only).
- **`ROADMAP.md`** — where we're going: delivery sequence, slices, releases. No commits/branches.
- **`STATUS.md`** — where we are now: done / in-flight / blocked / verified-dead. References roadmap slice ids (e.g. `R2-S04 ✅`) but never copies their descriptions. No release planning.
- **`memory/`** (claude-mem) — AI session continuity only: pointers into the repo docs, preferences, gotchas. Not a source of project fact.

`ROADMAP.md` lives **inside the repo** (chosen over keeping it beside the contract) so it is version-controlled, PR-reviewable, single-history, and reliably readable by the agent; a PDF/export is kept beside the contract for the client. `MASTER_PLAN`, `BUILD_PLAN` and `VERTICAL_ROADMAP` collapse into this one `ROADMAP.md`. `docs/ecosystem/` stays as a learning curriculum (different purpose, not a status tracker).
