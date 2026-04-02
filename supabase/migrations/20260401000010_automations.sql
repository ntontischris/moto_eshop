-- =====================
-- AUTOMATION QUEUE
-- =====================
create type automation_type as enum (
  'welcome_email', 'order_confirmation', 'abandoned_cart',
  'price_alert', 'review_request', 'loyalty_reward',
  'erp_sync', 'price_negotiation_response'
);

create type automation_status as enum ('pending', 'processing', 'done', 'failed');

create table automation_queue (
  id           uuid primary key default uuid_generate_v4(),
  type         automation_type not null,
  payload      jsonb not null default '{}',
  status       automation_status not null default 'pending',
  retry_count  smallint not null default 0,
  scheduled_at timestamptz not null default now(),
  processed_at timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);

create index idx_automation_queue_status       on automation_queue(status);
create index idx_automation_queue_scheduled_at on automation_queue(scheduled_at);
create index idx_automation_queue_type         on automation_queue(type);

alter table automation_queue enable row level security;

create policy "automation_queue_service_role_all"
  on automation_queue for all
  using (auth.role() = 'service_role');

-- =====================
-- EMAIL PREFERENCES
-- =====================
create type email_type as enum (
  'marketing', 'order_updates', 'price_alerts',
  'review_requests', 'loyalty_updates', 'newsletters'
);

create table email_preferences (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email_type   email_type not null,
  is_opted_in  boolean not null default true,
  unique(user_id, email_type)
);

create index idx_email_preferences_user_id on email_preferences(user_id);

alter table email_preferences enable row level security;

create policy "email_preferences_select_own"
  on email_preferences for select
  using (auth.uid() = user_id);

create policy "email_preferences_insert_own"
  on email_preferences for insert
  with check (auth.uid() = user_id);

create policy "email_preferences_update_own"
  on email_preferences for update
  using (auth.uid() = user_id);

create policy "email_preferences_service_role_all"
  on email_preferences for all
  using (auth.role() = 'service_role');
