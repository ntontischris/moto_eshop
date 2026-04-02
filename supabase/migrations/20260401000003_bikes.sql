-- =====================
-- BIKES (fitment data)
-- =====================
create table bikes (
  id       uuid primary key default uuid_generate_v4(),
  make     text not null,
  model    text not null,
  year     smallint not null,
  category text -- naked, sport, adventure, touring, etc.
);

create index idx_bikes_make_model_year on bikes(make, model, year);

alter table bikes enable row level security;

create policy "bikes_public_read"
  on bikes for select
  using (true);

create policy "bikes_service_role_write"
  on bikes for all
  using (auth.role() = 'service_role');
