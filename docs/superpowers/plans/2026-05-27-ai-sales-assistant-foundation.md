# AI Sales Assistant — Sub-Project A (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working text-only AI sales chat ("Πιτ") embedded in the storefront — floating button → side panel desktop / full-screen mobile, with streaming Greek+multilingual replies, 4 core tools (search, details, stock, handoff), persistent threads in Supabase, and rate limiting. End-to-end smoke test: open chat, ask "βρες μου ένα κράνος touring", get a streamed reply with product names sourced from the real catalog.

**Architecture:** Vercel AI SDK (`streamText` + `tool`) on a Next.js 16 App Router `/api/chat` route. Tools are pure server functions wrapping existing Meilisearch / Supabase / Entersoft adapters. System prompt is composed per turn from a fixed Greek base + multilingual addendum + live storefront state. Conversations persist as `chat_threads` + `chat_messages` rows in Supabase with RLS scoped to `auth.uid()` or anonymous session cookie. Frontend is a thin React island (`useChat` hook from `@ai-sdk/react`) wired into the existing `(store)/layout.tsx`.

**Tech Stack:** Next.js 16 + React 19 (App Router), TypeScript, Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`), OpenAI `gpt-4o`, Supabase (Postgres + Auth + RLS), Meilisearch v0.57, Entersoft ERP adapter, Zod v4, Upstash Redis + Ratelimit, Resend (email), Vitest 4 (testing), Framer Motion (animations), Tailwind CSS.

**Branch:** `feat/ai-sales-assistant` (already created from spec commit). Every task ends with a commit on this branch.

**Spec reference:** `docs/superpowers/specs/2026-05-27-ai-sales-assistant-design.md`. Re-read the spec before starting if more than a few hours have passed.

---

## File Structure

Files this plan creates or modifies. Cross-reference with each task before editing.

### Created

```
supabase/migrations/
  20260527000001_chat_foundation.sql           # tables + RLS + storage policies

src/types/
  database-augment.ts                          # manual type augmentation (do NOT regen database.ts)

src/lib/chat/
  types.ts                                     # ChatThread, ChatMessage, ChatRole, ChatUserContext
  session.ts                                   # anonymous session cookie helpers
  session.test.ts                              # unit tests
  rate-limit.ts                                # Upstash Ratelimit wrapper + Postgres fallback
  prompts/
    base.ts                                    # exported BASE_PROMPT_EL (Πιτ persona)
    multilingual.ts                            # exported MULTILINGUAL_ADDENDUM
    build-system-prompt.ts                     # composer (base + multilingual + injected ctx)
    build-system-prompt.test.ts                # unit tests
  storefront-state.ts                          # reads locale/cart/bike/wishlist → string
  storefront-state.test.ts                     # unit tests
  tools/
    search-products.ts                         # Meilisearch wrapper tool
    search-products.test.ts                    # unit test (with mocked meili)
    get-product-details.ts                     # Supabase product query tool
    get-product-details.test.ts
    check-stock.ts                             # Entersoft stock tool
    check-stock.test.ts
    handoff-to-human.ts                        # Resend email + telemetry write
    handoff-to-human.test.ts
    index.ts                                   # tool registry: chatTools object
  queries.ts                                   # createThread, appendMessage, loadRecentMessages
  queries.test.ts                              # unit tests

src/app/api/chat/
  route.ts                                     # POST handler: validates → rate-limits → streams

src/app/[locale]/(store)/_components/chat/
  chat-launcher.tsx                            # floating FAB + auto-open on 3rd page view
  chat-panel.tsx                               # side-panel desktop / fullscreen mobile shell
  chat-messages.tsx                            # message list (text bubbles, typing indicator)
  chat-composer.tsx                            # text input + submit
  chat-provider.tsx                            # useChat wrapper + state
  use-page-view-counter.ts                     # tracks session page views for auto-open
  chat.module.css                              # bubble + panel styles
```

### Modified

```
package.json                                   # add: ai, @ai-sdk/openai, @ai-sdk/react,
                                               #      @upstash/redis, @upstash/ratelimit, resend
src/lib/env.ts                                 # add: OPENAI_API_KEY, UPSTASH_REDIS_REST_URL,
                                               #      UPSTASH_REDIS_REST_TOKEN, RESEND_API_KEY,
                                               #      CHAT_HANDOFF_TO, CHAT_DAILY_USD_CAP
src/app/[locale]/(store)/layout.tsx            # mount <ChatLauncher /> client island
.env.local.example                             # document new env vars
```

---

## Task 1: Add Dependencies + Env Vars

**Files:**
- Modify: `package.json`
- Modify: `src/lib/env.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: Install runtime dependencies**

Run from `moto_eshop/`:
```bash
pnpm add ai @ai-sdk/openai @ai-sdk/react @upstash/redis @upstash/ratelimit resend
```
Expected: package.json gets these as `dependencies`, `pnpm-lock.yaml` updates, no install errors. If `ai` resolves below v4, abort and check npm registry — the AI SDK API used here requires v4+.

- [ ] **Step 2: Verify installs**

Run:
```bash
pnpm list ai @ai-sdk/openai @ai-sdk/react @upstash/redis @upstash/ratelimit resend
```
Expected: each line shows a resolved version, none say `MISSING`.

- [ ] **Step 3: Extend env schema**

Edit `src/lib/env.ts` — add inside the `z.object({ ... })` block, before the closing `})`:

```ts
  // AI sales chat
  OPENAI_API_KEY: z.string().min(20),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  CHAT_HANDOFF_TO: z.email().default("sales@motomarket-shop.gr"),
  CHAT_DAILY_USD_CAP: z.coerce.number().positive().default(20),
```

Upstash + Resend are `.optional()` so dev/test machines without those services still load env (rate-limit falls back to a Postgres counter, handoff falls back to logging). `OPENAI_API_KEY` is required because the feature is non-functional without it.

- [ ] **Step 4: Document new env vars**

Append to `.env.local.example` (create the file if missing):

```env
# --- AI sales assistant ---
OPENAI_API_KEY=sk-...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=re_...
CHAT_HANDOFF_TO=sales@motomarket-shop.gr
CHAT_DAILY_USD_CAP=20
```

- [ ] **Step 5: Type-check passes**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: no new errors introduced by the env changes (pre-existing errors unrelated to this task are acceptable but note them in commit message).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/env.ts .env.local.example
git commit -m "chore(chat): add AI SDK + upstash + resend deps and env vars"
```

---

## Task 2: Database Migration (chat_threads, chat_messages, chat_user_context, chat_telemetry)

**Files:**
- Create: `supabase/migrations/20260527000001_chat_foundation.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260527000001_chat_foundation.sql`:

```sql
-- AI sales assistant — foundation tables (sub-project A)

-- 1) Threads ----------------------------------------------------------------
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  locale text not null default 'el',
  title text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

create index chat_threads_user_id_idx on public.chat_threads(user_id) where user_id is not null;
create index chat_threads_session_id_idx on public.chat_threads(session_id);
create index chat_threads_last_message_at_idx on public.chat_threads(last_message_at desc);

-- 2) Messages ---------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool', 'system')),
  content jsonb not null,
  audio_url text,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

create index chat_messages_thread_id_idx on public.chat_messages(thread_id, created_at);

-- 3) User context (long-lived facts) ----------------------------------------
create table public.chat_user_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  session_id text unique,
  bike jsonb,
  riding_style text check (riding_style in ('touring','sport','adventure','urban','offroad')),
  size_profile jsonb,
  preferred_brands text[],
  budget_band text check (budget_band in ('entry','mid','premium')),
  notes text,
  updated_at timestamptz not null default now(),
  constraint chat_user_context_owner check (user_id is not null or session_id is not null)
);

-- 4) Telemetry (used by sub-projects A rate-limit + E dashboard) -----------
create table public.chat_telemetry (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.chat_threads(id) on delete set null,
  message_id uuid references public.chat_messages(id) on delete set null,
  event text not null,
  model text,
  prompt_tokens int,
  completion_tokens int,
  tool_name text,
  tool_status text,
  cost_usd numeric(10, 6),
  latency_ms int,
  session_id text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index chat_telemetry_created_at_idx on public.chat_telemetry(created_at desc);
create index chat_telemetry_event_idx on public.chat_telemetry(event);

-- 5) RLS --------------------------------------------------------------------
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_user_context enable row level security;
alter table public.chat_telemetry enable row level security;

