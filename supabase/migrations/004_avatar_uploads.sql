create table if not exists public.avatar_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  old_avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_avatar_uploads_user_id on public.avatar_uploads(user_id);
create index if not exists idx_avatar_uploads_created_at on public.avatar_uploads(created_at desc);

alter table public.avatar_uploads enable row level security;

create policy "users can read own avatar uploads"
on public.avatar_uploads
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own avatar uploads"
on public.avatar_uploads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "admins can read all avatar uploads"
on public.avatar_uploads
for select
to authenticated
using (public.is_admin());

create policy "admins can insert avatar uploads"
on public.avatar_uploads
for insert
to authenticated
with check (public.is_admin());