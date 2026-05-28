# MotoMarket AI Sales Assistant Design

A native, agentic sales concierge that lives inside the storefront and behaves like the most experienced salesperson in the shop: it speaks the customer's own language — Greek, English, the other four site locales (DE/IT/FR/BG), and **any other language the customer chooses** (Albanian, Russian, Polish, Arabic, Romanian — 95+ via GPT-4o native multilingual fluency) — knows every product live from the catalog, drives the site on the customer's behalf (filters, navigation, cart), accepts voice messages Telegram-style, and never hallucinates a price, a spec, or a stock figure because every claim is tool-grounded against the real backend.

The value is the integration. Off-the-shelf widgets (Tidio, Intercom Fin, Crisp + ChatGPT plugins) bolt a chat on top of a site. This assistant *is part* of the site — it shares the cart, the routes, the i18n locale, the saved bike profile, the Meilisearch index, the Odoo stock, and the Supabase user profile. Combined with a Telegram-style multimodal UI (text + voice messages + inline product cards + co-pilot site navigation), this is the 2026 state-of-the-art for moto e-commerce.

## Goals

- A visitor opens a chat panel and gets accurate, conversational sales help **in their own language** — whether that's one of the 6 site locales (EL/EN/DE/IT/FR/BG) or any other language the customer naturally writes/speaks in (Albanian, Russian, Polish, Arabic, etc.). The assistant detects language from the customer's input and replies in kind, with native register, not stiff machine translation. This is the headline differentiator.
- The assistant answers using only the real catalog: prices, stock, specs, descriptions, availability per store — never invented.
- The assistant can *drive* the site on the user's behalf: navigate to a category, apply filters, open a product, add to cart, start a Build-Your-Kit flow.
- Inline product cards, comparison tables, and size guides render *inside* the chat stream as real React components, not as text links.
- Voice messages work like Telegram: hold mic, record, release, the message lands as a voice bubble with a transcript and an audio reply playback button.
- Conversations persist per user (logged-in) or per device (anonymous), and survive page reloads. The assistant remembers what was discussed last week and continues from there.
- A failed turn (out-of-scope question, unavailable product, frustrated user) escalates cleanly to a human via email handoff with the conversation transcript attached.

## Non-Goals (explicitly out of v1)

- True voice-to-voice realtime calls via OpenAI Realtime API. Greek voice quality is non-native and the UX hides the product visuals shoppers need. Deferred indefinitely.
- Outbound proactive messaging ("Hey, your wishlist item is back!"). Out of v1 — keep the bot reactive only.
- Multi-agent orchestration (planner/executor/critic). Single tool-using agent is sufficient at this scope.
- RAG with vector embeddings over the catalog. Meilisearch already does semantic + filtered search; embeddings would be redundant complexity.
- Tier/loyalty access (premium chat for paid users). All visitors get the same assistant.
- Auto-summarization of long threads. We use a sliding 30-message window in-context, with the full thread persisted but not summarized — preserves every nuance.
- ChatGPT plugin / OpenAI Apps SDK integration. The assistant lives only inside the storefront.
- Real-time human takeover (live agent grabs the conversation mid-stream). v1 escalation is email-based handoff.

## Core Concept

One agentic chat backend + one Telegram-aesthetic UI + a tool catalog that mirrors what the storefront can already do. Everything intelligent (product knowledge, navigation, cart actions, voice) is a layer over the existing infrastructure: Meilisearch for search, Odoo for stock, Supabase for persistence, Next.js App Router for navigation, the existing cart server actions for purchase.

```
                                                              ┌──────────────────┐
                                                              │ Meilisearch      │
                                                              │ (catalog index)  │
                                                              └────────▲─────────┘
                                                                       │ tool call
User ─text/voice─▶ Chat UI ─▶ /api/chat (streamText) ─▶ GPT-4o + tools ─┼──▶ Odoo (stock)
       ▲                                  │                            │
       │                                  ▼                            └──▶ Supabase
       │                          tool invocations stream                    (user / cart)
       │                                  │
       │              ┌───────────────────┼──────────────────┐
       │              │                   │                  │
       │              ▼                   ▼                  ▼
       │     showProductCards()    navigateTo()         addToCart()
       │     ─ inline React UI     ─ router.push()      ─ server action
       │                                                + optimistic UI
       │
       └─ voice reply: text → Azure Greek TTS (Athina) → audio bubble (on demand)
```

## Sub-Projects

Decomposed into five sub-projects. Each is independently useful and gets its own implementation plan after this spec is approved. The order matters — A unblocks everything else.