-- Threads: visible to owner (by user_id) or to caller with matching session_id
-- Anonymous scoping uses current_setting('app.session_id', true) which the API
-- route sets via select set_config('app.session_id', $1, true) before queries.
create policy chat_threads_select on public.chat_threads
  for select using (
    (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = current_setting('app.session_id', true))
  );
create policy chat_threads_insert on public.chat_threads
  for insert with check (
    (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = current_setting('app.session_id', true))
  );
create policy chat_threads_update on public.chat_threads
  for update using (
    (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = current_setting('app.session_id', true))
  );

-- Messages: scoped via parent thread
create policy chat_messages_select on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          (t.user_id is not null and t.user_id = auth.uid())
          or (t.user_id is null and t.session_id = current_setting('app.session_id', true))
        )
    )
  );
create policy chat_messages_insert on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          (t.user_id is not null and t.user_id = auth.uid())
          or (t.user_id is null and t.session_id = current_setting('app.session_id', true))
        )
    )
  );

-- User context: same scoping
create policy chat_user_context_all on public.chat_user_context
  for all using (
    (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = current_setting('app.session_id', true))
  )
  with check (
    (user_id is not null and user_id = auth.uid())
    or (user_id is null and session_id = current_setting('app.session_id', true))
  );

-- Telemetry: writable only by service_role (server-only); readable by admins
-- (admin policy lives in 20260402000001_admin_role.sql — extended via is_admin())
create policy chat_telemetry_admin_select on public.chat_telemetry
  for select using (
    exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.is_admin = true)
  );
-- No insert/update/delete policies → blocks all non-service-role writes by default.

-- 6) updated_at trigger for context ----------------------------------------
create or replace function public.chat_user_context_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger chat_user_context_updated_at
  before update on public.chat_user_context
  for each row execute function public.chat_user_context_touch_updated_at();
```

> ⚠️ **Important**: the migration assumes a `user_profiles` table with an `is_admin` column exists (it does — see `20260402000001_admin_role.sql`). If the column name differs in your local schema, update line referencing `up.is_admin = true` accordingly.

- [ ] **Step 2: Apply migration**

Run:
```bash
pnpm db:push
```
Expected: Supabase CLI reports "Linked project ..." and applies the new migration. If the CLI prompts for confirmation, type `y`.

If `pnpm db:push` fails (offline / not linked), apply the SQL manually:
1. Open Supabase Studio → SQL Editor.
2. Paste the migration file content.
3. Run it.
4. Confirm 4 new tables appear in the `public` schema and all have RLS enabled (green shield icon).

- [ ] **Step 3: Verify schema**

Run a quick read against the new tables (should return 0 rows, not error):
```bash
curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/chat_threads?select=id&limit=1"
```
Expected: `[]` (empty array, not an error). If you get an RLS error it's fine — that means RLS is active and you're calling as anon without a session_id GUC set.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260527000001_chat_foundation.sql
git commit -m "feat(chat): add chat_threads/messages/user_context/telemetry migration with RLS"
```

---

## Task 3: Manual Database Type Augmentation

**Files:**
- Create: `src/types/database-augment.ts`

> Per project memory (`don't db:types blindly`), we do NOT run `pnpm db:types` because it overwrites `src/types/database.ts` and drops i18n-related custom edits made earlier. Instead, we hand-write a narrow augmentation file that the chat code imports.

- [ ] **Step 1: Write the augmentation**

Create `src/types/database-augment.ts`:

```ts
// Hand-written type augmentation for chat tables.
// Do NOT replace by running `pnpm db:types` — that regenerates database.ts and
// drops other manual edits. When the chat tables change, edit THIS file.

export type ChatRole = "user" | "assistant" | "tool" | "system";

export interface ChatThreadRow {
  id: string;
  user_id: string | null;
  session_id: string;
  locale: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
  archived: boolean;
}

export interface ChatMessageRow {
  id: string;
  thread_id: string;
  role: ChatRole;
  content: unknown; // jsonb — concrete shape lives in lib/chat/types.ts
  audio_url: string | null;
  tool_calls: unknown | null;
  created_at: string;
}

export interface ChatUserContextRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  bike: { brand?: string; model?: string; year?: number; cc?: number } | null;
  riding_style: "touring" | "sport" | "adventure" | "urban" | "offroad" | null;
  size_profile: { helmet?: string; jacket?: string; gloves?: string; boots?: string } | null;
  preferred_brands: string[] | null;
  budget_band: "entry" | "mid" | "premium" | null;
  notes: string | null;
  updated_at: string;
}

export interface ChatTelemetryRow {
  id: string;
  thread_id: string | null;
  message_id: string | null;
  event: string;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  tool_name: string | null;
  tool_status: string | null;
  cost_usd: number | null;
  latency_ms: number | null;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: no errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/types/database-augment.ts
git commit -m "feat(chat): hand-written DB type augmentation for chat tables"
```

---

## Task 4: Anonymous Session Cookie (TDD)

**Files:**
- Create: `src/lib/chat/session.ts`
- Create: `src/lib/chat/session.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/session.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateSessionId, isValidSessionId, SESSION_COOKIE_NAME } from "./session";

describe("generateSessionId", () => {
  it("returns a string longer than 20 chars", () => {
    const id = generateSessionId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(20);
  });

  it("returns a different value on each call", () => {
    const a = generateSessionId();
    const b = generateSessionId();
    expect(a).not.toBe(b);
  });

  it("returned id passes isValidSessionId", () => {
    expect(isValidSessionId(generateSessionId())).toBe(true);
  });
});

describe("isValidSessionId", () => {
  it("rejects empty string", () => {
    expect(isValidSessionId("")).toBe(false);
  });
  it("rejects too short", () => {
    expect(isValidSessionId("abc")).toBe(false);
  });
  it("rejects values with spaces", () => {
    expect(isValidSessionId("aaaaaaaaaaaaaaaaaaaa bbb")).toBe(false);
  });
  it("accepts a 32-char alphanumeric", () => {
    expect(isValidSessionId("a".repeat(32))).toBe(true);
  });
});

describe("SESSION_COOKIE_NAME", () => {
  it("is exactly mm_chat_session", () => {
    expect(SESSION_COOKIE_NAME).toBe("mm_chat_session");
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

Run:
```bash
pnpm exec vitest run src/lib/chat/session.test.ts
```
Expected: 7 failures (module not found / undefined exports).

- [ ] **Step 3: Implement**

Create `src/lib/chat/session.ts`:

```ts
import { randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "mm_chat_session";

/** 32-char URL-safe id from 24 random bytes (base64url-ish). */
export function generateSessionId(): string {
  return randomBytes(24)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const VALID_RE = /^[A-Za-z0-9_-]{20,}$/;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && VALID_RE.test(value);
}

export interface ChatSessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number; // seconds
}

export const SESSION_COOKIE_OPTIONS: ChatSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/session.test.ts
```
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/session.ts src/lib/chat/session.test.ts
git commit -m "feat(chat): anonymous session id helpers"
```

---

## Task 5: Chat Types Module

**Files:**
- Create: `src/lib/chat/types.ts`

- [ ] **Step 1: Write the types**

Create `src/lib/chat/types.ts`:

```ts
import type { UIMessage } from "ai";
import type {
  ChatMessageRow,
  ChatThreadRow,
  ChatUserContextRow,
} from "@/types/database-augment";

/** What the AI SDK puts in chat_messages.content (parts array). */
export type ChatMessageContent = UIMessage["parts"];

/** Strongly-typed chat_messages row (content narrowed). */
export interface ChatMessage extends Omit<ChatMessageRow, "content"> {
  content: ChatMessageContent;
}

export type ChatThread = ChatThreadRow;
export type ChatUserContext = ChatUserContextRow;

/** Live storefront state the system prompt is augmented with each turn. */
export interface StorefrontState {
  locale: string;
  pathname: string;
  cart: { itemCount: number; totalCents: number; currency: string };
  bike: ChatUserContextRow["bike"];
  wishlistCount: number;
  ridingStyle: ChatUserContextRow["riding_style"];
  notes: string | null;
}

/** Locale codes the storefront supports (matches next-intl config). */
export type SiteLocale = "el" | "en" | "de" | "it" | "fr" | "bg";
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/chat/types.ts
git commit -m "feat(chat): shared types module"
```

---

## Task 6: System Prompt — Base + Multilingual Strings

**Files:**
- Create: `src/lib/chat/prompts/base.ts`
- Create: `src/lib/chat/prompts/multilingual.ts`

- [ ] **Step 1: Write the base prompt**

