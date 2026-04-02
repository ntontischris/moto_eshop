-- Add display/analytics columns to products
alter table products
  add column if not exists view_count     integer not null default 0,
  add column if not exists average_rating numeric(3,2),
  add column if not exists review_count   integer not null default 0;

create index if not exists idx_products_view_count     on products(view_count desc);
create index if not exists idx_products_average_rating on products(average_rating desc);

-- Add SEO intro text to categories
alter table categories
  add column if not exists seo_intro text;
