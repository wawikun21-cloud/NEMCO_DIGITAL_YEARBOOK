-- PDF Flipbook Pages Migration
-- Stores PDF files uploaded as flipbook pages with page extraction info

create table if not exists public.flipbook_pdf_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled PDF',
  description text,
  file_url text not null,
  file_name text not null,
  file_size bigint,
  page_count integer default 0,
  cover_image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_flipbook_pdf_pages_sort on public.flipbook_pdf_pages(sort_order);
create index if not exists idx_flipbook_pdf_pages_active on public.flipbook_pdf_pages(is_active);

-- Add trigger for updated_at
drop trigger if exists set_flipbook_pdf_pages_updated_at on public.flipbook_pdf_pages;

create trigger set_flipbook_pdf_pages_updated_at
before update on public.flipbook_pdf_pages
for each row
execute function public.set_updated_at();

-- Enable RLS
alter table public.flipbook_pdf_pages enable row level security;

-- RLS Policies
create policy "admins can read pdf pages"
on public.flipbook_pdf_pages
for select
to authenticated
using (true);

create policy "admins can insert pdf pages"
on public.flipbook_pdf_pages
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update pdf pages"
on public.flipbook_pdf_pages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete pdf pages"
on public.flipbook_pdf_pages
for delete
to authenticated
using (public.is_admin());

-- Add flipbook source type setting
insert into public.flipbook_settings (key, value)
values ('source_type', '{"source_type": "profiles"}'::jsonb)
on conflict (key) do update
set value = excluded.value;

-- Add PDF viewer settings
insert into public.flipbook_settings (key, value)
values 
  ('pdf_viewer_type', '{"pdf_viewer_type": "3d"}'::jsonb),
  ('pdf_page_width', '{"pdf_page_width": 595}'::jsonb),
  ('pdf_page_height', '{"pdf_page_height": 842}'::jsonb),
  ('pdf_quality', '{"pdf_quality": "high"}'::jsonb)
on conflict (key) do update
set value = excluded.value;
