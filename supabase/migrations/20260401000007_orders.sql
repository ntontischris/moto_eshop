-- =====================
-- ORDERS
-- =====================
create type order_status as enum (
  'pending', 'confirmed', 'processing',
  'shipped', 'delivered', 'cancelled', 'refunded'
);

create table orders (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references auth.users(id) on delete set null,
  order_number            text not null unique,
  status                  order_status not null default 'pending',
  subtotal                numeric(10,2) not null,
  shipping_cost           numeric(10,2) not null default 0,
  discount                numeric(10,2) not null default 0,
  total                   numeric(10,2) not null,
  shipping_address        jsonb not null,
  billing_address         jsonb not null,
  stripe_payment_intent_id text,
  erp_order_id            text,
  created_at              timestamptz not null default now()
);

create index idx_orders_user_id      on orders(user_id);
create index idx_orders_order_number on orders(order_number);
create index idx_orders_status       on orders(status);
create index idx_orders_created_at   on orders(created_at);

alter table orders enable row level security;

create policy "orders_select_own"
  on orders for select
  using (auth.uid() = user_id);

create policy "orders_insert_own"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "orders_service_role_all"
  on orders for all
  using (auth.role() = 'service_role');

-- =====================
-- ORDER ITEMS
-- =====================
create table order_items (
  id         uuid primary key default uuid_generate_v4(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity   integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  total      numeric(10,2) not null
);

create index idx_order_items_order_id on order_items(order_id);

alter table order_items enable row level security;

create policy "order_items_select_own"
  on order_items for select
  using (
    order_id in (
      select id from orders where user_id = auth.uid()
    )
  );

create policy "order_items_service_role_all"
  on order_items for all
  using (auth.role() = 'service_role');

-- =====================
-- ORDER EVENTS (audit trail)
-- =====================
create table order_events (
  id         uuid primary key default uuid_generate_v4(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     order_status not null,
  note       text,
  created_at timestamptz not null default now()
);

create index idx_order_events_order_id on order_events(order_id);

alter table order_events enable row level security;

create policy "order_events_select_own"
  on order_events for select
  using (
    order_id in (
      select id from orders where user_id = auth.uid()
    )
  );

create policy "order_events_service_role_all"
  on order_events for all
  using (auth.role() = 'service_role');