| # | Sub-project | Delivers | Useful alone? |
|---|---|---|---|
| A | Foundation | data model + chat API route + streamText pipeline + tool catalog + system prompts + minimal floating UI | Yes — text-only chat works end-to-end |
| B | Generative UI + Co-pilot Navigation | inline product cards / comparison / size guide rendered from tool calls + client-side `navigateTo` / `applyFilters` / `addToCart` execution | Yes — turns chat from informational into transactional |
| C | Persistence + Memory | Supabase thread/message tables + anonymous session cookie + logged-in linking + cross-session recall + user-context tool | Yes — conversations survive reloads |
| D | Voice Messages | Whisper STT for inbound + Azure Greek TTS for outbound playback + voice-bubble UI + waveform recorder + transcription display | Yes — multimodal upgrade |
| E | Human Handoff + Analytics + Hardening | escalation email with transcript + rate limiting + conversation analytics (volume, conversion attribution, top intents) + abuse guards + cost telemetry | Required for production |

Sub-projects A → B → C → D → E. Voice (D) intentionally comes after persistence (C) so voice messages are stored alongside text.

## Data Model (Supabase)

Three tables. RLS on every table (project rule, no exceptions). Schema additions to `database.types.ts` happen via migration, never blind `db:types` regeneration (memory rule).

### `chat_threads`
- `id uuid pk default gen_random_uuid()`
- `user_id uuid null fk → auth.users` — null for anonymous
- `session_id text not null` — anonymous session cookie; for logged-in users, also populated so we can link guest threads on login
- `locale text not null default 'el'` — one of the 6 supported locales; thread is born in the locale of the page that opened it
- `title text null` — auto-generated short title from first turn (later sub-project; can stay null in A)
- `last_message_at timestamptz default now()`
- `created_at timestamptz default now()`
- `archived boolean default false`

### `chat_messages`
- `id uuid pk default gen_random_uuid()`
- `thread_id uuid fk → chat_threads on delete cascade`
- `role text not null` — one of `user | assistant | tool`
- `content jsonb not null` — the canonical Vercel AI SDK `UIMessage` parts array (text parts, tool-call parts, tool-result parts, attachment parts). Storing the parts array directly (not a stringified summary) lets us replay the conversation faithfully into the model on next turn.
- `audio_url text null` — Supabase Storage URL for voice attachments (user voice message or assistant TTS playback cache)
- `tool_calls jsonb null` — denormalized view of tool calls in this message for analytics (which tools fired, with what arguments, result status)
- `created_at timestamptz default now()`

### `chat_user_context`
One row per `user_id` (or per `session_id` for anonymous). Stores derived/long-lived facts the assistant should always know without re-asking. Updated by a dedicated tool (`upsertUserContext`) so the model itself decides what's worth remembering.
- `id uuid pk`
- `user_id uuid null` (unique when not null)
- `session_id text null` (unique when not null when `user_id is null`)
- `bike jsonb null` — `{ brand, model, year, cc }` mirrors the `garage` page data
- `riding_style text null` — `touring | sport | adventure | urban | offroad`
- `size_profile jsonb null` — `{ helmet, jacket, gloves, boots }`
- `preferred_brands text[] null`
- `budget_band text null` — `entry | mid | premium`
- `notes text null` — free-form salesman notes the assistant writes for itself
- `updated_at timestamptz default now()`

### `chat_telemetry` (sub-project E)

Append-only log used by the admin dashboard and the daily cost cap.
- `id uuid pk`
- `thread_id uuid fk`
- `message_id uuid fk null` — null for system events (handoff, rate-limit hit, abuse flag)
- `event text` — `turn | tool_call | handoff | rate_limit | abuse_flag | tts_synth | stt_transcribe`
- `model text null` — e.g. `gpt-4o`
- `prompt_tokens int null`, `completion_tokens int null`
- `tool_name text null`, `tool_status text null` — `success | error`
- `cost_usd numeric(10, 6) null`
- `latency_ms int null`
- `created_at timestamptz default now()`

### Voice attachments

Stored in a new Supabase Storage bucket `chat-audio`, private, signed-URL access only. User voice messages are kept 90 days then auto-purged. Assistant TTS playbacks are cached by `sha256(text + voice_id + locale)` at `chat-audio/tts-cache/{hash}.mp3` and reused — same reply text never re-synthesizes.

### RLS

- `chat_threads`, `chat_messages`: a thread is readable/writable by `user_id = auth.uid()` OR by `session_id = current_setting('app.session_id')::text` — the session id is passed in via a `set_config` server-side before the query. Anonymous threads are scoped to the cookie, not globally readable.
- `chat_user_context`: same scoping rule.
- `chat_telemetry`: writable only by service-role (server-only); readable only by admin role (mirrors `/admin/campaigns` analytics pattern).
- All inserts go through server actions or `/api/chat` route handler, never direct from client — prevents transcript tampering and bypassing of rate limits.

## The Tool Catalog

The assistant has zero implicit knowledge of the catalog. Every factual claim about a product, price, or stock comes from one of these tools. Tool design is deliberately small — 12 tools across all sub-projects — so the model picks correctly without ambiguity. Each tool has a Zod input schema and a typed return value; the model gets the schemas via the Vercel AI SDK `tool()` helper.

