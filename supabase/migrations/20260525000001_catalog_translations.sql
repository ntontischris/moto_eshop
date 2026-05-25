-- i18n catalog translations.
--
-- product_translations ALREADY EXISTS (20260401000004_products.sql):
--   id uuid PK, product_id uuid, locale, name NOT NULL, description,
--   meta_title, meta_description, status product_status default 'draft',
--   unique(product_id, locale), RLS public-read WHERE status='active'.
-- So here we only ADD pipeline bookkeeping columns to it (idempotent), and
-- CREATE the new category_translations table. The AI pipeline writes rows with
-- status='active' so they are publicly readable under the existing policy.

alter table product_translations add column if not exists source_hash text;
alter table product_translations add column if not exists engine text;
alter table product_translations add column if not exists translated_at timestamptz default now();

create table if not exists category_translations (
  category_id      uuid not null references categories(id) on delete cascade,
  locale           text not null,
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

alter table category_translations enable row level security;
create policy "category_translations_public_read"
  on category_translations for select using (true);
