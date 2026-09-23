-- Slice 1: Identity, Source Registry, fetch observability, and append-only audit events.

create type public.app_role as enum ('admin', 'editor', 'approver');
create type public.source_type as enum ('rss', 'api', 'google_news_discovery', 'x_api');
create type public.source_tier as enum ('tier_1_official', 'tier_2_established_media', 'tier_3_discovery');
create type public.source_fetch_status as enum ('succeeded', 'failed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.app_role not null default 'editor',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  source_type public.source_type not null,
  tier public.source_tier not null,
  base_url text not null,
  feed_url text,
  enabled boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_discovery_tier_check check (
    (source_type = 'google_news_discovery' and tier = 'tier_3_discovery')
    or (source_type <> 'google_news_discovery' and tier <> 'tier_3_discovery')
  ),
  constraint sources_feed_url_check check (
    source_type = 'x_api' or feed_url is not null
  )
);

create unique index sources_feed_url_unique on public.sources (feed_url) where feed_url is not null;
create index sources_enabled_type_index on public.sources (enabled, source_type);

create table public.source_fetches (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  status public.source_fetch_status not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  http_status integer,
  items_found integer not null default 0 check (items_found >= 0),
  error_code text,
  safe_error_detail text,
  created_at timestamptz not null default now()
);

create index source_fetches_source_started_index on public.source_fetches (source_id, started_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid not null,
  action text not null check (char_length(action) between 1 and 160),
  before_json jsonb,
  after_json jsonb,
  reason text,
  occurred_at timestamptz not null default now()
);

create index audit_events_entity_occurred_index on public.audit_events (entity_type, entity_id, occurred_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger sources_set_updated_at
before update on public.sources
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.source_fetches enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles are readable by the owner or an admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "admins can update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create policy "active users can read sources"
on public.sources for select
using (public.is_active_user());

create policy "admins can create sources"
on public.sources for insert
with check (public.is_admin());

create policy "admins can update sources"
on public.sources for update
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete sources"
on public.sources for delete
using (public.is_admin());

create policy "active users can read source fetches"
on public.source_fetches for select
using (public.is_active_user());

create policy "admins can create source fetches"
on public.source_fetches for insert
with check (public.is_admin());

create policy "active users can read audit events"
on public.audit_events for select
using (public.is_active_user());

create policy "admins can insert audit events"
on public.audit_events for insert
with check (public.is_admin());

revoke update, delete on public.audit_events from anon, authenticated;
