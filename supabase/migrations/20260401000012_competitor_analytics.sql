-- =====================
-- COMPETITOR PRICES
-- =====================
create table competitor_prices (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  competitor  text not null,
  price       numeric(10,2) not null,
  url         text,
  scraped_at  timestamptz not null default now()
);

create index idx_competitor_prices_product_id on competitor_prices(product_id);
create index idx_competitor_prices_scraped_at on competitor_prices(scraped_at);

alter table competitor_prices enable row level security;

create policy "competitor_prices_service_role_all"
  on competitor_prices for all
  using (auth.role() = 'service_role');

-- =====================
-- DAILY METRICS
-- =====================
create table daily_metrics (
  date              date primary key,
  total_orders      integer not null default 0,
  total_revenue     numeric(12,2) not null default 0,
  unique_visitors   integer not null default 0,
  conversion_rate   numeric(5,4) not null default 0
);

alter table daily_metrics enable row level security;

create policy "daily_metrics_service_role_all"
  on daily_metrics for all
  using (auth.role() = 'service_role');
