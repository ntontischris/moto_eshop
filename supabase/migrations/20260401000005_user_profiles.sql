-- =====================
-- USER PROFILES
-- =====================
create type experience_level as enum ('beginner', 'intermediate', 'expert');
create type rfm_segment as enum ('champion', 'loyal', 'at_risk', 'new', 'hibernating');

create table user_profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  first_name       text,
  last_name        text,
  phone            text,
  rider_type       rider_type,
  experience_level experience_level,
  height_cm        smallint,
  weight_kg        smallint,
  rfm_segment      rfm_segment,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

alter table user_profiles enable row level security;

create policy "user_profiles_select_own"
  on user_profiles for select
  using (auth.uid() = id);

create policy "user_profiles_update_own"
  on user_profiles for update
  using (auth.uid() = id);

create policy "user_profiles_insert_own"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "user_profiles_service_role_all"
  on user_profiles for all
  using (auth.role() = 'service_role');

-- =====================
-- USER BIKES (garage)
-- =====================
create table user_bikes (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  bike_id    uuid not null references bikes(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, bike_id)
);

create index idx_user_bikes_user_id on user_bikes(user_id);

alter table user_bikes enable row level security;

create policy "user_bikes_select_own"
  on user_bikes for select
  using (auth.uid() = user_id);

create policy "user_bikes_insert_own"
  on user_bikes for insert
  with check (auth.uid() = user_id);

create policy "user_bikes_update_own"
  on user_bikes for update
  using (auth.uid() = user_id);

create policy "user_bikes_delete_own"
  on user_bikes for delete
  using (auth.uid() = user_id);

-- =====================
-- USER BEHAVIOR
-- =====================
create type behavior_event as enum (
  'view', 'add_to_cart', 'remove_from_cart',
  'wishlist', 'purchase', 'review', 'search'
);

create table user_behavior (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  event_type behavior_event not null,
  created_at timestamptz not null default now()
);

create index idx_user_behavior_user_id    on user_behavior(user_id);
create index idx_user_behavior_product_id on user_behavior(product_id);
create index idx_user_behavior_created_at on user_behavior(created_at);

alter table user_behavior enable row level security;

create policy "user_behavior_insert_own"
  on user_behavior for insert
  with check (auth.uid() = user_id);

create policy "user_behavior_select_own"
  on user_behavior for select
  using (auth.uid() = user_id);

create policy "user_behavior_service_role_all"
  on user_behavior for all
  using (auth.role() = 'service_role');
