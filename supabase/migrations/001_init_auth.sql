create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  student_number text unique,
  full_name text,
  display_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  profile_status text not null default 'draft' check (profile_status in ('draft', 'completed', 'submitted', 'approved', 'rejected')),
  year_level text,
  course_or_strand text,
  section text,
  bio text,
  quote text,
  avatar_url text,
  is_public boolean not null default false,
  resume_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
$$;

create or replace function public.protect_profile_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
    and not public.is_admin()
    and (
      new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.student_number is distinct from old.student_number
      or new.email is distinct from old.email
    ) then
    raise exception 'Only admins can change protected profile fields';
  end if;

  return new;
end;
$$;

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  template text not null default 'simple',
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  total_rows integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'completed_with_errors', 'failed')),
  error_file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer,
  email text,
  student_number text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.yearbook_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_student_number on public.profiles(student_number);
create index if not exists idx_profiles_role_status on public.profiles(role, status);
create index if not exists idx_profiles_profile_status on public.profiles(profile_status);
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_import_batches_admin_id on public.import_batches(admin_id);
create index if not exists idx_import_errors_batch_id on public.import_errors(batch_id);

drop trigger if exists protect_profiles_protected_fields on public.profiles;

create trigger protect_profiles_protected_fields
before update on public.profiles
for each row
execute function public.protect_profile_protected_fields();

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;

create trigger set_resumes_updated_at
before update on public.resumes
for each row
execute function public.set_updated_at();

drop trigger if exists set_import_batches_updated_at on public.import_batches;

create trigger set_import_batches_updated_at
before update on public.import_batches
for each row
execute function public.set_updated_at();

drop trigger if exists set_yearbook_settings_updated_at on public.yearbook_settings;

create trigger set_yearbook_settings_updated_at
before update on public.yearbook_settings
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name_value text;
  student_number_value text;
begin
  student_number_value = new.raw_user_meta_data ->> 'student_number';

  display_name_value = coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'display_name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (
    id,
    email,
    student_number,
    full_name,
    display_name,
    role,
    status,
    profile_status
  )
  values (
    new.id,
    new.email,
    student_number_value,
    display_name_value,
    display_name_value,
    'user',
    'active',
    'draft'
  )
  on conflict (id) do update
  set email = excluded.email,
      student_number = coalesce(excluded.student_number, public.profiles.student_number);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_errors enable row level security;
alter table public.yearbook_settings enable row level security;

create policy "authenticated users can read public profiles"
on public.profiles
for select
to authenticated
using (is_public = true);

create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update own profile fields"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can read public resumes"
on public.resumes
for select
to authenticated
using (is_public = true);

create policy "users can read own resumes"
on public.resumes
for select
to authenticated
using (user_id = auth.uid());

create policy "admins can read all resumes"
on public.resumes
for select
to authenticated
using (public.is_admin());

create policy "users can insert own resumes"
on public.resumes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "users can update own resumes"
on public.resumes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users can delete own resumes"
on public.resumes
for delete
to authenticated
using (user_id = auth.uid());

create policy "admins can update all resumes"
on public.resumes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete all resumes"
on public.resumes
for delete
to authenticated
using (public.is_admin());

create policy "admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

create policy "authenticated users can insert own audit logs"
on public.audit_logs
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

create policy "admins can read import batches"
on public.import_batches
for select
to authenticated
using (public.is_admin());

create policy "admins can insert import batches"
on public.import_batches
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update import batches"
on public.import_batches
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read import errors"
on public.import_errors
for select
to authenticated
using (public.is_admin());

create policy "admins can insert import errors"
on public.import_errors
for insert
to authenticated
with check (public.is_admin());

create policy "admins can read yearbook settings"
on public.yearbook_settings
for select
to authenticated
using (public.is_admin());

create policy "admins can insert yearbook settings"
on public.yearbook_settings
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update yearbook settings"
on public.yearbook_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('resumes', 'resumes', false),
  ('yearbook-photos', 'yearbook-photos', true),
  ('import-files', 'import-files', false)
on conflict (id) do update
set public = excluded.public;

create policy "avatar images are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can read public yearbook photos"
on storage.objects
for select
using (bucket_id = 'yearbook-photos');

create policy "admins can upload yearbook photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'yearbook-photos'
  and public.is_admin()
);

create policy "admins can update yearbook photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'yearbook-photos'
  and public.is_admin()
);

create policy "admins can delete yearbook photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'yearbook-photos'
  and public.is_admin()
);

create policy "admins can read import files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'import-files'
  and public.is_admin()
);

create policy "admins can upload import files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'import-files'
  and public.is_admin()
);

create policy "admins can delete import files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'import-files'
  and public.is_admin()
);

insert into public.yearbook_settings (key, value)
values
  ('public_yearbook_enabled', 'true'::jsonb),
  ('require_profile_approval', 'true'::jsonb)
on conflict (key) do update
set value = excluded.value;
