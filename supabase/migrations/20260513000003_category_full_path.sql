-- Add full hierarchical path to categories so we can build clean
-- path-based URLs like /eksoplismos-anabath/endysh/mpoyfan.
--
-- Storing this denormalized has trade-offs (must be kept in sync when
-- parents change) but it keeps category lookups by URL a single
-- indexed equality query — no recursive CTE needed at render time.

alter table categories
  add column if not exists leaf_slug text,
  add column if not exists full_path text;

-- Unique full_path so URLs are one-to-one with categories.
-- Filled by scripts/backfill-category-paths.ts after migration runs.
create unique index if not exists ux_categories_full_path
  on categories(full_path)
  where full_path is not null;

create index if not exists idx_categories_leaf_slug on categories(leaf_slug);