**Core tools (sub-project A)** — minimum viable assistant:

| Tool | Runs on | Purpose |
|---|---|---|
| `searchProducts({query, filters, limit})` | server | Semantic + filtered search against Meilisearch. Returns up to 12 hits with `{id, slug, name, brand, price, image, in_stock}`. Filters: `category`, `brand`, `price_min/max`, `size`, `color`, `bike_compatibility`. |
| `getProductDetails({productId})` | server | Full product page data: long description, specs, all images, all variants, per-store stock, related products. Used when the model needs to answer detailed questions or render a rich card. |
| `checkStock({productId, variantId?})` | server | Real-time stock per store (Καλλιθέα, Θεσσαλονίκη) + online warehouse. Used because product details may be cached; stock must be fresh. |
| `handoffToHuman({reason, summary})` | server | Emails sales (`sales@motomarket-shop.gr`) with the full transcript + a one-line reason. Returns a confirmation the model surfaces to the user with an expected response window. |

**Generative UI + co-pilot tools (sub-project B)** — turns chat transactional:

| Tool | Runs on | Purpose |
|---|---|---|
| `showProductCards({productIds})` | **client** (generative UI) | Renders an inline carousel of real product cards inside the chat bubble. The tool's `execute` returns React. |
| `compareProducts({productIds, fields?})` | **client** (generative UI) | Renders an inline comparison table (2–4 products). Fields default to: price, weight, certifications, sizes, materials. |
| `navigateTo({route, locale?})` | **client** | Calls `router.push(\`/${locale}${route}\`)`. The model uses this to take the user to a category, PDP, garage page, or checkout. |
| `applyFilters({filters})` | **client** | On a category page, updates URL search params and re-runs PLP query. Triggers a visible state change so the user sees what changed. |
| `addToCart({productId, variantId?, qty})` | server action | Calls existing cart server action. Returns updated cart summary + a toast trigger. The model then confirms in chat. |

**Memory tools (sub-project C)** — long-term recall:

| Tool | Runs on | Purpose |
|---|---|---|
| `upsertUserContext({patch})` | server | Updates `chat_user_context` row with new durable facts (bike, sizes, preferences). Model calls this only when a fact surfaces that's worth remembering across sessions. |
| `recallEarlier({query})` | server | Keyword search across the full thread (beyond the 30-message sliding window) for "what we said before about X". Returns up to 5 matching messages with context. |
| `getRecentOrders({limit})` | server | Logged-in users only. Returns last 5 orders with line items, used for "owners also bought" personalization and return/warranty questions. Confirms RLS check passes. |

**Why some tools run on the client**: navigation, filter changes, cart updates, and rendering UI must happen in the user's browser session, not on the server. Vercel AI SDK supports this via tools whose `execute` is defined only on the client — the server-side stream emits the tool call, the client `useChat` hook picks it up, runs the executor, posts the result back into the message stream. The model sees the result on the next turn.

**Tool grounding contract**: the system prompt forbids the model from stating prices, stock levels, or product specs that did not come from a tool call in the current conversation. If the model is unsure, it must call `searchProducts` or `getProductDetails` rather than guess.

## Voice Pipeline (sub-project D)

Voice is **Telegram-style push-to-talk**, not realtime. Both input and output are asynchronous voice bubbles.

### Input (user → assistant)

1. User holds the mic button in the chat composer. `MediaRecorder` API records to `audio/webm` at 16kHz mono. A live waveform animates in the composer.
2. Release → blob is uploaded to Supabase Storage at `chat-audio/{session}/{ulid}.webm` with a signed URL.
3. The blob is posted to `/api/chat/transcribe` (server) which calls `openai.audio.transcriptions.create({ model: 'gpt-4o-mini-transcribe', file, language: 'el' })`. Returns the transcript text.
4. The voice message is rendered as a chat bubble showing: ▶ play button, waveform, duration, and the transcript as a subtitle under the waveform (Telegram has this too).
5. The transcript text is then sent into the model exactly as if it were typed.

### Output (assistant → user)

The reply is **always streamed as text first** for instant feedback. After the text reply finishes, a small "▶ Άκουσέ το" button appears under the bubble. On click:

1. The client posts the final text + detected language (BCP-47 tag) to `/api/chat/tts` (server).
2. Server looks up the voice id in the `lib/chat/tts/voice-map.ts` table (see Multi-language Policy section for full mapping). Default for Greek = `el-GR-AthinaNeural`. Falls back to OpenAI `gpt-4o-mini-tts` for any language not in the map.
3. Before the call, server hashes `sha256(text + voice_id + language)` and checks the cache in Supabase Storage. If hit, returns the cached MP3 signed URL. If miss, synthesizes via the selected provider, uploads to `chat-audio/tts-cache/{hash}.mp3`, then returns.
4. The client plays it inline with a waveform-style player.

