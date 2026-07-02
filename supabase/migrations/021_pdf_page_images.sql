-- Store pre-rendered page images for PDFs to avoid client-side rasterization
-- Each PDF page can have multiple rendered images at different scales/DPI levels

create table if not exists public.flipbook_pdf_page_images (
  id uuid primary key default gen_random_uuid(),
  pdf_page_id uuid not null references public.flipbook_pdf_pages(id) on delete cascade,
  page_num integer not null,
  image_url text not null,
  image_path text,
  width numeric,
  height numeric,
  scale numeric default 1.0,
  format text default 'webp',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(pdf_page_id, page_num, scale)
);

create index if not exists idx_flipbook_pdf_page_images_pdf_page
  on public.flipbook_pdf_page_images(pdf_page_id);

create index if not exists idx_flipbook_pdf_page_images_page_num
  on public.flipbook_pdf_page_images(pdf_page_id, page_num);

create index if not exists idx_flipbook_pdf_page_images_scale
  on public.flipbook_pdf_page_images(pdf_page_id, scale);

-- Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists trigger_update_flipbook_pdf_page_images_updated_at on flipbook_pdf_page_images;
create trigger trigger_update_flipbook_pdf_page_images_updated_at
  before update on flipbook_pdf_page_images
  for each row execute function update_updated_at_column();