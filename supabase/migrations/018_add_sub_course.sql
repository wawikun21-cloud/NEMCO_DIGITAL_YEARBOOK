alter table public.profiles
  add column if not exists sub_course text;

create index if not exists idx_profiles_sub_course on public.profiles(sub_course);
