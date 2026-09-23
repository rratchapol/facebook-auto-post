-- Slice 3: versioned editorial drafts, prompt/brand defaults, approval, and scheduling.

create type public.prompt_kind as enum ('base', 'preset');
create type public.version_status as enum ('draft', 'active', 'retired');
create type public.asset_origin as enum ('ai_generated', 'uploaded', 'derived');
create type public.post_status as enum ('drafting', 'pending_approval', 'needs_revision', 'approved', 'scheduled', 'publishing', 'published', 'needs_attention', 'removed');
create type public.generation_kind as enum ('ranking', 'caption', 'image');
create type public.generation_status as enum ('requested', 'succeeded', 'failed', 'quota_exceeded');
create type public.approval_decision as enum ('approved', 'returned');

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  kind public.prompt_kind not null,
  name text not null check (char_length(name) between 2 and 120),
  body text not null check (char_length(body) between 1 and 20000),
  status public.version_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  activated_at timestamptz,
  supersedes_id uuid references public.prompt_versions (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index one_active_base_prompt on public.prompt_versions (kind) where kind = 'base' and status = 'active';
create index prompt_versions_kind_status_index on public.prompt_versions (kind, status, created_at desc);

create table public.brand_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  page_name text not null,
  palette_json jsonb not null default '[]'::jsonb,
  font_config_json jsonb not null default '{}'::jsonb,
  caption_footer text not null default '',
  status public.version_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index one_active_brand on public.brand_versions (status) where status = 'active';

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  mime_type text not null,
  width integer,
  height integer,
  sha256 text,
  origin public.asset_origin not null,
  created_at timestamptz not null default now()
);

create table public.editorial_posts (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.story_groups (id) on delete restrict,
  status public.post_status not null default 'drafting',
  current_version_id uuid,
  scheduled_for timestamptz,
  is_breaking boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index editorial_posts_status_schedule_index on public.editorial_posts (status, scheduled_for);

create table public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.editorial_posts (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  headline text not null default '',
  caption text not null default '',
  why_it_matters text not null default '',
  hashtags_json jsonb not null default '[]'::jsonb,
  primary_source_item_id uuid references public.source_items (id) on delete restrict,
  image_asset_id uuid references public.assets (id) on delete restrict,
  base_prompt_version_id uuid references public.prompt_versions (id) on delete restrict,
  preset_version_id uuid references public.prompt_versions (id) on delete restrict,
  brand_version_id uuid references public.brand_versions (id) on delete restrict,
  instruction text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (post_id, version_number)
);

alter table public.editorial_posts
add constraint editorial_posts_current_version_fkey
foreign key (current_version_id) references public.post_versions (id) on delete restrict;

create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.editorial_posts (id) on delete cascade,
  kind public.generation_kind not null,
  status public.generation_status not null default 'requested',
  provider text,
  model text,
  input_fingerprint text,
  output_asset_id uuid references public.assets (id) on delete set null,
  safe_output_summary text,
  cost_json jsonb not null default '{}'::jsonb,
  attempt_number integer not null default 1 check (attempt_number > 0),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.editorial_posts (id) on delete cascade,
  post_version_id uuid not null references public.post_versions (id) on delete restrict,
  decision public.approval_decision not null,
  decided_by uuid not null references public.profiles (id) on delete restrict,
  decided_at timestamptz not null default now(),
  note text
);

create index approvals_post_version_index on public.approvals (post_id, post_version_id, decided_at desc);

create trigger editorial_posts_set_updated_at
before update on public.editorial_posts
for each row execute procedure public.set_updated_at();

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_approver_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and role in ('admin', 'approver')
  );
$$;

alter table public.prompt_versions enable row level security;
alter table public.brand_versions enable row level security;
alter table public.assets enable row level security;
alter table public.editorial_posts enable row level security;
alter table public.post_versions enable row level security;
alter table public.generation_runs enable row level security;
alter table public.approvals enable row level security;

create policy "active users can read prompt versions" on public.prompt_versions for select using (public.is_active_user());
create policy "admins can manage prompt versions" on public.prompt_versions for all using (public.is_admin()) with check (public.is_admin());
create policy "active users can read brand versions" on public.brand_versions for select using (public.is_active_user());
create policy "admins can manage brand versions" on public.brand_versions for all using (public.is_admin()) with check (public.is_admin());
create policy "active users can read assets" on public.assets for select using (public.is_active_user());
create policy "editors can manage assets" on public.assets for all using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "active users can read editorial posts" on public.editorial_posts for select using (public.is_active_user());
create policy "editors can create editorial posts" on public.editorial_posts for insert with check (public.is_editor_or_admin());
create policy "editors can update editorial posts" on public.editorial_posts for update using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "active users can read post versions" on public.post_versions for select using (public.is_active_user());
create policy "editors can create post versions" on public.post_versions for insert with check (public.is_editor_or_admin());
create policy "active users can read generation runs" on public.generation_runs for select using (public.is_active_user());
create policy "editors can manage generation runs" on public.generation_runs for all using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());
create policy "active users can read approvals" on public.approvals for select using (public.is_active_user());
create policy "approvers can create approvals" on public.approvals for insert with check (public.is_approver_or_admin());

create policy "admins can select story groups" on public.story_groups for update using (public.is_admin()) with check (public.is_admin());

insert into public.prompt_versions (kind, name, body, status, activated_at)
values
  ('base', 'กติกาหลัก v1', 'เขียนข่าวกีฬาเป็นภาษาไทยแบบเป็นกลาง กระชับ และไม่พาดหัวเกินจริง ใช้เฉพาะข้อเท็จจริงจากหลักฐานที่ให้มา ห้ามชวนพนัน ระบุแหล่งที่มาพร้อมลิงก์ และไม่สร้างข้ออ้างที่หลักฐานไม่รองรับ', 'active', now()),
  ('preset', 'สรุปข่าวเช้า', 'รูปแบบ: พาดหัวหนึ่งบรรทัด, สรุป 6–7 บรรทัด, ทำไมเรื่องนี้สำคัญหนึ่งบรรทัด, ที่มาและลิงก์, hashtag ไม่เกิน 3 คำ', 'active', now());

insert into public.brand_versions (name, page_name, palette_json, font_config_json, caption_footer, status, activated_at)
values ('ธีมเริ่มต้น', 'Sports News Admin', '["#0b67d4", "#102542", "#f5f7fb"]'::jsonb, '{"font":"Noto Sans Thai"}'::jsonb, 'ที่มา: ลิงก์ต้นฉบับ', 'active', now());
