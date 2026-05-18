-- Mirrored-image URLs (Supabase Storage) per product. NULL = not yet
-- migrated → storefront falls back to the legacy image proxy.
-- Additive & reversible; does not touch products.images (ERP sync target).
alter table products add column if not exists images_cdn jsonb;
