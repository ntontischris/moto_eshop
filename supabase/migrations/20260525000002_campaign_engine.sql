-- Campaign Engine: dynamic landing pages. One campaign holds 1-4 variants
-- (page content as blocks JSON). Reads for published+in-window pages are
-- public; all writes are admin-only (service role / server actions).

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'draft'
    check (status in ('draft','scheduled','published','expired','archived')),
  starts_at timestamptz,
  expires_at timestamptz,
  redirect_url text not null default '/',
  serving_mode text not null default 'split'
    check (serving_mode in ('split','targeting','mixed')),
  default_variant_id uuid,
  noindex boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_variants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  blocks jsonb not null default '[]'::jsonb,
  weight int not null default 1 check (weight >= 0),
  targeting_rules jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- default_variant_id points into campaign_variants (single source of truth for
-- "which variant is default"). Added after the table exists.
alter table public.campaigns
  add constraint campaigns_default_variant_fk
  foreign key (default_variant_id)
  references public.campaign_variants(id) on delete set null;

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  variant_id uuid references public.campaign_variants(id) on delete set null,
  type text not null
    check (type in ('view','cta_click','add_to_cart','purchase')),
  session_id text,
  value numeric,
  created_at timestamptz not null default now()
);

create index if not exists campaign_variants_campaign_id_idx
  on public.campaign_variants (campaign_id);
create index if not exists campaign_events_campaign_id_idx
  on public.campaign_events (campaign_id);
create index if not exists campaigns_slug_idx on public.campaigns (slug);

alter table public.campaigns enable row level security;
alter table public.campaign_variants enable row level security;
alter table public.campaign_events enable row level security;

-- Public can read only published campaigns inside their active window.
create policy "public reads published campaigns"
  on public.campaigns for select
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at >= now())
  );

create policy "public reads variants of published campaigns"
  on public.campaign_variants for select
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_variants.campaign_id
        and c.status = 'published'
        and (c.starts_at is null or c.starts_at <= now())
        and (c.expires_at is null or c.expires_at >= now())
    )
  );

-- No public policies on campaign_events: inserts happen server-side with the
-- service-role key (sub-project C). RLS-enabled with no policy = deny to anon.
