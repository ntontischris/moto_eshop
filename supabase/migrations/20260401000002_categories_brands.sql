-- =====================
-- CATEGORIES
-- =====================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  parent_id   uuid references categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_categories_slug      on categories(slug);
create index idx_categories_parent_id on categories(parent_id);

alter table categories enable row level security;

create policy "categories_public_read"
  on categories for select
  using (true);

create policy "categories_service_role_write"
  on categories for all
  using (auth.role() = 'service_role');

-- =====================
-- BRANDS
-- =====================
create table brands (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  description text,
  created_at  timestamptz not null default now()
);

create index idx_brands_slug on brands(slug);

alter table brands enable row level security;

create policy "brands_public_read"
  on brands for select
  using (true);

create policy "brands_service_role_write"
  on brands for all
  using (auth.role() = 'service_role');