Create `src/lib/chat/prompts/base.ts`:

```ts
/**
 * Πιτ — the sales-assistant persona.
 *
 * Single-source-of-truth, Greek. The model handles cross-language phrasing
 * automatically via the multilingual addendum. Do NOT translate this file
 * per locale.
 *
 * Mirrors the spec section "System Prompt (the salesperson)". When the spec
 * changes, this file changes — they must stay in sync.
 */
export const BASE_PROMPT_EL = `
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
- Όταν δείχνεις προϊόντα στον χρήστη, αναφέρεις όνομα + brand + τιμή.
- Αν ο χρήστης ζητάει κάτι έξω από τον εξοπλισμό μηχανής (νομικά, ιατρικά,
  custom orders, εγγυήσεις πέρα από τα standard), καλείς handoffToHuman.
`.trim();
```

- [ ] **Step 2: Write the multilingual addendum**

Create `src/lib/chat/prompts/multilingual.ts`:

```ts
/**
 * Appended to BASE_PROMPT_EL on every turn. Tells the model how to handle
 * the customer's actual language, which may differ from the site locale.
 *
 * Written in English to keep the multilingual instruction itself
 * language-neutral — the model follows English instructions equally well
 * regardless of reply language.
 */
export const MULTILINGUAL_ADDENDUM = `
Multilingual behavior:
- Detect the customer's language from their most recent message. Reply in
  THAT exact language with native register (not stiff translation).
- Greeklish (Greek written with Latin letters, e.g. "thelo ena kranos") →
  reply in standard Ελληνικά.
- Mixed-language input → match the dominant language of the latest user message.
- Product names returned by tools are in the site's catalog locale ({site_locale}).
  When the chat language differs from the catalog locale, gloss the product
  type/category in the chat language on first mention so the customer
  understands what it is. Example (Polish customer, Greek catalog):
  "Mam świetny kask touring — 'Caberg Tourmax' (kask turystyczny). 249 €."
- Never apologize for not speaking a language — you speak it.
- If a customer writes in a language with mixed scripts (Cyrillic + Latin),
  pick the script of the dominant word count.
- If the customer is silent on language preference, start in {site_locale}.
  If they reply in a different language, switch fluently and stay there
  until they switch again.
`.trim();
```

- [ ] **Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/chat/prompts/base.ts src/lib/chat/prompts/multilingual.ts
git commit -m "feat(chat): base persona + multilingual addendum prompt strings"
```

---

## Task 7: System Prompt Builder (TDD)

**Files:**
- Create: `src/lib/chat/prompts/build-system-prompt.test.ts`
- Create: `src/lib/chat/prompts/build-system-prompt.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/prompts/build-system-prompt.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./build-system-prompt";
import type { StorefrontState } from "../types";

const state: StorefrontState = {
  locale: "el",
  pathname: "/category/kranh--touring",
  cart: { itemCount: 2, totalCents: 24999, currency: "EUR" },
  bike: { brand: "Yamaha", model: "MT-09", year: 2023, cc: 890 },
  wishlistCount: 3,
  ridingStyle: "touring",
  notes: "Προτιμά μαύρα. Άνοιξε εργασίες στο 1500.",
};

