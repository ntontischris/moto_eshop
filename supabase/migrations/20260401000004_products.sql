-- =====================
-- PRODUCTS
-- =====================
create type product_status as enum ('draft', 'active', 'archived');
create type rider_type as enum ('beginner', 'intermediate', 'advanced', 'professional');
create type ce_level as enum ('CE1', 'CE2');

create table products (
  id                uuid primary key default uuid_generate_v4(),
  erp_id            text unique,
  name              text not null,
  slug              text not null unique,
  description       text,
  brand_id          uuid references brands(id) on delete set null,
  category_id       uuid references categories(id) on delete set null,
  price             numeric(10,2) not null,
  compare_at_price  numeric(10,2),
  cost_price        numeric(10,2),
  stock             integer not null default 0,
  sku               text unique,
  ean               text,
  weight            numeric(6,2),
  images            jsonb not null default '[]',
  specs             jsonb not null default '{}',
  certification     text,
  ce_level          ce_level,
  rider_type        rider_type,
  status            product_status not null default 'draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_products_slug        on products(slug);
create index idx_products_erp_id      on products(erp_id);
create index idx_products_category_id on products(category_id);
create index idx_products_brand_id    on products(brand_id);
create index idx_products_status      on products(status);
create index idx_products_sku         on products(sku);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

alter table products enable row level security;

create policy "products_public_read_active"
  on products for select
  using (status = 'active');

create policy "products_service_role_all"
  on products for all
  using (auth.role() = 'service_role');

-- =====================
-- PRODUCT TRANSLATIONS
-- =====================
create table product_translations (
  id               uuid primary key default uuid_generate_v4(),
  product_id       uuid not null references products(id) on delete cascade,
  locale           text not null,
  name             text not null,
  description      text,
  meta_title       text,
  meta_description text,
  status           product_status not null default 'draft',
  unique(product_id, locale)
);

create index idx_product_translations_product_id on product_translations(product_id);
create index idx_product_translations_locale     on product_translations(locale);

alter table product_translations enable row level security;

create policy "product_translations_public_read"
  on product_translations for select
  using (status = 'active');

create policy "product_translations_service_role_all"
  on product_translations for all
  using (auth.role() = 'service_role');

-- =====================
-- PRODUCT COMPATIBILITY
-- =====================
create table product_compatibility (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  bike_id    uuid not null references bikes(id) on delete cascade,
  unique(product_id, bike_id)
);

create index idx_product_compatibility_product_id on product_compatibility(product_id);
create index idx_product_compatibility_bike_id    on product_compatibility(bike_id);

alter table product_compatibility enable row level security;

create policy "product_compatibility_public_read"
  on product_compatibility for select
  using (true);

create policy "product_compatibility_service_role_all"
  on product_compatibility for all
  using (auth.role() = 'service_role');
