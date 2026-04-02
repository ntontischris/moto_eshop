-- =====================
-- WISHLISTS
-- =====================
create table wishlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index idx_wishlists_user_id on wishlists(user_id);

alter table wishlists enable row level security;

create policy "wishlists_select_own"
  on wishlists for select
  using (auth.uid() = user_id);

create policy "wishlists_insert_own"
  on wishlists for insert
  with check (auth.uid() = user_id);

create policy "wishlists_delete_own"
  on wishlists for delete
  using (auth.uid() = user_id);

-- =====================
-- PRICE ALERTS
-- =====================
create table price_alerts (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null,
  product_id   uuid not null references products(id) on delete cascade,
  target_price numeric(10,2) not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index idx_price_alerts_product_id on price_alerts(product_id);
create index idx_price_alerts_email      on price_alerts(email);

alter table price_alerts enable row level security;

create policy "price_alerts_insert_any"
  on price_alerts for insert
  with check (true);

create policy "price_alerts_service_role_all"
  on price_alerts for all
  using (auth.role() = 'service_role');

-- =====================
-- REVIEWS
-- =====================
create type review_status as enum ('pending', 'approved', 'rejected');

create table reviews (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references auth.users(id) on delete set null,
  product_id         uuid not null references products(id) on delete cascade,
  rating             smallint not null check (rating between 1 and 5),
  title              text,
  body               text not null,
  bike_make          text,
  bike_model         text,
  rider_height       smallint,
  rider_weight       smallint,
  riding_experience  experience_level,
  is_verified        boolean not null default false,
  status             review_status not null default 'pending',
  created_at         timestamptz not null default now()
);

create index idx_reviews_product_id on reviews(product_id);
create index idx_reviews_user_id    on reviews(user_id);
create index idx_reviews_status     on reviews(status);

alter table reviews enable row level security;

create policy "reviews_public_read_approved"
  on reviews for select
  using (status = 'approved');

create policy "reviews_insert_own"
  on reviews for insert
  with check (auth.uid() = user_id);

create policy "reviews_update_own"
  on reviews for update
  using (auth.uid() = user_id and status = 'pending');

create policy "reviews_service_role_all"
  on reviews for all
  using (auth.role() = 'service_role');

-- =====================
-- REVIEW VOTES
-- =====================
create table review_votes (
  id         uuid primary key default uuid_generate_v4(),
  review_id  uuid not null references reviews(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  is_helpful boolean not null,
  unique(review_id, user_id)
);

create index idx_review_votes_review_id on review_votes(review_id);

alter table review_votes enable row level security;

create policy "review_votes_select_all"
  on review_votes for select
  using (true);

create policy "review_votes_insert_own"
  on review_votes for insert
  with check (auth.uid() = user_id);

create policy "review_votes_update_own"
  on review_votes for update
  using (auth.uid() = user_id);

create policy "review_votes_delete_own"
  on review_votes for delete
  using (auth.uid() = user_id);

-- =====================
-- QUESTIONS & ANSWERS
-- =====================
create table questions (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index idx_questions_product_id on questions(product_id);

alter table questions enable row level security;

create policy "questions_public_read"
  on questions for select
  using (true);

create policy "questions_insert_any_authed"
  on questions for insert
  with check (auth.uid() = user_id);

create policy "questions_service_role_all"
  on questions for all
  using (auth.role() = 'service_role');

create table answers (
  id          uuid primary key default uuid_generate_v4(),
  question_id uuid not null references questions(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  body        text not null,
  is_official boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_answers_question_id on answers(question_id);

alter table answers enable row level security;

create policy "answers_public_read"
  on answers for select
  using (true);

create policy "answers_insert_own"
  on answers for insert
  with check (auth.uid() = user_id);

create policy "answers_service_role_all"
  on answers for all
  using (auth.role() = 'service_role');