describe("buildSystemPrompt", () => {
  it("starts with the Greek base persona", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain('Είσαι ο "Πιτ"');
  });

  it("includes the multilingual addendum", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain("Multilingual behavior");
    expect(out).toContain("Greeklish");
  });

  it("substitutes site_locale in the addendum", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain("start in el");
    expect(out).not.toContain("{site_locale}");
  });

  it("includes injected context with all fields filled", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain("Γλώσσα σελίδας: el");
    expect(out).toContain("Τρέχουσα σελίδα: /category/kranh--touring");
    expect(out).toContain("Καλάθι: 2 προϊόντα");
    expect(out).toContain("249,99 EUR");
    expect(out).toContain("Yamaha MT-09 2023 (890cc)");
    expect(out).toContain("Wishlist: 3");
    expect(out).toContain("touring");
    expect(out).toContain("μαύρα");
  });

  it("renders 'καμία' when bike is null", () => {
    const out = buildSystemPrompt({ ...state, bike: null });
    expect(out).toContain("Καταχωρημένη μηχανή: καμία");
  });

  it("renders 'άγνωστο' when riding_style is null", () => {
    const out = buildSystemPrompt({ ...state, ridingStyle: null });
    expect(out).toContain("Στυλ οδήγησης (αν ξέρουμε): άγνωστο");
  });

  it("omits notes line cleanly when notes is null", () => {
    const out = buildSystemPrompt({ ...state, notes: null });
    expect(out).toContain("Σημειώσεις από προηγούμενες συνομιλίες: —");
  });

  it("orders sections: base, addendum, context", () => {
    const out = buildSystemPrompt(state);
    const baseIdx = out.indexOf("Είσαι ο");
    const mlIdx = out.indexOf("Multilingual behavior");
    const ctxIdx = out.indexOf("Πλαίσιο τώρα");
    expect(baseIdx).toBeGreaterThan(-1);
    expect(mlIdx).toBeGreaterThan(baseIdx);
    expect(ctxIdx).toBeGreaterThan(mlIdx);
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/prompts/build-system-prompt.test.ts
```
Expected: 8 failures (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/chat/prompts/build-system-prompt.ts`:

```ts
import type { StorefrontState } from "../types";
import { BASE_PROMPT_EL } from "./base";
import { MULTILINGUAL_ADDENDUM } from "./multilingual";

function formatPriceEUR(cents: number, currency: string): string {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} ${currency}`;
}

function formatBike(bike: StorefrontState["bike"]): string {
  if (!bike) return "καμία";
  const parts = [bike.brand, bike.model, bike.year].filter(Boolean).join(" ");
  const cc = bike.cc ? ` (${bike.cc}cc)` : "";
  return parts ? `${parts}${cc}` : "καμία";
}

function buildInjectedContext(s: StorefrontState): string {
  return [
    "Πλαίσιο τώρα:",
    `Γλώσσα σελίδας: ${s.locale}`,
    `Τρέχουσα σελίδα: ${s.pathname}`,
    `Καλάθι: ${s.cart.itemCount} προϊόντα, σύνολο ${formatPriceEUR(s.cart.totalCents, s.cart.currency)}`,
    `Καταχωρημένη μηχανή: ${formatBike(s.bike)}`,
    `Wishlist: ${s.wishlistCount}`,
    `Στυλ οδήγησης (αν ξέρουμε): ${s.ridingStyle ?? "άγνωστο"}`,
    `Σημειώσεις από προηγούμενες συνομιλίες: ${s.notes ?? "—"}`,
  ].join("\n");
}

export function buildSystemPrompt(state: StorefrontState): string {
  const multilingual = MULTILINGUAL_ADDENDUM.replaceAll(
    "{site_locale}",
    state.locale,
  );
  const context = buildInjectedContext(state);
  return `${BASE_PROMPT_EL}\n\n${multilingual}\n\n${context}`;
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/prompts/build-system-prompt.test.ts
```
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/prompts/build-system-prompt.ts src/lib/chat/prompts/build-system-prompt.test.ts
git commit -m "feat(chat): buildSystemPrompt composer with TDD"
```

---

## Task 8: Storefront State Reader (TDD)

**Files:**
- Create: `src/lib/chat/storefront-state.test.ts`
- Create: `src/lib/chat/storefront-state.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/storefront-state.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadStorefrontState } from "./storefront-state";

const supabaseMock = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("loadStorefrontState", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  it("returns defaults for an anonymous session with no cart/bike/wishlist", async () => {
    // bike + wishlist + context all return empty
    supabaseMock.from.mockImplementation((table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        is: () => q,
        maybeSingle: async () => ({ data: null }),
        single: async () => ({ data: null, error: null }),
      };
      return q as never;
    });

    const out = await loadStorefrontState({
      locale: "el",
      pathname: "/",
      userId: null,
      sessionId: "anon_abc",
      cartItemCount: 0,
      cartTotalCents: 0,
      currency: "EUR",
    });

    expect(out).toMatchObject({
      locale: "el",
      pathname: "/",
      cart: { itemCount: 0, totalCents: 0, currency: "EUR" },
      bike: null,
      wishlistCount: 0,
      ridingStyle: null,
      notes: null,
    });
  });

  it("loads bike + riding_style + notes from chat_user_context when present", async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        is: () => q,
        maybeSingle: async () => {
          if (table === "chat_user_context") {
            return {
              data: {
                bike: { brand: "Yamaha", model: "MT-09", year: 2023, cc: 890 },
                riding_style: "touring",
                notes: "Προτιμά μαύρα.",
              },
            };
          }
          return { data: null };
        },
        single: async () => ({ data: null, error: null }),
      };
      return q as never;
    });

    const out = await loadStorefrontState({
      locale: "el",
      pathname: "/product/foo",
      userId: "user_1",
      sessionId: "sess_1",
      cartItemCount: 2,
      cartTotalCents: 24999,
      currency: "EUR",
    });

    expect(out.bike?.brand).toBe("Yamaha");
    expect(out.ridingStyle).toBe("touring");
    expect(out.notes).toContain("μαύρα");
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/storefront-state.test.ts
```
Expected: 2 failures (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/chat/storefront-state.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { StorefrontState } from "./types";
import type { ChatUserContextRow } from "@/types/database-augment";

export interface LoadStorefrontStateInput {
  locale: string;
  pathname: string;
  userId: string | null;
  sessionId: string;
  cartItemCount: number;
  cartTotalCents: number;
  currency: string;
}

/**
 * Reads chat_user_context + wishlist count for the current viewer.
 * Cart fields are passed in (the caller has them via existing cart cookie).
 */
export async function loadStorefrontState(
  input: LoadStorefrontStateInput,
): Promise<StorefrontState> {
  const supabase = await createClient();

  // chat_user_context lookup — by user_id if logged in, else session_id
  const ctxQuery = supabase.from("chat_user_context").select("*");
  const ctxQueryFinal = input.userId
    ? ctxQuery.eq("user_id", input.userId)
    : ctxQuery.eq("session_id", input.sessionId).is("user_id", null);

  const { data: ctxRow } = await ctxQueryFinal.maybeSingle<ChatUserContextRow>();

  // Wishlist count for logged-in users only (RLS-scoped table)
  let wishlistCount = 0;
  if (input.userId) {
    const { data: wlData } = await supabase
      .from("wishlist_items")
      .select("product_id", { count: "exact", head: true })
      .eq("user_id", input.userId);
    wishlistCount = (wlData as { count?: number } | null)?.count ?? 0;
  }

  return {
    locale: input.locale,
    pathname: input.pathname,
    cart: {
      itemCount: input.cartItemCount,
      totalCents: input.cartTotalCents,
      currency: input.currency,
    },
    bike: ctxRow?.bike ?? null,
    wishlistCount,
    ridingStyle: ctxRow?.riding_style ?? null,
    notes: ctxRow?.notes ?? null,
  };
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/storefront-state.test.ts
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/storefront-state.ts src/lib/chat/storefront-state.test.ts
git commit -m "feat(chat): loadStorefrontState reader with TDD"
```

---

## Task 9: searchProducts Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/search-products.test.ts`
- Create: `src/lib/chat/tools/search-products.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/tools/search-products.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchProductsTool } from "./search-products";

vi.mock("@/lib/meilisearch/search-query", () => ({
  searchProducts: vi.fn(),
}));

import { searchProducts as meiliSearch } from "@/lib/meilisearch/search-query";

const mockedSearch = vi.mocked(meiliSearch);

describe("searchProductsTool", () => {
  beforeEach(() => {
    mockedSearch.mockReset();
  });

  it("has a Zod schema with required query string", () => {
    const schema = searchProductsTool.inputSchema;
    expect(schema).toBeDefined();
    // empty input should fail
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("forwards query and filters to Meilisearch", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: [],
      totalHits: 0,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });

    await searchProductsTool.execute(
      { query: "κράνος", filters: { brand: "shoei", priceMax: 500 }, limit: 8 },
      { toolCallId: "x", messages: [] } as never,
    );

    expect(mockedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "κράνος",
        brand: "shoei",
        priceMax: 500,
      }),
    );
  });

  it("returns slim hit shape — id/slug/name/brand/price/image/in_stock", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: [
        {
          id: "p1",
          slug: "shoei-rf",
          name: "Shoei RF",
          brand: "Shoei",
          price: 599,
          image_url: "/img.jpg",
          stock: 3,
        } as never,
      ],
      totalHits: 1,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });

    const out = await searchProductsTool.execute(
      { query: "shoei" },
      { toolCallId: "x", messages: [] } as never,
    );

    expect(out.hits[0]).toEqual({
      id: "p1",
      slug: "shoei-rf",
      name: "Shoei RF",
      brand: "Shoei",
      price: 599,
      image: "/img.jpg",
      in_stock: true,
    });
    expect(out.totalHits).toBe(1);
  });

  it("caps results at 12 even when caller requests more", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: Array.from({ length: 24 }, (_, i) => ({
        id: `p${i}`,
        slug: `s${i}`,
        name: `N${i}`,
        brand: "B",
        price: 1,
        image_url: null,
        stock: 1,
      })) as never,
      totalHits: 24,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });

    const out = await searchProductsTool.execute(
      { query: "x", limit: 50 },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.hits.length).toBe(12);
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/tools/search-products.test.ts
```
Expected: 4 failures (module not found).

- [ ] **Step 3: Implement**

Create `src/lib/chat/tools/search-products.ts`:

```ts
import { tool } from "ai";
import { z } from "zod/v4";
import { searchProducts as meiliSearch } from "@/lib/meilisearch/search-query";

const inputSchema = z.object({
  query: z.string().min(1).describe("Natural-language search query, e.g. 'κράνος touring μαύρο'"),
  filters: z
    .object({
      brand: z.string().optional(),
      category: z.string().optional(),
      priceMin: z.number().nonnegative().optional(),
      priceMax: z.number().nonnegative().optional(),
    })
    .optional(),
  limit: z.number().int().positive().max(12).optional().default(6),
});

export interface SearchProductsHit {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  in_stock: boolean;
}

export interface SearchProductsResult {
  hits: SearchProductsHit[];
  totalHits: number;
}

export const searchProductsTool = tool({
  description:
    "Search the product catalog. Returns up to 12 product hits with id, slug, name, brand, price, image, and stock status. Use this when the user wants to find products by description, category, or brand.",
  inputSchema,
  execute: async ({ query, filters, limit }): Promise<SearchProductsResult> => {
    const raw = await meiliSearch({
      q: query,
      brand: filters?.brand,
      category: filters?.category,
      priceMin: filters?.priceMin,
      priceMax: filters?.priceMax,
      page: 1,
    });
    const capped = raw.hits.slice(0, Math.min(limit, 12));
    return {
      hits: capped.map((h) => ({
        id: String(h.id),
        slug: h.slug,
        name: h.name,
        brand: h.brand,
        price: h.price,
        image: (h as { image_url?: string | null }).image_url ?? null,
        in_stock: ((h as { stock?: number }).stock ?? 0) > 0,
      })),
      totalHits: raw.totalHits,
    };
  },
});
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/tools/search-products.test.ts
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/tools/search-products.ts src/lib/chat/tools/search-products.test.ts
git commit -m "feat(chat): searchProducts tool with TDD"
```

---

## Task 10: getProductDetails Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/get-product-details.test.ts`
- Create: `src/lib/chat/tools/get-product-details.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/tools/get-product-details.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProductDetailsTool } from "./get-product-details";

const supabaseMock = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("getProductDetailsTool", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  it("requires productId in schema", () => {
    const r = getProductDetailsTool.inputSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("returns notFound when product missing", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }));

    const out = await getProductDetailsTool.execute(
      { productId: "missing" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.found).toBe(false);
  });

  it("returns product on success with key fields", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "p1",
              slug: "shoei-rf",
              name: "Shoei RF",
              brand: "Shoei",
              price: 599,
              description: "Top of the line.",
              image_url: "/img.jpg",
              stock: 5,
            },
          }),
        }),
      }),
    }));

    const out = await getProductDetailsTool.execute(
      { productId: "p1" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.found).toBe(true);
    if (out.found) {
      expect(out.product.name).toBe("Shoei RF");
      expect(out.product.price).toBe(599);
    }
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/tools/get-product-details.test.ts
```
Expected: 3 failures.

- [ ] **Step 3: Implement**

Create `src/lib/chat/tools/get-product-details.ts`:

```ts
import { tool } from "ai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  productId: z.string().min(1).describe("Product UUID or slug"),
});

export interface ProductDetails {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  description: string | null;
  image: string | null;
  in_stock: boolean;
}

export type GetProductDetailsResult =
  | { found: true; product: ProductDetails }
  | { found: false };

export const getProductDetailsTool = tool({
  description:
    "Get full details for a single product by id or slug. Returns name, brand, price, description, image, and stock status. Use this when the user wants to know more about one specific product.",
  inputSchema,
  execute: async ({ productId }): Promise<GetProductDetailsResult> => {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      productId,
    );
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, brand, price, description, image_url, stock")
      .eq(isUuid ? "id" : "slug", productId)
      .maybeSingle();

    if (!data) return { found: false };

    const row = data as {
      id: string;
      slug: string;
      name: string;
      brand: string;
      price: number;
      description: string | null;
      image_url: string | null;
      stock: number | null;
    };

    return {
      found: true,
      product: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        price: row.price,
        description: row.description,
        image: row.image_url,
        in_stock: (row.stock ?? 0) > 0,
      },
    };
  },
});
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/tools/get-product-details.test.ts
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/tools/get-product-details.ts src/lib/chat/tools/get-product-details.test.ts
git commit -m "feat(chat): getProductDetails tool with TDD"
```

---

## Task 11: checkStock Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/check-stock.test.ts`
- Create: `src/lib/chat/tools/check-stock.ts`

> The `lib/erp/index.ts` adapter exposes a stock-lookup function via the active provider (Entersoft today). The tool wraps that. Where the adapter returns a structure different from what's assumed here, adjust the destructuring — types live in `lib/erp/types.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/tools/check-stock.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkStockTool } from "./check-stock";

vi.mock("@/lib/erp", () => ({
  getStockForProduct: vi.fn(),
}));

import { getStockForProduct } from "@/lib/erp";
const mocked = vi.mocked(getStockForProduct);

describe("checkStockTool", () => {
  beforeEach(() => mocked.mockReset());

  it("requires productId in schema", () => {
    const r = checkStockTool.inputSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("returns per-store stock plus a total", async () => {
    mocked.mockResolvedValueOnce({
      productId: "p1",
      stores: [
        { id: "kallithea", name: "Καλλιθέα", stock: 3 },
        { id: "thessaloniki", name: "Θεσσαλονίκη", stock: 1 },
        { id: "warehouse", name: "Αποθήκη", stock: 8 },
      ],
    });
    const out = await checkStockTool.execute(
      { productId: "p1" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.totalStock).toBe(12);
    expect(out.stores).toHaveLength(3);
    expect(out.inStock).toBe(true);
  });

  it("returns inStock=false and empty stores when nothing returned", async () => {
    mocked.mockResolvedValueOnce({ productId: "p1", stores: [] });
    const out = await checkStockTool.execute(
      { productId: "p1" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.totalStock).toBe(0);
    expect(out.inStock).toBe(false);
  });

  it("falls through gracefully on ERP error (returns unknown stock, not throws)", async () => {
    mocked.mockRejectedValueOnce(new Error("ERP down"));
    const out = await checkStockTool.execute(
      { productId: "p1" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/tools/check-stock.test.ts
```
Expected: 4 failures.

- [ ] **Step 3: Implement**

Create `src/lib/chat/tools/check-stock.ts`:

```ts
import { tool } from "ai";
import { z } from "zod/v4";
import { getStockForProduct } from "@/lib/erp";

const inputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});

export interface CheckStockResult {
  productId: string;
  inStock: boolean;
  totalStock: number;
  stores: Array<{ id: string; name: string; stock: number }>;
  error?: string;
}

export const checkStockTool = tool({
  description:
    "Check live stock for a specific product across the company's two stores (Καλλιθέα, Θεσσαλονίκη) and the central warehouse. Always call this before claiming a product is in stock — catalog cache may be stale.",
  inputSchema,
  execute: async ({ productId, variantId }): Promise<CheckStockResult> => {
    try {
      const data = await getStockForProduct({ productId, variantId });
      const total = data.stores.reduce((acc, s) => acc + (s.stock ?? 0), 0);
      return {
        productId,
        inStock: total > 0,
        totalStock: total,
        stores: data.stores,
      };
    } catch (err) {
      return {
        productId,
        inStock: false,
        totalStock: 0,
        stores: [],
        error: `Stock lookup unavailable: ${(err as Error).message}`,
      };
    }
  },
});
```

> If `@/lib/erp` doesn't yet export `getStockForProduct` with this shape, add a thin wrapper inside `lib/erp/index.ts` that calls the existing Entersoft adapter and returns `{ productId, stores: [...] }`. Keep the rest of the chat plan unchanged.

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/tools/check-stock.test.ts
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/tools/check-stock.ts src/lib/chat/tools/check-stock.test.ts
git commit -m "feat(chat): checkStock tool with TDD"
```

---

## Task 12: handoffToHuman Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/handoff-to-human.test.ts`
- Create: `src/lib/chat/tools/handoff-to-human.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/tools/handoff-to-human.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { handoffToHumanTool } from "./handoff-to-human";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

vi.stubEnv("RESEND_API_KEY", "test_key");
vi.stubEnv("CHAT_HANDOFF_TO", "sales@motomarket-shop.gr");

describe("handoffToHumanTool", () => {
  beforeEach(() => sendMock.mockReset());

  it("requires reason and summary", () => {
    expect(handoffToHumanTool.inputSchema.safeParse({}).success).toBe(false);
    expect(
      handoffToHumanTool.inputSchema.safeParse({ reason: "x" }).success,
    ).toBe(false);
  });

  it("calls Resend with the configured To address and includes summary", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "e_1" }, error: null });

    const out = await handoffToHumanTool.execute(
      { reason: "custom order", summary: "Wants a Klim jacket in size XS" },
      { toolCallId: "x", messages: [] } as never,
    );

    expect(out.delivered).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    const arg = sendMock.mock.calls[0][0];
    expect(arg.to).toContain("sales@motomarket-shop.gr");
    expect(arg.subject).toContain("custom order");
    const body = (arg.html ?? arg.text ?? "") as string;
    expect(body).toContain("Klim jacket");
  });

  it("returns delivered=false on Resend error without throwing", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const out = await handoffToHumanTool.execute(
      { reason: "x", summary: "y" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.delivered).toBe(false);
    expect(out.error).toContain("boom");
  });

  it("returns delivered=false when RESEND_API_KEY is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const out = await handoffToHumanTool.execute(
      { reason: "x", summary: "y" },
      { toolCallId: "x", messages: [] } as never,
    );
    expect(out.delivered).toBe(false);
    expect(out.error).toContain("not configured");
    vi.stubEnv("RESEND_API_KEY", "test_key"); // restore for sibling tests
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/tools/handoff-to-human.test.ts
```
Expected: 4 failures.

- [ ] **Step 3: Implement**

Create `src/lib/chat/tools/handoff-to-human.ts`:

```ts
import { tool } from "ai";
import { z } from "zod/v4";
import { Resend } from "resend";

const inputSchema = z.object({
  reason: z
    .string()
    .min(3)
    .describe("Short, one-line reason for escalation, e.g. 'custom order'"),
  summary: z
    .string()
    .min(10)
    .describe(
      "2-5 sentence summary of what the customer wants, in the customer's own language plus a Greek note if different.",
    ),
});

export interface HandoffResult {
  delivered: boolean;
  to?: string;
  error?: string;
}

export const handoffToHumanTool = tool({
  description:
    "Escalate to a human salesperson by email. Use this when the user asks for something outside the product catalog (custom orders, legal/warranty disputes, medical/fit questions beyond standard sizing) or explicitly asks for a human. Always confirm to the user after calling.",
  inputSchema,
  execute: async ({ reason, summary }): Promise<HandoffResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CHAT_HANDOFF_TO ?? "sales@motomarket-shop.gr";

    if (!apiKey) {
      return {
        delivered: false,
        error: "Email handoff is not configured (RESEND_API_KEY missing).",
      };
    }

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: "Πιτ (AI) <pit@motomarket-shop.gr>",
        to: [to],
        subject: `[Πιτ] Handoff — ${reason}`,
        html: `<h3>Νέο handoff από τον Πιτ</h3>
<p><strong>Λόγος:</strong> ${escapeHtml(reason)}</p>
<h4>Σύνοψη:</h4>
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(summary)}</pre>
<p><em>Απάντησε στον πελάτη όσο πιο σύντομα γίνεται.</em></p>`,
      });

      if (error) return { delivered: false, error: error.message };
      return { delivered: true, to };
    } catch (err) {
      return {
        delivered: false,
        error: (err as Error).message,
      };
    }
  },
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/tools/handoff-to-human.test.ts
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/tools/handoff-to-human.ts src/lib/chat/tools/handoff-to-human.test.ts
git commit -m "feat(chat): handoffToHuman tool with TDD"
```

---

## Task 13: Tool Registry Index

**Files:**
- Create: `src/lib/chat/tools/index.ts`

- [ ] **Step 1: Write the registry**

Create `src/lib/chat/tools/index.ts`:

```ts
import { searchProductsTool } from "./search-products";
import { getProductDetailsTool } from "./get-product-details";
import { checkStockTool } from "./check-stock";
import { handoffToHumanTool } from "./handoff-to-human";

/**
 * Tool catalog handed to streamText({ tools: chatTools }).
 * Sub-projects B/C/D append more tools here — names must be stable
 * (the model learns them via the system prompt; renaming breaks behavior).
 */
export const chatTools = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  checkStock: checkStockTool,
  handoffToHuman: handoffToHumanTool,
} as const;

export type ChatToolName = keyof typeof chatTools;
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/chat/tools/index.ts
git commit -m "feat(chat): tool registry index"
```

---

## Task 14: Rate Limiter

**Files:**
- Create: `src/lib/chat/rate-limit.ts`

> No tests in this task — Upstash mocking is more friction than the wrapper deserves. The route handler test in Task 16 exercises the real behavior.

- [ ] **Step 1: Implement**

Create `src/lib/chat/rate-limit.ts`:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface CheckLimitInput {
  key: string;
  isAnonymous: boolean;
}

interface CheckLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let anonLimiter: Ratelimit | null = null;
let authedLimiter: Ratelimit | null = null;

if (url && token) {
  const redis = new Redis({ url, token });
  // Anonymous: 40 / hour, 200 / day enforced via two sliding windows
  anonLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(40, "1 h"),
    prefix: "chat:anon",
  });
  // Logged-in: 80 / hour
  authedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(80, "1 h"),
    prefix: "chat:user",
  });
}

export async function checkRateLimit({
  key,
  isAnonymous,
}: CheckLimitInput): Promise<CheckLimitResult> {
  // Fallback when Upstash isn't configured: allow everything (dev/test).
  if (!anonLimiter || !authedLimiter) {
    return { ok: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }
  const limiter = isAnonymous ? anonLimiter : authedLimiter;
  const r = await limiter.limit(key);
  return {
    ok: r.success,
    limit: r.limit,
    remaining: r.remaining,
    reset: r.reset,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/lib/chat/rate-limit.ts
git commit -m "feat(chat): rate limiter wrapper (Upstash + dev fallback)"
```

---

## Task 15: Thread / Message Queries (TDD)

**Files:**
- Create: `src/lib/chat/queries.test.ts`
- Create: `src/lib/chat/queries.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/queries.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadRecentMessages, RECENT_MESSAGE_WINDOW } from "./queries";

const supabaseMock = {
  rpc: vi.fn(),
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("queries", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
    supabaseMock.rpc.mockReset();
  });

  it("RECENT_MESSAGE_WINDOW equals 30 per spec", () => {
    expect(RECENT_MESSAGE_WINDOW).toBe(30);
  });

  it("loadRecentMessages returns rows in chronological order", async () => {
    const rows = [
      { id: "m1", role: "user", content: [], created_at: "2026-01-01" },
      { id: "m2", role: "assistant", content: [], created_at: "2026-01-02" },
    ];
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: rows, error: null }),
          }),
        }),
      }),
    }));
    const out = await loadRecentMessages("thread_1");
    expect(out.length).toBe(2);
    expect(out[0].id).toBe("m1");
    expect(out[1].id).toBe("m2");
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