**Why text-first then optional TTS instead of auto-playing**: shoppers in a store/office/transit don't always want audio bursting out. The play button is opt-in per reply. Caching means repeat replies (greetings, common answers) are essentially free.

**Why Azure over OpenAI TTS**: Greek voice quality. Athina neural sounds native; OpenAI's Greek output is non-native. Cost difference is negligible (~$16/M chars Azure vs ~$15/M chars OpenAI) — quality wins.

## Co-pilot Site Navigation (sub-project B)

When the model calls a client tool that changes the page, the experience is *visible*. The chat panel does not navigate — the *site behind it* does.

### Layout that makes this work

**Desktop (≥ 1024px)**: chat lives in a right-side panel, default 420px wide, with a drag handle to resize 360–560px. When opened, the main content shifts left (uses `grid-template-columns: 1fr 420px`), not a fixed overlay. The user sees the storefront and the chat together.

**Mobile (< 1024px)**: chat opens full-screen as a modal. Co-pilot navigation still works: when `navigateTo` fires while the modal is open, we automatically minimize the modal to a pinned mini-bar at the bottom (Telegram has this exact pattern when you tap a link in a chat) so the user sees the destination page with the chat one tap away. A "return to chat" tap re-expands.

### Navigation choreography

When the model emits `navigateTo({ route: '/category/kranh--touring' })`:

1. The client-side executor runs first, returning `{ ok: true, route, currentRoute }`.
2. The result is appended to the message stream as a small inline confirmation chip: "📍 Πήγα στο: Κράνη Touring".
3. `router.push(route)` fires.
4. The PLP page loads (Next.js streaming) — visible behind the chat panel.
5. The model's next textual turn (already streaming in parallel) continues naturally: "Βλέπεις 247 κράνη touring. Θες να φιλτράρω για μαύρα κάτω από 300€;"

When the model emits `applyFilters({ filters: { color: 'black', price_max: 300 } })` on an already-loaded PLP, the same chip pattern fires, the URL search params update, and the filter sidebar UI animates the new selected state — giving the user a clear "the bot did something" signal.

### What the bot is *not* allowed to do

- Cannot navigate to admin pages or any route under `/admin`.
- Cannot apply filters on pages that don't have filtering (PDP, checkout, account).
- Cannot navigate during checkout (`/checkout/*`) — too risky; chat becomes informational only.
- Cannot trigger `addToCart` without a product the user has acknowledged in the conversation (system prompt rule, enforced by model behavior + server-side log to detect violations).

## Persistence + Memory (sub-project C)

### Three layers

1. **Per-thread message history** (`chat_messages`) — full fidelity, replays into the model up to a sliding window.
2. **User context store** (`chat_user_context`) — long-lived facts the model wants to remember (bike, sizes, preferences). The model writes here via `upsertUserContext` tool only when something durable surfaces ("I ride a 2023 MT-09" → bike row updates).
3. **Storefront state injection** — at every turn, the system prompt is augmented with: current locale, current route, current cart summary, saved bike from the `garage` table, wishlist count. This is read live, not stored in the thread.

### Sliding window strategy

Model context per call: system prompt + user context summary (3–5 lines) + storefront state (2–3 lines) + last 30 messages + current user turn. If the thread is longer than 30 messages, older messages stay persisted but drop out of the model's working memory. **No summarization** — per the rule "every line matters."

If a user explicitly references something old ("όπως είπες πριν για το κράνος Klim"), the model can call `recallEarlier({query})` (added in sub-project C) which does a keyword search across the full thread and returns matching messages. This keeps total token cost low while preserving recall.

### Anonymous → logged-in linking

Anonymous threads are keyed by a long-lived `mm_chat_session` cookie (HTTP-only, 1-year expiry). On login, a server action looks up any `chat_threads` where `session_id = cookie AND user_id IS NULL` and updates them to `user_id = newly logged-in user`. Thread continuity preserved across signup.

### Conversation lifecycle

- **New thread**: created on first user message. The "Νέα συνομιλία" button in the chat header archives the current one and starts fresh.
- **Auto-archive**: threads with no activity for 90 days are auto-archived (`archived = true`) but never deleted.
- **History view**: a chat history drawer (sub-project C) shows past threads with auto-generated titles. Tap to resume.

## System Prompt (the salesperson)

Built dynamically per turn. The base persona is fixed; the variable section appends live state.

**Base** (Greek, fixed):

