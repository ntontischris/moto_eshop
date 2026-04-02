-- =====================
-- LOYALTY POINTS
-- =====================
create type loyalty_event as enum (
  'purchase', 'referral', 'review', 'signup', 'redemption', 'adjustment'
);

create table loyalty_points (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  points       integer not null,
  type         loyalty_event not null,
  reference_id uuid,
  created_at   timestamptz not null default now()
);

create index idx_loyalty_points_user_id on loyalty_points(user_id);

alter table loyalty_points enable row level security;

create policy "loyalty_points_select_own"
  on loyalty_points for select
  using (auth.uid() = user_id);

create policy "loyalty_points_service_role_all"
  on loyalty_points for all
  using (auth.role() = 'service_role');

-- =====================
-- REFERRAL CODES
-- =====================
create table referral_codes (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  code       text not null unique,
  created_at timestamptz not null default now()
);

create index idx_referral_codes_code on referral_codes(code);

alter table referral_codes enable row level security;

create policy "referral_codes_select_own"
  on referral_codes for select
  using (auth.uid() = user_id);

create policy "referral_codes_service_role_all"
  on referral_codes for all
  using (auth.role() = 'service_role');

-- =====================
-- REFERRALS
-- =====================
create type referral_status as enum ('pending', 'qualified', 'rewarded', 'rejected');

create table referrals (
  id          uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referee_id  uuid not null references auth.users(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  status      referral_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique(referrer_id, referee_id)
);

create index idx_referrals_referrer_id on referrals(referrer_id);
create index idx_referrals_referee_id  on referrals(referee_id);

alter table referrals enable row level security;

create policy "referrals_select_own"
  on referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referee_id);

create policy "referrals_service_role_all"
  on referrals for all
  using (auth.role() = 'service_role');