```bash
pnpm exec vitest run src/lib/chat/queries.test.ts
```
Expected: 2 failures.

- [ ] **Step 3: Implement**

Create `src/lib/chat/queries.ts`:

```ts
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatMessageContent } from "./types";
import type { ChatRole } from "@/types/database-augment";

export const RECENT_MESSAGE_WINDOW = 30;

/**
 * Sets the Postgres session GUC used by RLS policies to scope anonymous queries.
 * Call this at the top of any chat-related query path BEFORE other selects.
 */
export async function setSessionGuc(sessionId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("set_config" as never, {
    parameter: "app.session_id",
    value: sessionId,
    is_local: true,
  });
}

/** Last RECENT_MESSAGE_WINDOW messages in chronological (oldest-first) order. */
export async function loadRecentMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, thread_id, role, content, audio_url, tool_calls, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(RECENT_MESSAGE_WINDOW);
  if (error || !data) return [];

  const rows = data as Array<{
    id: string;
    thread_id: string;
    role: ChatRole;
    content: ChatMessageContent;
    audio_url: string | null;
    tool_calls: unknown | null;
    created_at: string;
  }>;

  return rows.reverse(); // oldest → newest for model context
}

export interface CreateThreadInput {
  userId: string | null;
  sessionId: string;
  locale: string;
}

export async function createThread(input: CreateThreadInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      user_id: input.userId,
      session_id: input.sessionId,
      locale: input.locale,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`createThread failed: ${error?.message ?? "no row"}`);
  }
  return (data as { id: string }).id;
}

export interface AppendMessageInput {
  threadId: string;
  role: ChatRole;
  content: ChatMessageContent;
  toolCalls?: unknown;
}

export async function appendMessage(input: AppendMessageInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    thread_id: input.threadId,
    role: input.role,
    content: input.content,
    tool_calls: input.toolCalls ?? null,
  });
  if (error) throw new Error(`appendMessage failed: ${error.message}`);

  await supabase
    .from("chat_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.threadId);
}
```

