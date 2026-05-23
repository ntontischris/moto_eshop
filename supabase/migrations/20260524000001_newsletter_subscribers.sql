-- Newsletter subscribers captured from the storefront (home band, footer, …).
-- Writes go through a server action using the service-role key (bypasses RLS);
-- there are no public policies, so the list is not readable/writable by anon.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