```
Είσαι ο "Πιτ" — ο πιο έμπειρος πωλητής στο Moto Market, ένα κατάστημα
εξοπλισμού μηχανής στην Καλλιθέα και τη Θεσσαλονίκη με 44 χρόνια ιστορίας.

Στυλ:
- Μιλάς όπως ένας έμπειρος αναβάτης που δουλεύει στο μαγαζί — φιλικά, ευθέως,
  χωρίς corporate ορολογία.
- Πρώτη ερώτηση πάντα: "τι μηχανή έχεις και τι θες να κάνεις;" — αν δεν ξέρεις ήδη.
- Δεν χρησιμοποιείς emoji σε κάθε γραμμή. Πολύ σπάνια, για έμφαση.
- Κάθε απάντηση τελειώνει με ξεκάθαρο next step ("θες να το δεις;",
  "να το βάλω στο καλάθι;", "να φιλτράρω και για χρώμα;").

Κανόνες:
- ΠΟΤΕ δεν λες τιμή, διαθεσιμότητα, ή spec χωρίς να έχεις καλέσει tool που το επιστρέφει.
  Αν δεν ξέρεις, καλείς searchProducts ή getProductDetails πρώτα.
- ΠΟΤΕ δεν επινοείς προϊόντα. Αν ένα προϊόν δεν βρίσκεται, το λες ευθέως.
- Όταν δείχνεις προϊόντα, καλείς showProductCards — όχι plain links.
- Όταν ο χρήστης ζητάει "δείξε μου", "πάμε στα", "θέλω να δω", καλείς navigateTo.
- Όταν αλλάζεις filters, καλείς applyFilters και αναφέρεις τι έκανες.
- Αν ο χρήστης ζητάει κάτι έξω από τον εξοπλισμό μηχανής (νομικά, ιατρικά,
  custom orders, εγγυήσεις πέρα από τα standard), καλείς handoffToHuman.

Πλαίσιο τώρα:
{INJECTED_CONTEXT}
```

The `{INJECTED_CONTEXT}` block is rebuilt per turn:

```
Γλώσσα σελίδας: {locale}
Τρέχουσα σελίδα: {pathname}
Καλάθι: {cartItemCount} προϊόντα, σύνολο {cartTotal}
Καταχωρημένη μηχανή: {bike.brand} {bike.model} {bike.year} ({bike.cc}cc) ή "καμία"
Wishlist: {wishlistCount}
Στυλ οδήγησης (αν ξέρουμε): {riding_style}
Σημειώσεις από προηγούμενες συνομιλίες: {notes}
```

**Base prompt is single-source in Greek.** No per-locale duplication. The model handles locale-appropriate phrasing automatically (GPT-4o follows instructions written in any language and responds in whatever language the user uses). The Multilingual addendum (see Multi-language Policy section) is **always appended** to the base prompt regardless of site locale — it governs the cross-language behavior. The injected context block is also Greek-source; the model has no trouble using Greek-labeled variables to drive non-Greek output.

**Final assembled prompt** sent on every turn = `BASE_PROMPT` + `MULTILINGUAL_ADDENDUM` + `INJECTED_CONTEXT`. Composed in code at `lib/chat/prompts/build-system-prompt.ts`.

## Model Selection

**v1 (this spec)**: single model `gpt-4o` for every turn via Vercel AI SDK `streamText`. The model decides whether the turn is short (answers directly) or warrants tool calls (calls tools, then summarizes). Empirically `gpt-4o` is fast enough at ~30 tok/s streaming and the cost premium over mini is small (~$0.005/turn at our message length). Vision automatically supported for v2 photo attachments.

**Future (sub-project E or post-launch)**: a two-tier router using `gpt-4o-mini` for trivial turns (greetings, simple navigation requests detected by quick classifier) and `gpt-4o` for everything else. Deferred because the savings only matter at high volume and the routing logic adds latency + complexity not justified at MVP.

**When `gpt-5` releases on the OpenAI API**: drop-in replacement for `gpt-4o` at the heavy tier. The Vercel AI SDK abstraction makes this a one-line model id change.

**Temperature**: 0.3 (factual sales, not creative writing). **Max tokens**: 800 per turn — keeps replies snappy and reduces over-explaining.

## UI/UX Spec (Telegram-style)

### Entry point

