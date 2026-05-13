-- ---------------------------------------------------------------------
-- Fix: product_stock_locations cannot use ON CONFLICT against the partial
-- unique indexes (Postgres requires a full unique constraint).
--
-- Coerce NULL size to '' so we can hold a single regular unique constraint.
-- '' means "no variant" semantically; readers should compare with `is null`
-- or `= ''` interchangeably.
-- ---------------------------------------------------------------------
drop index if exists ux_psl_product_wh_size_notnull;
drop index if exists ux_psl_product_wh_nosize;

-- Normalize any existing NULLs to empty string before NOT NULL-ifying
update product_stock_locations set size = '' where size is null;

alter table product_stock_locations
  alter column size set default '',
  alter column size set not null;

alter table product_stock_locations
  add constraint product_stock_locations_unique
  unique (product_id, warehouse_code, size);
