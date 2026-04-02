-- =====================
-- CARTS (supports guest + logged-in)
-- =====================
create table carts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete set null,
  session_id text,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_carts_user_id    on carts(user_id);
create index idx_carts_session_id on carts(session_id);

create trigger carts_updated_at
  before update on carts
  for each row execute function update_updated_at();

alter table carts enable row level security;

create policy "carts_select_own"
  on carts for select
  using (auth.uid() = user_id);

create policy "carts_insert_own"
  on carts for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "carts_update_own"
  on carts for update
  using (auth.uid() = user_id);

create policy "carts_delete_own"
  on carts for delete
  using (auth.uid() = user_id);

create policy "carts_service_role_all"
  on carts for all
  using (auth.role() = 'service_role');

-- =====================
-- CART ITEMS
-- =====================
create table cart_items (
  id           uuid primary key default uuid_generate_v4(),
  cart_id      uuid not null references carts(id) on delete cascade,
  product_id   uuid not null references products(id) on delete cascade,
  quantity     integer not null default 1 check (quantity > 0),
  price_at_add numeric(10,2) not null,
  unique(cart_id, product_id)
);

create index idx_cart_items_cart_id on cart_items(cart_id);

alter table cart_items enable row level security;

create policy "cart_items_select_own"
  on cart_items for select
  using (
    cart_id in (
      select id from carts where user_id = auth.uid()
    )
  );

create policy "cart_items_insert_own"
  on cart_items for insert
  with check (
    cart_id in (
      select id from carts where user_id = auth.uid()
    )
  );

create policy "cart_items_update_own"
  on cart_items for update
  using (
    cart_id in (
      select id from carts where user_id = auth.uid()
    )
  );

create policy "cart_items_delete_own"
  on cart_items for delete
  using (
    cart_id in (
      select id from carts where user_id = auth.uid()
    )
  );

create policy "cart_items_service_role_all"
  on cart_items for all
  using (auth.role() = 'service_role');