- [ ] **Step 4: Run tests — confirm pass**

```bash
pnpm exec vitest run src/lib/chat/queries.test.ts
```
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/queries.ts src/lib/chat/queries.test.ts
git commit -m "feat(chat): thread/message persistence queries with TDD"
```

---

## Task 16: /api/chat Route Handler

**Files:**
- Create: `src/app/api/chat/route.ts`

> Smoke-tested end-to-end via curl in Step 4 — no separate unit test (the integration of streamText + Supabase is the contract; mocking it adds noise without value).

- [ ] **Step 1: Implement the route**

Create `src/app/api/chat/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { cookies } from "next/headers";
import { z } from "zod/v4";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, generateSessionId, isValidSessionId } from "@/lib/chat/session";
import { buildSystemPrompt } from "@/lib/chat/prompts/build-system-prompt";
import { loadStorefrontState } from "@/lib/chat/storefront-state";
import { chatTools } from "@/lib/chat/tools";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { appendMessage, createThread, loadRecentMessages, setSessionGuc } from "@/lib/chat/queries";

export const runtime = "nodejs"; // need Resend + crypto
export const maxDuration = 30;

const bodySchema = z.object({
  messages: z.array(z.unknown()), // UIMessage[] — validated by the AI SDK shape
  threadId: z.string().uuid().nullable().optional(),
  locale: z.string().min(2).max(5).default("el"),
  pathname: z.string().default("/"),
  cartItemCount: z.number().int().nonnegative().default(0),
  cartTotalCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("EUR"),
});

