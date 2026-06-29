-- =====================================================================
-- Denormalize per-location stock back into products.stock
-- =====================================================================
-- The ERP sync fills product_stock_locations (one row per product /
-- warehouse / size) with the granular truth, but the storefront filters,
-- sorts, PDP buy-box, availability badges and checkout pricing all read
-- the denormalized products.stock total. That rollup was previously done
-- by an RPC named `recompute_product_stock_totals` which the sync script
-- already calls — but the function was never created, so every product
-- stayed at the placeholder stock = 0 (all out-of-stock).
--
-- This migration creates that missing function. It sums `available`
-- across ALL warehouses and sizes per product and writes the floored
-- integer total back to products.stock (floor = conservative against
-- overselling). Products with no stock locations are reset to 0.
--
-- NOTE: this is intentionally a one-shot recompute meant to run at the
-- END of a stock sync (~26k location rows / run). It is NOT a per-row
-- trigger on product_stock_locations: a trigger would fire thousands of
-- times per sync for no benefit.

create or replace function recompute_product_stock_totals()
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  update products p
  set stock = t.total
  from (
    select pr.id,
           greatest(floor(coalesce(sum(psl.available), 0)), 0)::int as total
    from products pr
    left join product_stock_locations psl on psl.product_id = pr.id
    group by pr.id
  ) t
  where p.id = t.id
    -- Only rewrite rows whose total actually changed, so a no-op sync
    -- doesn't churn 20k rows.
    and p.stock is distinct from t.total;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function recompute_product_stock_totals() is
  'Rolls up product_stock_locations.available (summed across all warehouses & sizes) into products.stock. Run once at the end of a stock sync. Returns the number of product rows whose total changed.';

-- Lock execution down to the sync worker (service_role). The storefront
-- never calls this; leaving it executable by public/anon/authenticated
-- would let any client mass-rewrite stock.
revoke execute on function recompute_product_stock_totals() from public;
grant execute on function recompute_product_stock_totals() to service_role;
