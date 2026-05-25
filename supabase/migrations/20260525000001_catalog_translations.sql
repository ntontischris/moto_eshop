-- Catalog translation tables for the i18n read path.
-- NOTE: products.id / categories.id are uuid (see src/types/database.ts),
-- so the FK columns are uuid, not bigint.
-- `if not exists` keeps this safe against the pre-existing product_translations
-- table from 20260401000004_products.sql.

create table if not exists product_translations (
  product_id   uuid not null references products(id) on delete cascade,
  locale       text   not null,
  name         text,
  description  text,
  source_hash  text,
  engine       text,
  translated_at timestamptz not null default now(),
  primary key (product_id, locale)
);
create index if not exists idx_product_translations_locale on product_translations(locale);

create table if not exists category_translations (
  category_id      uuid not null references categories(id) on delete cascade,
  locale           text   not null,
  name             text,
  description      text,
  meta_title       text,
  meta_description text,
  source_hash      text,
  engine           text,
  translated_at    timestamptz not null default now(),
  primary key (category_id, locale)
);
create index if not exists idx_category_translations_locale on category_translations(locale);

alter table product_translations enable row level security;
alter table category_translations enable row level security;
create policy "public read product_translations" on product_translations for select using (true);
create policy "public read category_translations" on category_translations for select using (true);
