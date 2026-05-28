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

-- Telemetry: writable only by service_role (server-only); readable by admins.
-- ADAPTATION vs plan: the plan referenced `up.is_admin = true` but
-- 20260402000001_admin_role.sql added a `role` column (text, NOT a boolean
-- is_admin). Admin check uses `up.role IN ('admin', 'super_admin')` instead.
create policy chat_telemetry_admin_select on public.chat_telemetry
  for select using (
    exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin', 'super_admin'))
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
