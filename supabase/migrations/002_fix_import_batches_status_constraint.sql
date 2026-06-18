alter table public.import_batches drop constraint if exists import_batches_status_check;

alter table public.import_batches add constraint import_batches_status_check
check (status in ('pending', 'processing', 'completed', 'completed_with_errors', 'failed'));