export async function POST(req: NextRequest) {
  // 1. Parse body
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const body = parsed.data;
  const messages = body.messages as UIMessage[];

  // 2. Resolve session
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionId(sessionId)) {
    sessionId = generateSessionId();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
  }

  // 3. Resolve auth (user_id or null)
  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const isAnonymous = userId === null;

  // 4. Rate limit
  const rl = await checkRateLimit({
    key: userId ?? sessionId,
    isAnonymous,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "rate_limit",
        message:
          "Φτάσαμε το όριο μηνυμάτων για αυτή την ώρα. Δοκίμασε ξανά σε λίγο ή στείλε email στο sales@motomarket-shop.gr.",
        reset: rl.reset,
      },
      { status: 429 },
    );
  }

  // 5. Scope RLS for anonymous reads/writes
  await setSessionGuc(sessionId);

  // 6. Ensure thread exists
  let threadId = body.threadId ?? null;
  if (!threadId) {
    threadId = await createThread({
      userId,
      sessionId,
      locale: body.locale,
    });
  }

  // 7. Persist the latest user message
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (lastUser) {
    await appendMessage({
      threadId,
      role: "user",
      content: lastUser.parts ?? [],
    });
  }

  // 8. Load conversation context (sliding window from DB, NOT from request)
  const history = await loadRecentMessages(threadId);
  const historyUIMessages: UIMessage[] = history.map((m) => ({
    id: m.id,
    role: m.role as UIMessage["role"],
    parts: m.content,
  }));

  // 9. Build system prompt
  const state = await loadStorefrontState({
    locale: body.locale,
    pathname: body.pathname,
    userId,
    sessionId,
    cartItemCount: body.cartItemCount,
    cartTotalCents: body.cartTotalCents,
    currency: body.currency,
  });
  const system = buildSystemPrompt(state);

  // 10. Stream
  const result = streamText({
    model: openai("gpt-4o"),
    system,
    messages: convertToModelMessages(historyUIMessages),
    tools: chatTools,
    temperature: 0.3,
    maxOutputTokens: 800,
    onFinish: async ({ text, toolCalls }) => {
      try {
        await appendMessage({
          threadId: threadId!,
          role: "assistant",
          content: [{ type: "text", text }] as never,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        });
      } catch {
        // best-effort persistence — never break the stream
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "x-thread-id": threadId },
  });
}
```

> If the AI SDK version installed in Task 1 uses slightly different method names (`convertToModelMessages` vs `convertToCoreMessages`, `toUIMessageStreamResponse` vs `toAIStreamResponse`), check `node_modules/ai/dist/index.d.ts` and adapt — these names change between minor versions. The contract (messages in, stream out) is stable.

- [ ] **Step 2: Set required env vars locally**

In `.env.local`:
```env
OPENAI_API_KEY=sk-... # real key
```
Optional but recommended:
```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=re_...
```

- [ ] **Step 3: Type-check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```
Expected: clean for the new files. Pre-existing repo errors that aren't yours are acceptable.

- [ ] **Step 4: Smoke test via curl**

Start the dev server in another terminal:
```bash
pnpm dev
```

Then post a minimal turn:
```bash
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"m1","role":"user","parts":[{"type":"text","text":"Γεια"}]}],"locale":"el","pathname":"/"}'
```
Expected: 200 OK + an `text/event-stream`-style chunked response with streamed text in Greek. Look for an `x-thread-id` response header.

If you see `OPENAI_API_KEY missing` or 500, fix env and retry.

- [ ] **Step 5: Verify DB writes**

In Supabase Studio, open `chat_threads` — should have 1 new row with locale `el`. `chat_messages` should have at least the user turn (and after the stream finishes, the assistant turn).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(chat): /api/chat route with streamText + persistence + rate limit"
```

---

## Task 17: Chat Provider (useChat wrapper)

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-provider.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

interface ChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  chat: ReturnType<typeof useChat>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname() ?? "/";

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        locale,
        pathname,
        cartItemCount: 0, // wired in Task 22 — keep 0 for now
        cartTotalCents: 0,
        currency: "EUR",
      }),
    }),
  });

  const value: ChatContextValue = {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
    chat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(store)/_components/chat/chat-provider.tsx
git commit -m "feat(chat): ChatProvider + useChatContext"
```

---

## Task 18: Page-View Counter Hook

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/use-page-view-counter.ts`

- [ ] **Step 1: Implement**

```ts
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SS_VIEWS = "mm_pageviews";
const SS_AUTOOPENED = "mm_chat_auto_opened";
const LS_SUPPRESS = "mm_chat_suppress_until";

interface Options {
  /** Called once when the third pageview of the session lands AND
   *  auto-open is not suppressed AND has not fired before. */
  onAutoOpenTrigger: () => void;
}

export function usePageViewCounter({ onAutoOpenTrigger }: Options): void {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prev = Number(sessionStorage.getItem(SS_VIEWS) ?? "0");
    const next = prev + 1;
    sessionStorage.setItem(SS_VIEWS, String(next));

    if (next !== 3) return;
    if (sessionStorage.getItem(SS_AUTOOPENED) === "1") return;

    const suppressUntil = Number(localStorage.getItem(LS_SUPPRESS) ?? "0");
    if (suppressUntil > Date.now()) return;

    sessionStorage.setItem(SS_AUTOOPENED, "1");
    onAutoOpenTrigger();
  }, [pathname, onAutoOpenTrigger]);
}

