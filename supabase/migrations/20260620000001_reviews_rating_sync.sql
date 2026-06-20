-- Keep the denormalized products.average_rating / review_count columns in sync
-- with the reviews table. These columns feed the PLP cards and the Product
-- JSON-LD (SEO), while the PDP reviews tab computes stats live — the trigger
-- makes both agree. Only `approved` reviews count.

create or replace function recalc_product_rating(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update products p
  set
    average_rating = sub.avg_rating,
    review_count   = sub.cnt
  from (
    select
      round(avg(rating)::numeric, 2) as avg_rating,
      count(*)                       as cnt
    from reviews
    where product_id = p_id and status = 'approved'
  ) as sub
  where p.id = p_id;
end;
$$;

create or replace function on_review_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform recalc_product_rating(old.product_id);
    return old;
  end if;

  -- INSERT / UPDATE: recalc the new product, and the old one too if it moved.
  perform recalc_product_rating(new.product_id);
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    perform recalc_product_rating(old.product_id);
  end if;
  return new;
end;
$$;

create trigger reviews_rating_sync
  after insert or update or delete on reviews
  for each row execute function on_review_change();

-- Backfill existing rows so the columns reflect reviews already in the table.
update products p
set
  average_rating = sub.avg_rating,
  review_count   = coalesce(sub.cnt, 0)
from (
  select
    product_id,
    round(avg(rating)::numeric, 2) as avg_rating,
    count(*)                       as cnt
  from reviews
  where status = 'approved'
  group by product_id
) as sub
where p.id = sub.product_id;
