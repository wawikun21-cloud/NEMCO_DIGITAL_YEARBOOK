-- Yearbook Main edition support
-- Tags a PDF page as the always-first "YEARBOOK MAIN" edition so the flipbook opens
-- with it regardless of the student's selected course. Pages with edition='main'
-- are excluded from the normal course/strand + batch filtering so the main yearbook
-- never collides with course-scoped editions.

alter table public.flipbook_pdf_pages
  add column if not exists edition text not null default 'course';

update public.flipbook_pdf_pages
   set edition = 'course'
 where edition IS NULL;

create index if not exists idx_flipbook_pdf_pages_edition
  on public.flipbook_pdf_pages(edition, is_active);

create index if not exists idx_flipbook_pdf_pages_main_lookup
  on public.flipbook_pdf_pages(edition, is_active, sort_order)
  where edition = 'main' AND is_active = true;
