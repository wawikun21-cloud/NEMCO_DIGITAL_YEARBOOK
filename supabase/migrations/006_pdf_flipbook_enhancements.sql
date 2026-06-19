-- PDF Flipbook Enhancements Migration
-- 1. Add uploaded_by population trigger
-- 2. Add pdf_page_renderings table for client-side canvas snapshots
-- 3. Add section_name to pdf_pages for organizing alongside profiles
-- 4. Add page_order alias column for unified ordering with profiles

-- Add section_name to PDF pages so they can be grouped like profile pages
alter table public.flipbook_pdf_pages
  add column if not exists section_name text;

-- Add a file_path column to track the Supabase storage path (useful for deletions/cleanup)
alter table public.flipbook_pdf_pages
  add column if not exists file_path text;

create index if not exists idx_flipbook_pdf_pages_section on public.flipbook_pdf_pages(section_name);

-- Table to store per-page render cache (canvas data URLs) for fast flipbook rendering
-- This avoids re-rendering PDFs on every page flip
create table if not exists public.flipbook_pdf_page_renderings (
  id uuid primary key default gen_random_uuid(),
  pdf_page_id uuid not null references public.flipbook_pdf_pages(id) on delete cascade,
  page_number integer not null,
  rendered_image_url text,
  rendered_width integer default 595,
  rendered_height integer default 842,
  created_at timestamptz not null default now(),
  unique(pdf_page_id, page_number)
);

create index if not exists idx_flipbook_pdf_renderings_pdf on public.flipbook_pdf_page_renderings(pdf_page_id);

alter table public.flipbook_pdf_page_renderings enable row level security;

create policy "anyone can read pdf renderings"
on public.flipbook_pdf_page_renderings
for select
to authenticated
using (true);

create policy "admins can manage pdf renderings"
on public.flipbook_pdf_page_renderings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Seed the combined source type if not present
insert into public.flipbook_settings (key, value)
values ('source_type', '{"source_type": "profiles"}'::jsonb)
on conflict (key) do nothing;
