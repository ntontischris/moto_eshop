# Campaign Engine — B/C/D Roadmap

> **Fidelity note:** This is a task-level roadmap, not a step-level executable plan. B/C/D build on the concrete interfaces produced by sub-project A (`Block`/`Blocks`, `CampaignWithVariants`, `resolveVariant`, `BlockRenderer`, `getCampaignBySlug`) and on the merged i18n tree. Each sub-project gets its own full step-level plan (with failing tests + exact code) via the writing-plans skill **at the time it starts** — writing that detail now would go stale before it is touched. Build order: A → B → C → D.

---

## B. Builder

**Goal:** A marketer creates, edits, previews, and publishes campaigns from the admin — no SQL, no dev. Completes the block library.

**Files (new, under existing `src/app/admin/`):**
- `src/app/admin/campaigns/page.tsx` — list (status, dates, variant count, headline metrics placeholder until C)
- `src/app/admin/campaigns/new/page.tsx` + `[id]/edit/page.tsx` — campaign editor shell
- `src/app/admin/campaigns/_components/variant-editor.tsx` — reorder blocks, edit fields
- `src/app/admin/campaigns/_components/block-field-forms/*.tsx` — one form per block type
- `src/app/admin/campaigns/_components/product-picker.tsx` — catalog search → product IDs
- `src/app/admin/campaigns/_components/campaign-preview.tsx` — reuses `BlockRenderer`
- `src/app/admin/campaigns/actions.ts` — server actions: create/update/publish/unpublish/clone/archive (service-role writes, admin-checked)
- `src/lib/campaigns/blocks/` — add remaining blocks: `editorial`, `comparison`, `faq`, `socialProof`, `brandStrip`, `emailCapture`, `stickyCta`, and the `productRail` `brand=auto` path. Each = schema entry (extend `blockSchema`) + component + `BlockRenderer` case.

**Key tasks:**
1. Extend `blockSchema` with the 7 remaining blocks (TDD on schema like A-Task 2) + their components + renderer cases.
2. Server actions with admin guard (reuse the existing admin auth check used by `src/app/admin/*`) and `blocksSchema.parse` before persist (fail-fast on bad input).
3. Variant editor: client component holding `Blocks` state; add/remove/reorder; per-block field form keyed by `block.type`.
4. Product picker: searches existing catalog query; returns IDs into a `productRail` manual source.
5. Preview pane renders current editor state through `BlockRenderer`.
6. Lifecycle actions: `clone` deep-copies campaign + variants with a new slug; `publish` sets status + validates each variant parses.

**Test strategy:** schema/validation and the pure clone/serialize helpers are unit-tested (Vitest). Server actions tested via their pure core (input → row payload). UI wiring verified manually + a smoke test that the editor round-trips a `Blocks` array.

**Done when:** a campaign can be authored, previewed, published, cloned, and archived entirely from `/admin/campaigns`, and all 12 blocks render.

---

## C. Decisioning + Analytics

**Goal:** Serve up to four variants by split and/or targeting with sticky per-visitor assignment, and measure per-variant performance.

