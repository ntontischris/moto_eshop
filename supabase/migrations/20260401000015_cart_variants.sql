-- Add variant/size/color support to cart_items
alter table cart_items
  add column if not exists size  text,
  add column if not exists color text;

-- Drop the old unique constraint (cart_id, product_id) and add new one with size/color
alter table cart_items drop constraint if exists cart_items_cart_id_product_id_key;
alter table cart_items add constraint cart_items_cart_id_product_variant_key
  unique (cart_id, product_id, size, color);

-- Rename price_at_add to unit_price for clarity
alter table cart_items rename column price_at_add to unit_price;

-- Add sizes, colors, tags arrays to products for filtering
alter table products
  add column if not exists sizes  text[] not null default '{}',
  add column if not exists colors text[] not null default '{}',
  add column if not exists tags   text[] not null default '{}';

-- Index for array searches
create index if not exists idx_products_sizes  on products using gin(sizes);
create index if not exists idx_products_colors on products using gin(colors);
create index if not exists idx_products_tags   on products using gin(tags);
