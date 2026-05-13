-- =====================================================================
-- ERP integration: sync logs, multi-warehouse stock, reservations
-- =====================================================================
-- Adds the plumbing needed to sync products/stock/customers from any
-- ERP provider (Entersoft now, Odoo later) without touching the
-- storefront-facing tables (products, orders, etc.) beyond what's
-- absolutely required.

-- ---------------------------------------------------------------------
-- 1. SYNC LOG — observability for cron jobs
-- ---------------------------------------------------------------------
create table if not exists erp_sync_log (
  id            uuid primary key default uuid_generate_v4(),
  entity        text not null check (entity in ('product','price','stock','customer','customer_site')),
  source        text not null default 'entersoft' check (source in ('entersoft','odoo')),
  status        text not null check (status in ('success','partial','failed','running')),
  records_in    integer,
  records_out   integer,
  error         text,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz
);

create index if not exists idx_erp_sync_log_entity_started on erp_sync_log(entity, started_at desc);

alter table erp_sync_log enable row level security;
create policy "erp_sync_log_service_role_all"
  on erp_sync_log for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------
-- 2. WAREHOUSES — physical locations + 3PL
-- ---------------------------------------------------------------------
create table if not exists warehouses (
  code        text primary key,           -- 'sindos','benizelou','antistaseos','beinoglou'
  name        text not null,
  city        text,
  is_3pl      boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into warehouses (code, name, city, is_3pl) values
  ('sindos',      'Σίνδος (Factory Shop)',   'Θεσσαλονίκη', false),
  ('benizelou',   'Καλλιθέα - Βενιζέλου',    'Αθήνα',       false),
  ('antistaseos', 'Αντιστάσεως',             'Αθήνα',       false),
  ('beinoglou',   'Beinoglou 3PL',           'Αθήνα',       true)
on conflict (code) do nothing;

alter table warehouses enable row level security;
create policy "warehouses_public_read"
  on warehouses for select using (is_active = true);
create policy "warehouses_service_role_all"
  on warehouses for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------
-- 3. PRODUCT STOCK PER LOCATION + SIZE
-- ---------------------------------------------------------------------
-- One row per (product, warehouse, size). `size` is nullable for items
-- without variants. Replaces the single `products.stock` column for
-- granular truth; `products.stock` will be kept as a denormalized
-- materialized total for fast catalog queries.
create table if not exists product_stock_locations (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references products(id) on delete cascade,
  warehouse_code  text not null references warehouses(code) on delete restrict,
  size            text,
  available       numeric(10,2) not null default 0,
  last_synced_at  timestamptz not null default now()
);

-- Unique per (product, warehouse, size). NULL size is treated as a
-- distinct value via a partial unique index to avoid Postgres NULL!=NULL issue.
create unique index if not exists ux_psl_product_wh_size_notnull
  on product_stock_locations(product_id, warehouse_code, size)
  where size is not null;
create unique index if not exists ux_psl_product_wh_nosize
  on product_stock_locations(product_id, warehouse_code)
  where size is null;

create index if not exists idx_psl_product on product_stock_locations(product_id);
create index if not exists idx_psl_wh      on product_stock_locations(warehouse_code);

alter table product_stock_locations enable row level security;
create policy "psl_public_read"
  on product_stock_locations for select using (true);
create policy "psl_service_role_all"
  on product_stock_locations for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------
-- 4. STOCK RESERVATIONS — prevent overselling during checkout
-- ---------------------------------------------------------------------
-- Created when a cart item is added (short TTL) or an order is placed
-- (long TTL). Decrement happens implicitly via the v_product_available
-- view below.
create table if not exists stock_reservations (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references products(id) on delete cascade,
  size         text,
  quantity     numeric(10,2) not null check (quantity > 0),
  cart_id      uuid references carts(id) on delete cascade,
  order_id     uuid references orders(id) on delete set null,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_sr_product_size on stock_reservations(product_id, size);
create index if not exists idx_sr_expires      on stock_reservations(expires_at);
create index if not exists idx_sr_cart         on stock_reservations(cart_id);
create index if not exists idx_sr_order        on stock_reservations(order_id);

alter table stock_reservations enable row level security;
create policy "sr_service_role_all"
  on stock_reservations for all using (auth.role() = 'service_role');
create policy "sr_owner_read"
  on stock_reservations for select
  using (
    cart_id in (select id from carts where user_id = auth.uid())
    or order_id in (select id from orders where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 5. AVAILABLE-STOCK VIEW — used by storefront & checkout
-- ---------------------------------------------------------------------
create or replace view v_product_available_stock as
select
  psl.product_id,
  psl.size,
  sum(psl.available) as on_hand,
  coalesce((
    select sum(quantity)
    from stock_reservations sr
    where sr.product_id = psl.product_id
      and sr.size is not distinct from psl.size
      and sr.expires_at > now()
  ), 0) as reserved,
  sum(psl.available) - coalesce((
    select sum(quantity)
    from stock_reservations sr
    where sr.product_id = psl.product_id
      and sr.size is not distinct from psl.size
      and sr.expires_at > now()
  ), 0) as available
from product_stock_locations psl
group by psl.product_id, psl.size;

-- ---------------------------------------------------------------------
-- 6. CUSTOMER MIRROR — legacy customers imported from ERP
-- ---------------------------------------------------------------------
-- These are read-only mirrors of ERP customer master data. Linked to
-- a Supabase auth user only after the customer reactivates their
-- account on the new site (GDPR-friendly).
create table if not exists erp_customers (
  id                  uuid primary key default uuid_generate_v4(),
  erp_id              text not null unique,         -- TradeAccountGID
  erp_person_id       text not null,                -- fPersonCodeGID
  source              text not null default 'entersoft',
  code                text not null,
  name                text not null,
  vat                 text,
  email               text,
  phone               text,
  salesman            text,
  inactive            boolean not null default false,
  balance_limit       numeric(12,2) not null default 0,
  invoice_policy      text,
  -- Linked Supabase auth user (null until they reactivate)
  user_id             uuid references auth.users(id) on delete set null,
  last_modified_erp   timestamptz,
  imported_at         timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_erp_customers_email on erp_customers(email);
create index if not exists idx_erp_customers_vat   on erp_customers(vat);
create index if not exists idx_erp_customers_code  on erp_customers(code);
create index if not exists idx_erp_customers_user  on erp_customers(user_id);

create trigger erp_customers_updated_at
  before update on erp_customers
  for each row execute function update_updated_at();

alter table erp_customers enable row level security;
create policy "erp_customers_service_role_all"
  on erp_customers for all using (auth.role() = 'service_role');
create policy "erp_customers_self_read"
  on erp_customers for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 7. CUSTOMER SITES MIRROR
-- ---------------------------------------------------------------------
create table if not exists erp_customer_sites (
  id              uuid primary key default uuid_generate_v4(),
  erp_id          text not null unique,                 -- GID
  customer_erp_id text not null,                        -- TradeAccountGID
  customer_code   text not null,
  customer_name   text not null,
  source          text not null default 'entersoft',
  address         text,
  country_code    text,
  district_code   text,
  city_code       text,
  area            text,
  postal_code     text,
  phone           text,
  vat             text,
  is_main         boolean not null default false,
  active          boolean not null default true,
  last_modified_erp timestamptz,
  imported_at     timestamptz not null default now()
);

create index if not exists idx_ecs_customer on erp_customer_sites(customer_erp_id);
create index if not exists idx_ecs_postal   on erp_customer_sites(postal_code);

alter table erp_customer_sites enable row level security;
create policy "erp_customer_sites_service_role_all"
  on erp_customer_sites for all using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------
-- 8. PRODUCT EXTENSIONS for ERP linkage
-- ---------------------------------------------------------------------
-- products.erp_id already exists (text unique). Add a few helpers
-- that the sync layer needs but the original schema didn't anticipate.
alter table products
  add column if not exists barcodes      text[] not null default '{}',
  add column if not exists wholesale_price numeric(10,2),
  add column if not exists category_codes text[] not null default '{}',
  add column if not exists erp_has_missing_fields boolean not null default false,
  add column if not exists last_synced_at timestamptz;

create index if not exists idx_products_barcodes on products using gin(barcodes);
create index if not exists idx_products_category_codes on products using gin(category_codes);

-- ---------------------------------------------------------------------
-- 9. ENV PROVIDER NOTE
-- ---------------------------------------------------------------------
-- Storefront reads ERP_PROVIDER from env; this migration is provider-
-- agnostic. When switching to Odoo, only the sync workers change.
