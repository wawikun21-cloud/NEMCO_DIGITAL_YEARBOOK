create table if not exists public.flipbook_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flipbook_sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.flipbook_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  section_name text,
  page_order integer not null default 0,
  layout_template text not null default 'default',
  is_included boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

create index if not exists idx_flipbook_profiles_profile_id on public.flipbook_profiles(profile_id);
create index if not exists idx_flipbook_profiles_section on public.flipbook_profiles(section_name);
create index if not exists idx_flipbook_profiles_order on public.flipbook_profiles(page_order);
create index if not exists idx_flipbook_sections_order on public.flipbook_sections(sort_order);

drop trigger if exists set_flipbook_settings_updated_at on public.flipbook_settings;

create trigger set_flipbook_settings_updated_at
before update on public.flipbook_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_flipbook_profiles_updated_at on public.flipbook_profiles;

create trigger set_flipbook_profiles_updated_at
before update on public.flipbook_profiles
for each row
execute function public.set_updated_at();

alter table public.flipbook_settings enable row level security;
alter table public.flipbook_sections enable row level security;
alter table public.flipbook_profiles enable row level security;

create policy "admins can read flipbook settings"
on public.flipbook_settings
for select
to authenticated
using (public.is_admin());

create policy "admins can insert flipbook settings"
on public.flipbook_settings
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update flipbook settings"
on public.flipbook_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "anyone can read flipbook settings for public view"
on public.flipbook_settings
for select
to authenticated
using (true);

create policy "admins can read flipbook sections"
on public.flipbook_sections
for select
to authenticated
using (true);

create policy "admins can insert flipbook sections"
on public.flipbook_sections
for insert
to authenticated
with check (public.is_admin());

create policy "admins can delete flipbook sections"
on public.flipbook_sections
for delete
to authenticated
using (public.is_admin());

create policy "admins can read flipbook profiles"
on public.flipbook_profiles
for select
to authenticated
using (true);

create policy "admins can insert flipbook profiles"
on public.flipbook_profiles
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update flipbook profiles"
on public.flipbook_profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete flipbook profiles"
on public.flipbook_profiles
for delete
to authenticated
using (public.is_admin());

insert into public.flipbook_settings (key, value)
values
  ('enabled', '{"enabled": true}'::jsonb),
  ('title', '{"title": "NEMCO Digital Yearbook"}'::jsonb),
  ('subtitle', '{"subtitle": "Academic Year 2025-2026"}'::jsonb),
  ('cover_url', '{"cover_url": ""}'::jsonb),
  ('theme', '{"theme": "default"}'::jsonb),
  ('flip_speed', '{"flip_speed": 0.5}'::jsonb),
  ('show_page_numbers', '{"show_page_numbers": true}'::jsonb),
  ('auto_flip', '{"auto_flip": false}'::jsonb),
  ('auto_flip_interval', '{"auto_flip_interval": 10}'::jsonb)
on conflict (key) do update
set value = excluded.value;