/** Called when user closes the chat. Sets 24h suppression. */
export function suppressAutoOpenFor24h(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    LS_SUPPRESS,
    String(Date.now() + 24 * 60 * 60 * 1000),
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[locale]/(store)/_components/chat/use-page-view-counter.ts
git commit -m "feat(chat): page-view counter hook for auto-open"
```

---

## Task 19: Chat Launcher (Floating FAB + Auto-Open)

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-launcher.tsx`
- Create: `src/app/[locale]/(store)/_components/chat/chat.module.css`

- [ ] **Step 1: Create the styles**

Create `src/app/[locale]/(store)/_components/chat/chat.module.css`:

```css
.launcher {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  background: #e10600;
  color: white;
  border: none;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 12px 32px -8px rgba(225, 6, 0, 0.55);
  z-index: 90;
  transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.launcher:hover { transform: scale(1.06); }
.launcher svg { width: 26px; height: 26px; }

.panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(420px, 100vw);
  background: var(--mm-bg, #0b0b0c);
  color: var(--mm-fg, #f5f5f4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: -16px 0 60px -20px rgba(0, 0, 0, 0.6);
}
@media (max-width: 1023px) {
  .panel { width: 100vw; }
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 600;
}
.closeBtn {
  background: transparent;
  color: inherit;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bubble {
  max-width: 80%;
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.9375rem;
  line-height: 1.45;
  word-wrap: break-word;
}
.bubbleUser {
  align-self: flex-end;
  background: #e10600;
  color: white;
  border-bottom-right-radius: 0.375rem;
}
.bubbleAssistant {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.06);
  color: var(--mm-fg, #f5f5f4);
  border-bottom-left-radius: 0.375rem;
}

.composer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.input {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
}
.input:focus { outline: 2px solid #e10600; outline-offset: -1px; }
.sendBtn {
  background: #e10600;
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0 1rem;
  font-weight: 600;
  cursor: pointer;
}
.sendBtn:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 2: Implement the launcher**

Create `src/app/[locale]/(store)/_components/chat/chat-launcher.tsx`:

```tsx
"use client";

import { useChatContext } from "./chat-provider";
import { ChatPanel } from "./chat-panel";
import { suppressAutoOpenFor24h, usePageViewCounter } from "./use-page-view-counter";
import styles from "./chat.module.css";

export function ChatLauncher() {
  const { isOpen, open, close } = useChatContext();

  usePageViewCounter({ onAutoOpenTrigger: open });

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className={styles.launcher}
          aria-label="Άνοιξε τη συνομιλία με τον Πιτ"
          onClick={open}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a8 8 0 0 1-12.83 6.4L3 20l1.5-4.5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {isOpen && (
        <ChatPanel
          onClose={() => {
            suppressAutoOpenFor24h();
            close();
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(store)/_components/chat/chat-launcher.tsx src/app/[locale]/(store)/_components/chat/chat.module.css
git commit -m "feat(chat): floating launcher button + base styles"
```

---

## Task 20: Chat Panel + Messages + Composer

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-panel.tsx`
- Create: `src/app/[locale]/(store)/_components/chat/chat-messages.tsx`
- Create: `src/app/[locale]/(store)/_components/chat/chat-composer.tsx`

- [ ] **Step 1: Implement the messages component**

Create `src/app/[locale]/(store)/_components/chat/chat-messages.tsx`:

```tsx
"use client";

import type { UIMessage } from "ai";
import styles from "./chat.module.css";

interface Props {
  messages: UIMessage[];
}

export function ChatMessages({ messages }: Props) {
  return (
    <div className={styles.messages} role="log" aria-live="polite">
      {messages.length === 0 && (
        <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
          Γεια! Είμαι ο Πιτ. Τι μηχανή έχεις και τι ψάχνεις;
        </div>
      )}
      {messages.map((m) => {
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("");
        const cls =
          m.role === "user"
            ? `${styles.bubble} ${styles.bubbleUser}`
            : `${styles.bubble} ${styles.bubbleAssistant}`;
        return (
          <div key={m.id} className={cls}>
            {text || (m.role === "assistant" ? "..." : "")}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Implement the composer**

Create `src/app/[locale]/(store)/_components/chat/chat-composer.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import styles from "./chat.module.css";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <input
        type="text"
        className={styles.input}
        placeholder="Γράψε στον Πιτ..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        aria-label="Πληκτρολόγησε μήνυμα"
      />
      <button type="submit" className={styles.sendBtn} disabled={disabled || !value.trim()}>
        Στείλε
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Implement the panel**

Create `src/app/[locale]/(store)/_components/chat/chat-panel.tsx`:

```tsx
"use client";

import { useChatContext } from "./chat-provider";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import styles from "./chat.module.css";

interface Props {
  onClose: () => void;
}

export function ChatPanel({ onClose }: Props) {
  const { chat } = useChatContext();
  const isBusy = chat.status === "submitted" || chat.status === "streaming";

  return (
    <div className={styles.panel} role="dialog" aria-label="Συνομιλία με τον Πιτ">
      <header className={styles.header}>
        <span>Πιτ · online</span>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Κλείσιμο"
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <ChatMessages messages={chat.messages} />
      <ChatComposer
        disabled={isBusy}
        onSend={(text) => {
          chat.sendMessage({ text });
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
pnpm exec tsc --noEmit
```
Expected: clean. If `chat.sendMessage` is typed as something else by the installed `@ai-sdk/react` version, adapt: in v2+ the API is `chat.sendMessage({ text })`; in older v1 it was `chat.append({ role: "user", content: text })`. Use whatever the installed types expose.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(store)/_components/chat/chat-panel.tsx src/app/[locale]/(store)/_components/chat/chat-messages.tsx src/app/[locale]/(store)/_components/chat/chat-composer.tsx
git commit -m "feat(chat): chat panel + messages + composer UI"
```

---

## Task 21: Wire ChatLauncher into Store Layout

**Files:**
- Modify: `src/app/[locale]/(store)/layout.tsx`

- [ ] **Step 1: Inspect current layout**

Run:
```bash
pnpm exec head -n 80 src/app/[locale]/(store)/layout.tsx
```
Note where `<children />` is rendered and the closing tag. The chat must sit as a sibling, outside any constrained `<main>` container so it can use `position: fixed` cleanly.

- [ ] **Step 2: Add ChatProvider + ChatLauncher**

Edit `src/app/[locale]/(store)/layout.tsx`. At the top of imports add:

```tsx
import { ChatProvider } from "./_components/chat/chat-provider";
import { ChatLauncher } from "./_components/chat/chat-launcher";
```

Wrap the layout's children with `<ChatProvider>` and add `<ChatLauncher />` as a sibling. Example pattern (adapt to the exact JSX structure already in the file):

```tsx
return (
  <ChatProvider>
    {/* existing layout content stays unchanged */}
    {existingChildren}
    <ChatLauncher />
  </ChatProvider>
);
```

> **Do not** restructure the existing layout. Wrap and append only.

- [ ] **Step 3: Type-check + lint**

```bash
pnpm exec tsc --noEmit
pnpm lint
```
Expected: clean.

- [ ] **Step 4: Visual smoke test**

Run `pnpm dev`, open `http://localhost:3000/el`, look for the red floating button bottom-right. Click it. Type "Γεια". Hit Στείλε. Expected: streaming Greek reply within ~2 seconds. The bubble shrinks/grows as text arrives.

Open the Network tab in devtools, find the `/api/chat` request — confirm 200 status and `x-thread-id` response header.

In Supabase Studio, confirm `chat_threads` and `chat_messages` have new rows.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(store)/layout.tsx
git commit -m "feat(chat): mount ChatProvider + ChatLauncher in store layout"
```

---

## Task 22: Wire Cart State Into Chat Body

**Files:**
- Modify: `src/app/[locale]/(store)/_components/chat/chat-provider.tsx`

The chat-provider currently sends `cartItemCount: 0, cartTotalCents: 0`. The storefront has a cart hook/server function — use it so the system prompt sees the real cart.

- [ ] **Step 1: Find the existing cart reader**

Look at `src/lib/cart/cookie.ts`, `src/lib/cart/utils.ts`, and `src/lib/actions/cart.ts`. Identify a client-side hook or context that already exposes `{ itemCount, totalCents, currency }`. If a context provider exists in the store layout (e.g. `<CartProvider>`), reuse it. If not, add a single Supabase fetch using existing queries.

- [ ] **Step 2: Read cart in chat-provider**

Update the `useChat({ body })` body builder to pass the real numbers. Example using a hypothetical `useCart()`:

```tsx
import { useCart } from "@/app/[locale]/(store)/_components/shell/cart-provider"; // adjust to the real path

// ...inside ChatProvider:
const cart = useCart();
const chat = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
    body: () => ({
      locale,
      pathname,
      cartItemCount: cart.itemCount,
      cartTotalCents: cart.totalCents,
      currency: cart.currency,
    }),
  }),
});
```

If no `useCart` exists, fall back to a small `useCartSummary()` hook that calls a `/api/cart/summary` GET endpoint on mount + cart-mutation events. **Do not** invent a new cart system — wire the existing one.

- [ ] **Step 3: Verify**

Add 1 item to the cart via the existing PDP, then open the chat. Send: "τι έχω στο καλάθι;". Πιτ should mention the count (he sees it via the system prompt's `Καλάθι: 1 προϊόντα` line).

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(store)/_components/chat/chat-provider.tsx
git commit -m "feat(chat): pass live cart state into chat body"
```

---

## Task 23: End-to-End Smoke Verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test
```
Expected: all chat tests green, no regressions in pre-existing tests.

- [ ] **Step 2: Manual end-to-end on dev**

Run `pnpm dev`. In a clean browser window (incognito so cookies/storage start empty):

1. Visit `http://localhost:3000/el`. Confirm no chat panel auto-open (this is page view #1).
2. Navigate to a product page (page view #2). No auto-open.
3. Navigate to the cart page (page view #3). **Expect auto-open**.
4. Send: "Βρες μου ένα κράνος touring κάτω από 400 ευρώ".
5. Confirm a streamed reply that names real products from the catalog (gets them via `searchProducts`).
6. Send: "Έχει stock το πρώτο;".
7. Confirm Πιτ calls `checkStock` (look at network tab — the model's response should reference a real stock figure).
8. Send: "Θέλω να κάνω custom παραγγελία για έναν αναβάτη με κινητικά προβλήματα". Expect `handoffToHuman` to fire — check the `RESEND_API_KEY` mailbox for a delivery, or check server logs if Resend isn't configured.
9. Close the chat (✕). Reload the page twice. Confirm no auto-open within 24 hours (suppression).

- [ ] **Step 3: Mobile viewport check**

In devtools, switch to a mobile viewport (iPhone 12 sized). Open chat. Confirm full-screen modal. Confirm composer and messages render correctly with no horizontal scroll.

- [ ] **Step 4: Multilingual smoke**

Send in English: "Find me a touring helmet under €400". Confirm Πιτ replies in English. Then send: "Cześć, szukam kasku motocyklowego.". Confirm Πιτ switches to Polish naturally.

- [ ] **Step 5: Rate-limit smoke (optional, only if Upstash configured)**

Send 41 messages in an hour from the same anonymous session. The 41st should return 429 with the Greek graceful message. (If Upstash isn't configured locally, skip — the dev fallback allows everything.)

- [ ] **Step 6: Push the branch**

```bash
git push -u origin feat/ai-sales-assistant
```

> Per project rule, do NOT merge to main directly. Open a PR on GitHub for review.

- [ ] **Step 7: Final commit (if any tweaks were made during verification)**

```bash
git add -A
git diff --staged
# If clean, no commit. If there are last-mile fixes:
git commit -m "chore(chat): smoke verification polish"
git push
```

---

## Definition of Done for Sub-Project A

- [ ] `pnpm test` is green.
- [ ] `pnpm exec tsc --noEmit` is clean (no NEW errors from this work).
- [ ] `pnpm lint` is clean for files in `src/lib/chat/**` and `src/app/api/chat/**` and `src/app/[locale]/(store)/_components/chat/**`.
- [ ] Migration `20260527000001_chat_foundation.sql` applied and tables visible in Supabase Studio with RLS shields green.
- [ ] `.env.local.example` documents all new vars.
- [ ] Manual smoke from Task 23 passes start-to-finish in EL, EN, and one tail language.
- [ ] Branch pushed to `origin/feat/ai-sales-assistant`, PR opened (or ready to open).
- [ ] Closing the chat sets a 24-hour suppression cookie/localStorage entry.
- [ ] Anonymous and logged-in flows both produce rows that are visible to their owner only (verify by querying as a different anon session — should see zero rows).

Once this is done, the next planning cycle starts on **Sub-Project B (Generative UI + Co-pilot Navigation)** — inline product cards, `navigateTo`/`applyFilters`/`addToCart` client tools, comparison tables.
