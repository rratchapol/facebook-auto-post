-- Slice 2: immutable source evidence, story grouping, transparent scoring, and job observability.

create type public.source_item_status as enum ('new', 'grouped', 'ignored');
create type public.story_status as enum ('candidate', 'selected', 'dismissed', 'archived');

create table public.source_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text,
  canonical_url text not null,
  title text not null check (char_length(title) between 1 and 1000),
  excerpt text,
  publisher_published_at timestamptz,
  fetched_at timestamptz not null default now(),
  content_hash text not null,
  status public.source_item_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, canonical_url)
);

create unique index source_items_source_external_id_unique
on public.source_items (source_id, external_id)
where external_id is not null;
create index source_items_source_fetched_index on public.source_items (source_id, fetched_at desc);
create index source_items_published_index on public.source_items (publisher_published_at desc nulls last);

create table public.story_groups (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'other',
  status public.story_status not null default 'candidate',
  dedupe_key text not null,
  normalized_title text not null,
  highest_tier public.source_tier not null,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  score integer not null default 0 check (score between 0 and 100),
  score_explanation text not null,
  recommended_at timestamptz,
  selected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index story_groups_dedupe_key_unique on public.story_groups (dedupe_key);
create index story_groups_candidate_score_index on public.story_groups (status, score desc, created_at desc);

create table public.story_evidence (
  story_id uuid not null references public.story_groups (id) on delete cascade,
  source_item_id uuid not null references public.source_items (id) on delete restrict,
  evidence_role text not null check (evidence_role in ('discovery', 'primary', 'supporting')),
  linked_at timestamptz not null default now(),
  primary key (story_id, source_item_id)
);

create index story_evidence_story_role_index on public.story_evidence (story_id, evidence_role);

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  idempotency_key text not null unique,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  counters_json jsonb not null default '{}'::jsonb,
  safe_error_detail text,
  created_at timestamptz not null default now()
);

create index job_runs_name_started_index on public.job_runs (job_name, started_at desc);

create trigger source_items_set_updated_at
before update on public.source_items
for each row execute procedure public.set_updated_at();

create trigger story_groups_set_updated_at
before update on public.story_groups
for each row execute procedure public.set_updated_at();

alter table public.source_items enable row level security;
alter table public.story_groups enable row level security;
alter table public.story_evidence enable row level security;
alter table public.job_runs enable row level security;

create policy "active users can read source items"
on public.source_items for select
using (public.is_active_user());

create policy "active users can read story groups"
on public.story_groups for select
using (public.is_active_user());

create policy "active users can read story evidence"
on public.story_evidence for select
using (public.is_active_user());

create policy "admins can read job runs"
on public.job_runs for select
using (public.is_admin());
