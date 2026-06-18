create or replace function public.set_audit_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  return new;
end;
$$;

create trigger if not exists set_audit_logs_updated_at
before update on public.audit_logs
for each row
execute function public.set_updated_at();

create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_entity_id on public.audit_logs(entity_id);