**Files:**
- `src/lib/campaigns/signals.ts` — pure: extract `{ source, utm, device, geo, isReturning }` from searchParams + headers + cookie
- `src/lib/campaigns/targeting.ts` — pure: `matchesRules(rules, signals) → boolean`; defines the `targeting_rules` type (replaces the `unknown[]` placeholder in A's `CampaignVariant`)
- `src/lib/campaigns/resolve-variant.ts` — **extend** A's function: add `(campaign, signals, bucket)` overload doing targeting → weighted split → default per `serving_mode`
- `src/lib/campaigns/sticky.ts` — pure: hash(sessionId + campaignId) → stable bucket in [0,1)
- `src/lib/campaigns/events.ts` — server action: `recordEvent({campaignId, variantId, type, value?})` via service role
- `src/app/[locale]/(store)/lp/[slug]/page.tsx` — **modify**: read signals/cookie, pass to resolver, set sticky cookie, fire `view`
- cart/add-to-cart path — **modify**: tag session with `{campaignId, variantId}` when added from an LP
- `src/app/[locale]/(store)/checkout/success/page.tsx` — **modify**: on success, `recordEvent('purchase', value)` for the tagged campaign/variant
- `src/app/admin/campaigns/[id]/analytics/*` — per-campaign dashboard (views, CTA, ATC, purchases, revenue, per variant, leading-variant highlight)

**Key tasks:**
1. `signals` + `targeting` + `sticky` pure modules, fully TDD (deterministic — easy unit tests).
2. Extend `resolveVariant` with the `serving_mode` branching from the spec (targeting / split / mixed); TDD with fixed buckets so split is deterministic.
3. `recordEvent` server action; wire `view` in the route, `cta_click` via a small client beacon on CTA blocks, `add_to_cart` + `purchase` via the cart/checkout hooks.
4. Attribution: store `{campaignId, variantId}` on the cart/session (zustand store already exists) so checkout can read it.
5. Dashboard: aggregate queries grouped by `variant_id`; simple conversion rate; highlight the variant with the best ATC/purchase rate (no significance math in v1).

**Test strategy:** the resolver, targeting, signals, sticky-hash, and aggregation/“leading variant” selection are pure and unit-tested. Event firing verified by asserting the server action payloads.

**Done when:** two+ variants serve correctly by split and by targeting rule, assignment is sticky per visitor, and the dashboard shows per-variant views→purchase with a leading-variant highlight.

---

## D. AI authoring

**Goal:** From a one-sentence brief, Claude drafts up to four variants assembled only from the block library and real products; the marketer reviews and publishes.

**Files:**
- `src/lib/campaigns/ai/catalog-tool.ts` — `searchCatalog(query, filters)` returning real `{id,name,price,image}` (wraps existing catalog queries)
- `src/lib/campaigns/ai/block-json-schema.ts` — JSON Schema derived from `blockSchema` (Zod → JSON Schema) for the model's structured output
- `src/lib/campaigns/ai/generate-variants.ts` — server action: calls `@anthropic-ai/sdk` with brand-voice system prompt + the catalog tool + block schema; returns N variants
- `src/lib/campaigns/ai/repair.ts` — pure: validate model output against `blocksSchema`; on failure, one structured repair attempt, else reject
- `src/app/admin/campaigns/_components/ai-brief.tsx` — brief box (audiences, tone, products, discount, variant count) → calls the action → fills the variant editor as drafts

**Key tasks:**
1. `searchCatalog` tool + its tests (returns real products; respects filters/limit).
2. Zod→JSON-Schema conversion for the block union; lock the model to assemble only valid blocks (no raw HTML beyond `richText`, which is sanitized on render by A).
3. `generate-variants` action with **prompt caching** (cache the system prompt + schema; per Claude API best practices) and Haiku-draft / optional Sonnet-polish tiering (mirrors the existing i18n translate tiering).
4. `repair` step: every variant must `blocksSchema.parse` before it reaches the editor; invalid → one repair pass → else drop that variant.
5. Brief UI writes results into the B variant editor as **drafts**; human always reviews before publish (no auto-publish).

**Test strategy:** `repair`, the JSON-schema conversion, and `searchCatalog` are unit-tested. The model call is integration-tested behind a flag/fixture; correctness of *output shape* (valid `Blocks`, real product IDs) is asserted, not prose quality.

**Done when:** a marketer types a brief, receives ≤4 validated draft variants with real products and on-brand copy, edits them in the B editor, and publishes.

---

## Cross-cutting

- **Mobile-first** on every block and the builder preview (project rule; ad traffic is mostly mobile).
- **Security:** admin-guard all writes; service-role only server-side; `campaign_events` never client-inserted; `richText` sanitized; AI output Zod-validated before persistence; `noindex` default.
- **No new heavy deps** without need (YAGNI); reuse existing catalog queries, admin auth, zustand cart store, and storefront components.
