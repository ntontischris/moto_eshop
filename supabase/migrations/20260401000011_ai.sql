-- =====================
-- PRODUCT EMBEDDINGS (pgvector)
-- =====================
create table product_embeddings (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade unique,
  embedding  vector(1536) not null,
  created_at timestamptz not null default now()
);

-- HNSW index for fast approximate nearest-neighbour search
create index idx_product_embeddings_vector
  on product_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table product_embeddings enable row level security;

create policy "product_embeddings_public_read"
  on product_embeddings for select
  using (true);

create policy "product_embeddings_service_role_all"
  on product_embeddings for all
  using (auth.role() = 'service_role');

-- =====================
-- CHAT SESSIONS
-- =====================
create table chat_sessions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete set null,
  messages   jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index idx_chat_sessions_user_id on chat_sessions(user_id);

alter table chat_sessions enable row level security;

create policy "chat_sessions_select_own"
  on chat_sessions for select
  using (auth.uid() = user_id);

create policy "chat_sessions_insert_own"
  on chat_sessions for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "chat_sessions_update_own"
  on chat_sessions for update
  using (auth.uid() = user_id);

create policy "chat_sessions_service_role_all"
  on chat_sessions for all
  using (auth.role() = 'service_role');

-- =====================
-- PRICE NEGOTIATIONS (AI bargaining)
-- =====================
create type negotiation_status as enum (
  'pending', 'countered', 'accepted', 'rejected', 'expired'
);

create table price_negotiations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete set null,
  product_id    uuid not null references products(id) on delete cascade,
  offered_price numeric(10,2) not null,
  counter_price numeric(10,2),
  status        negotiation_status not null default 'pending',
  coupon_code   text,
  created_at    timestamptz not null default now()
);

create index idx_price_negotiations_user_id    on price_negotiations(user_id);
create index idx_price_negotiations_product_id on price_negotiations(product_id);
create index idx_price_negotiations_status     on price_negotiations(status);

alter table price_negotiations enable row level security;

create policy "price_negotiations_select_own"
  on price_negotiations for select
  using (auth.uid() = user_id);

create policy "price_negotiations_insert_own"
  on price_negotiations for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "price_negotiations_service_role_all"
  on price_negotiations for all
  using (auth.role() = 'service_role');