Floating action button bottom-right, 56×56, brand red (#E10600 — matches Race Control design system). Icon: a custom chat bubble with a small motorcycle silhouette inside.

**Auto-open on 3rd page view**: a session-scoped page-view counter (sessionStorage key `mm_pageviews`) increments on every storefront navigation. On the **third** view of the same session, the chat auto-opens once with a friendly Πιτ greeting ("Γεια! Σε βλέπω να ψάχνεις — να βοηθήσω;" — translated to detected browser language). The auto-open happens only **once per session** (sessionStorage key `mm_chat_auto_opened`); subsequent page views never re-trigger. User-dismissed (close ✕) suppresses auto-open for 24h (localStorage key `mm_chat_suppress_until`). Logged-in users who already have prior threads do not get the auto-open — they already know what Πιτ is.

On manual click → same smooth spring-physics expand (Framer Motion) into the side panel (desktop) or full-screen (mobile).

### Panel anatomy (desktop, 420px)

```
┌─ Header (56px) ─────────────────────────────┐
│ ← Νέα   "Πιτ" · online       🔍  ⋯  ✕      │
├─ Messages scroll ───────────────────────────┤
│                                             │
│   [assistant bubble, left-aligned]          │
│   white bg, rounded 16px, max-w 80%        │
│                                             │
│            [user bubble, right-aligned]    │
│            red bg, white text, 16px        │
│                                             │
│   [inline product card carousel]            │
│   horizontal scroll, snap, 3 cards          │
│                                             │
│   [tool chip: "📍 Πήγα στα Κράνη Touring"] │
│                                             │
│   [typing indicator: three dots, animated]  │
│                                             │
├─ Composer (auto-grow 56–120px) ────────────┤
│  ┌──────────────────────────┐ ┌──┐ ┌──┐    │
│  │ Γράψε ή πάτα το mic...   │ │📎│ │🎤│    │
│  └──────────────────────────┘ └──┘ └──┘    │
└─────────────────────────────────────────────┘
```

### Bubble styles

- **Assistant text**: white bg, 1px hairline border, rounded 16px (sharper bottom-left corner to "point" at the speaker), `Hanken Grotesk` body. Markdown rendered (bold, italic, lists, code) — sanitized.
- **User text**: brand red bg, white text, rounded 16px (sharper bottom-right). Sent timestamps on hover.
- **Voice bubble**: same bg as text but with a waveform component (3px bars, 20 bars, animated peak heights), play/pause button, duration "0:14". Transcript underneath as smaller text.
- **Product card carousel**: bubble width is 100% of panel; cards inside scroll horizontally with snap.
- **Tool chips**: small pill-shaped, neutral background, italic text, low-emphasis — they're system-level, not conversation.
- **Typing indicator**: three dots, scaled animation, 1.2s loop.

### Composer

- Text input auto-grows to 4 lines max.
- 📎 attaches a photo (for bike photo identification in v2 — disabled in v1 but the button is present and shows "σύντομα").
- 🎤 press-and-hold to record (mobile uses touch events; desktop uses pointer events). Drag-up locks recording (Telegram pattern) so user doesn't have to keep holding. Release sends.
- During recording: input field is replaced by a live waveform with a red recording dot + elapsed time + cancel button (drag-left to cancel, also Telegram).

### Cinematic touches (the "wow" without being annoying)

- Open: spring physics expansion from FAB to panel, 350ms.
- First-load: "Πιτ" types out his greeting character-by-character (faster than realistic, ~80 chars/s) instead of appearing instantly.
- Tool chips slide in from left with a tiny bounce.
- Product cards in carousel: stagger-reveal with 80ms delay between them.
- Co-pilot navigation: when the site behind the panel changes route, the chat panel briefly flashes a subtle red top border to draw the eye that "something happened over there."

### Accessibility

- Keyboard: `Cmd/Ctrl + K` opens the chat. `Esc` closes. `Cmd/Ctrl + Enter` sends.
- Screen readers: chat region is `role="log"` with `aria-live="polite"`. Each bubble is properly labeled with `aria-label="Assistant said:" / "You said:"`.
- Reduced motion: skip the typing animation and spring expansion, replace with instant.
- Voice bubble has the transcript visible always (not just on tap) — accessibility + lets users skim without audio.

## Multi-language Policy (the "wow")

Two language axes, intentionally decoupled:

### Axis 1 — Site locale (the 6 supported translations)

The storefront UI, product names, descriptions, categories, and SEO metadata exist in 6 locales (`el`, `en`, `de`, `it`, `fr`, `bg`) — the existing next-intl setup. These are the languages the **catalog and site chrome** are translated into.

### Axis 2 — Chat conversation language (open-ended, model-driven)

The chat is **not bound to the site locale**. The assistant detects the language the customer writes (or speaks via voice) and replies in that language. GPT-4o handles 95+ languages with native fluency. Customer types Albanian → Πιτ replies Albanian. Customer types Russian → Πιτ replies Russian. Code-switching (Greeklish, mixed Greek+English) is detected and handled naturally — Πιτ replies in idiomatic Greek to Greeklish.

### How the two interact

The site locale governs what the **catalog data** looks like (product names, descriptions returned by tools). The chat language governs what the **assistant's prose** looks like. When these mismatch (e.g. site is Greek but user writes Polish), the assistant:

1. Replies to the user in Polish.
2. Refers to products by their Greek catalog name (because that's what's in `searchProducts` output and what the user will see if they navigate to the PDP), but immediately glosses the meaning in Polish on first mention: e.g. *"Mam świetny kask touring — 'Caberg Tourmax' (po polsku: kask turystyczny). Cena 249 €. Chcesz zobaczyć?"*
3. The system prompt explicitly trains this pattern (see system-prompt addendum below).

### Inline UI elements (product cards, comparison tables, navigation chips)

These render in **site locale**, not chat language. Reason: the cards are real components that the user might click → they need to match what they'll see on the destination page. The bot's *prose around the cards* is in the chat language, so the user is never lost.

### First-message language seeding

On thread start, the system prompt seeds: *"Begin in {site_locale}. If the user replies in a different language, switch fluently to theirs and stay there for the rest of the thread (unless they switch again)."* This gives a sensible default while keeping full flexibility.

### Language switch mid-thread

If the user switches language mid-thread (writes Greek then suddenly Albanian), the assistant follows them silently — no "I notice you switched" interruption. Smooth.

### Voice STT — auto-detect

Whisper (`gpt-4o-mini-transcribe`) supports 99 languages with auto-detection. We pass `language` only when we have high confidence from chat history; otherwise we let Whisper detect. Transcript is added to the thread in whatever language Whisper returned.

### Voice TTS — language-aware voice selection

Azure Neural TTS has neural voices for 140+ languages/locales. Map per detected reply language:

| Language | Azure voice id | Notes |
|---|---|---|
| Greek | `el-GR-AthinaNeural` | Default, native quality |
| English | `en-US-JennyNeural` (or `en-GB-LibbyNeural` for UK) | |
| German | `de-DE-KatjaNeural` | |
| Italian | `it-IT-ElsaNeural` | |
| French | `fr-FR-DeniseNeural` | |
| Bulgarian | `bg-BG-KalinaNeural` | |
| Albanian | `sq-AL-AnilaNeural` | Native Albanian voice |
| Russian | `ru-RU-SvetlanaNeural` | |
| Polish | `pl-PL-ZofiaNeural` | |
| Arabic | `ar-EG-SalmaNeural` | Egyptian Arabic (most widely understood) |
| Romanian | `ro-RO-AlinaNeural` | |
| Turkish | `tr-TR-EmelNeural` | |
| (any other) | OpenAI `gpt-4o-mini-tts` fallback | Decent quality non-native fallback for tail languages |

Voice mapping lives in `lib/chat/tts/voice-map.ts` and is looked up by BCP-47 language tag returned from a tiny detection step before TTS call. If lookup misses, we fall back to OpenAI TTS which handles 50+ languages (lower quality but always works).

### System-prompt addendum for multilingual

Appended to the base system prompt:

```
Multilingual behavior:
- Detect the customer's language from their messages. Reply in that exact language with native register (not stiff translation).
- Greeklish (Greek written with Latin letters) → reply in standard Ελληνικά.
- Code-switching → match the dominant language of the most recent user message.
- Product names from tools are in the site locale ({site_locale}). When the chat language differs, gloss the product type/category in the chat language on first mention so the customer understands what it is.
- Never apologize for not speaking a language — you speak it.
- If the customer writes in a language with mixed scripts (e.g. Cyrillic + Latin), prefer the script that matches the dominant word count.
```

### What this is NOT

- ❌ Not real-time translation between two human speakers.
- ❌ Not translating product descriptions on the fly into non-supported languages (the catalog stays in its 6 locales; the bot only translates its own prose).
- ❌ Not exposing language preferences to the model — it always auto-detects from the latest message.

## Rate Limiting + Cost Guards

- **Per session (anonymous)**: 40 messages per hour, 200 per day.
- **Per logged-in user**: 80 per hour, 500 per day.
- **Per-IP backstop**: 100 messages per hour across all sessions (anti-abuse).
- Limits enforced server-side in `/api/chat` via Upstash Redis (existing infra) or Supabase counters (fallback).
- When a limit hits: assistant responds with a graceful message + suggests `handoffToHuman`.
- **Cost telemetry**: every turn writes a `turn` event to `chat_telemetry` with prompt/completion tokens, tool calls fired, and estimated USD cost. Sub-project E adds the admin dashboard that reads it.
- **Hard cost cap**: per-day spend cap with env var `CHAT_DAILY_USD_CAP` (default $20). When approached, new sessions get the human-handoff message instead of the model.

## Safety + Guardrails

- **Hallucination guard (system prompt + server validation)**: any assistant turn that mentions a price (regex `\d+[\.,]\d{2}\s*€`) or stock claim ("διαθέσιμο", "στοκ", "εξαντλημένο") must have a tool call earlier in the same turn that returned that data. If not, the turn is rejected server-side and the model is asked to retry with a corrective system message.
- **Prompt injection defense**: user messages are wrapped in a fixed `<user_message>` boundary; tool outputs from external content (product descriptions which can contain HTML from Odoo) are sanitized for instruction-like phrases before being added to the context.
- **PII scrubbing**: messages are scanned before persistence; phone numbers, IDs, full credit card numbers are stripped (the user shouldn't be sharing these here — checkout has its own flow).
- **Topic guard**: if the user persists with off-topic chat (politics, generic life advice, harmful requests), the assistant declines politely and offers the human handoff.
- **No promises beyond the catalog**: the system prompt forbids guarantees about delivery dates, custom modifications, or after-sales policies beyond what the storefront publicly states (this lives in `/eksypiretisi` pages — the model is given that content as reference).

## Analytics (sub-project E)

A new admin page at `/admin/chat` (admin-only RLS, mirrors `/admin/campaigns`):

- **Volume**: messages/day, threads/day, active threads, abandonment rate (% of threads with only one user message).
- **Engagement**: average turns per thread, % using voice, % using inline cards, % navigating via `navigateTo`.
- **Conversion**: % of threads with at least one `addToCart`, attributed revenue (order placed within 24h of last assistant turn).
- **Top intents**: most-called tools, most-searched product queries.
- **Cost**: cumulative model spend by day, cost per converted thread.
- **Quality**: handoff rate, thumbs-down rate (a small 👍/👎 below each assistant reply, optional — sub-project E).
- **Top failures**: turns where the user typed "δεν κατάλαβες" / "λάθος" / "όχι αυτό" — surfaces system prompt improvements.

## Decisions (locked by owner before sub-project A)

1. **Brand name for the assistant**: **Πιτ** (Pit) — racing/pit-lane theme matching the Race Control landing system.
2. **First-load greeting trigger**: **Auto-open on the third page view of a session**, once per session, with 24h suppression after explicit dismissal. See UI/UX Spec → Entry point for the full rules.
3. **TTS coverage breadth**: **12 Azure neural voices day-one** — EL, EN, DE, IT, FR, BG, SQ, RU, PL, AR, RO, TR — with OpenAI `gpt-4o-mini-tts` as a universal fallback for any other language.
4. **Handoff destination**: **`sales@motomarket-shop.gr`** (dedicated mailbox, must exist in the mail provider before sub-project E ships).
5. **Identity-aware suggestions**: **Enabled** — `getRecentOrders` tool is in the catalog for logged-in users, RLS-checked server-side.

## Risks + Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| OpenAI API outage | Medium | Graceful degraded state: chat panel shows "Ο Πιτ ξεκουράζεται. Στείλε μας mail." with the email handoff form. No silent failures. |
| Cost runaway from abusive use | Low (with limits) | Hard daily USD cap; per-session/IP rate limits; abuse-flagging on user-context table. |
| Wrong product recommended | Medium | Tool grounding contract + showProductCards (user verifies before adding to cart) + thumbs-down feedback loop. |
| Voice transcription fails on Greeklish | Medium | Whisper is robust on Greeklish; we also show the transcript to the user before the model acts (small "Επεξεργασία" button to correct typos). |
| Inline UI breaks on slow connections | Low | Tool results render as soon as they arrive; product images use existing `SmartImage` with skeleton placeholders. |
| User bypasses checkout flow via assistant `addToCart` then has surprise pricing | Low | `addToCart` uses the same cart server action as the rest of the site, so pricing is identical; the assistant reply always confirms the price. |
| Prompt injection via product descriptions sourced from Odoo | Medium | Sanitize tool outputs before model context (strip instruction-like phrases, HTML, scripts). |

## Dependencies to Add

| Package | Version | Reason | Sub-project |
|---|---|---|---|
| `ai` | latest stable | Vercel AI SDK core — `streamText`, `tool`, message protocol | A |
| `@ai-sdk/openai` | latest stable | OpenAI provider for the AI SDK | A |
| `@ai-sdk/react` | latest stable | `useChat` hook for the UI | A |
| `@upstash/redis` | latest stable | Rate limit counters (or fall back to Postgres counters if Upstash is not provisioned) | A |
| `@upstash/ratelimit` | latest stable | Sliding-window rate limiter | A |
| `microsoft-cognitiveservices-speech-sdk` | latest stable | Azure Neural TTS — used server-side only | D |

Already in stack: `openai@6.39.0` (for STT), `meilisearch@0.57.0` (catalog), `next-intl@4.9.0` (locales), `framer-motion@12.38.0` (chat animations), `@supabase/ssr` + Supabase client (auth/persistence).

## Definition of Done (production-ready)

Sub-project A through E all shipped and live on production, with:

- All five sub-projects merged to `main` via PR (per project rule).
- Migrations applied; RLS verified.
- Env vars set in Vercel: `OPENAI_API_KEY`, `AZURE_TTS_KEY`, `AZURE_TTS_REGION`, `CHAT_DAILY_USD_CAP`.
- Supabase Storage bucket `chat-audio` created with the RLS policy.
- Tested on: mobile Safari, mobile Chrome, desktop Chrome, desktop Safari, desktop Firefox.
- Voice tested in Greek, English, and one other locale (e.g. German) end-to-end.
- Admin dashboard at `/admin/chat` shows real telemetry.
- A 10-message smoke conversation runs without errors at staging.
- Lighthouse score on a page with the chat closed: no regression on mobile (currently 90+).
- Lighthouse score on a page with chat open: ≥ 80 mobile (acceptable to drop due to active JS — verified).
- Email handoff verified: triggers, receives at the configured address, contains the transcript.
- Rate limits verified by exceeding them in a test session.
