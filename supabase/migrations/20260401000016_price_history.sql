-- Price history table
create table if not exists price_history (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  price       numeric(10,2) not null,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_price_history_product_id
  on price_history (product_id, recorded_at desc);

alter table price_history enable row level security;

create policy "price_history_public_read"
  on price_history for select
  using (true);

create policy "price_history_service_role_all"
  on price_history for all
  using (auth.role() = 'service_role');

-- Trigger: record price on every change
create or replace function record_price_history()
returns trigger language plpgsql as $$
begin
  if new.price is distinct from old.price then
    insert into price_history (product_id, price)
    values (new.id, new.price);
  end if;
  return new;
end;
$$;

create trigger products_price_history_trigger
after update of price on products
for each row execute function record_price_history();

-- Trigger: notify price alerts when price drops
create or replace function notify_price_alerts()
returns trigger language plpgsql as $$
begin
  if new.price < old.price then
    insert into automation_queue (type, payload, scheduled_at)
    select
      'price_alert',
      jsonb_build_object(
        'product_id', new.id,
        'alert_id', pa.id,
        'email', pa.email,
        'old_price', old.price,
        'new_price', new.price
      ),
      now()
    from price_alerts pa
    where pa.product_id = new.id
      and pa.is_active = true
      and pa.target_price >= new.price;
  end if;
  return new;
end;
$$;

create trigger products_price_alert_trigger
after update of price on products
for each row execute function notify_price_alerts();

-- Trigger: back in stock notification
create or replace function notify_back_in_stock()
returns trigger language plpgsql as $$
begin
  if old.stock = 0 and new.stock > 0 then
    insert into automation_queue (type, payload, scheduled_at)
    values (
      'price_alert',
      jsonb_build_object('product_id', new.id, 'type', 'back_in_stock'),
      now()
    );
  end if;
  return new;
end;
$$;

create trigger products_stock_alert_trigger
after update of stock on products
for each row execute function notify_back_in_stock();
