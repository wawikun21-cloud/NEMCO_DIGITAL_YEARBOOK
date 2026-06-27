-- Add department and batch columns to flipbook_pdf_pages for edition categorization
alter table public.flipbook_pdf_pages
  add column if not exists department text,
  add column if not exists batch text;

-- Create composite index for efficient filtering
create index if not exists idx_flipbook_pdf_pages_dept_batch
  on public.flipbook_pdf_pages(department, batch, is_active);