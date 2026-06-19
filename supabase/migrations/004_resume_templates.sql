create table if not exists public.resume_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  default_sections jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.resume_templates(id) on delete cascade,
  section_key text not null,
  label text not null,
  description text,
  icon text,
  field_type text not null default 'text' check (field_type in ('text', 'textarea', 'list', 'date_range', 'education', 'experience', 'skills', 'achievements', 'references')),
  is_required boolean not null default false,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_id, section_key)
);

create index if not exists idx_resume_templates_slug on public.resume_templates(slug);
create index if not exists idx_resume_templates_active on public.resume_templates(is_active);
create index if not exists idx_resume_sections_template on public.resume_sections(template_id);
create index if not exists idx_resume_sections_order on public.resume_sections(template_id, sort_order);

drop trigger if exists set_resume_templates_updated_at on public.resume_templates;

create trigger set_resume_templates_updated_at
before update on public.resume_templates
for each row
execute function public.set_updated_at();

drop trigger if exists set_resume_sections_updated_at on public.resume_sections;

create trigger set_resume_sections_updated_at
before update on public.resume_sections
for each row
execute function public.set_updated_at();

alter table public.resume_templates enable row level security;
alter table public.resume_sections enable row level security;

create policy "admins can read resume templates"
on public.resume_templates
for select
to authenticated
using (true);

create policy "admins can insert resume templates"
on public.resume_templates
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update resume templates"
on public.resume_templates
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete resume templates"
on public.resume_templates
for delete
to authenticated
using (public.is_admin());

create policy "admins can read resume sections"
on public.resume_sections
for select
to authenticated
using (true);

create policy "admins can insert resume sections"
on public.resume_sections
for insert
to authenticated
with check (public.is_admin());

create policy "admins can update resume sections"
on public.resume_sections
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete resume sections"
on public.resume_sections
for delete
to authenticated
using (public.is_admin());

insert into public.resume_templates (name, slug, description, default_sections, is_active, is_default, sort_order)
values
  (
    'Simple',
    'simple',
    'A clean, minimal resume template with essential sections.',
    '[
      {"key": "personal", "label": "Personal Information", "field_type": "text", "sort_order": 1, "is_required": true},
      {"key": "objective", "label": "Objective / Summary", "field_type": "textarea", "sort_order": 2, "is_required": false},
      {"key": "education", "label": "Education", "field_type": "education", "sort_order": 3, "is_required": true},
      {"key": "skills", "label": "Skills", "field_type": "skills", "sort_order": 4, "is_required": true},
      {"key": "experience", "label": "Work Experience", "field_type": "experience", "sort_order": 5, "is_required": false},
      {"key": "achievements", "label": "Achievements", "field_type": "achievements", "sort_order": 6, "is_required": false}
    ]'::jsonb,
    true,
    true,
    1
  ),
  (
    'Modern',
    'modern',
    'A contemporary template with projects and organizations sections.',
    '[
      {"key": "personal", "label": "Personal Information", "field_type": "text", "sort_order": 1, "is_required": true},
      {"key": "objective", "label": "Professional Summary", "field_type": "textarea", "sort_order": 2, "is_required": true},
      {"key": "education", "label": "Education", "field_type": "education", "sort_order": 3, "is_required": true},
      {"key": "skills", "label": "Technical Skills", "field_type": "skills", "sort_order": 4, "is_required": true},
      {"key": "experience", "label": "Work Experience", "field_type": "experience", "sort_order": 5, "is_required": false},
      {"key": "projects", "label": "Projects", "field_type": "list", "sort_order": 6, "is_required": false},
      {"key": "organizations", "label": "Organizations", "field_type": "list", "sort_order": 7, "is_required": false},
      {"key": "references", "label": "References", "field_type": "references", "sort_order": 8, "is_required": false}
    ]'::jsonb,
    true,
    false,
    2
  ),
  (
    'Classic',
    'classic',
    'A traditional resume format with all standard sections.',
    '[
      {"key": "personal", "label": "Personal Information", "field_type": "text", "sort_order": 1, "is_required": true},
      {"key": "objective", "label": "Career Objective", "field_type": "textarea", "sort_order": 2, "is_required": true},
      {"key": "education", "label": "Education", "field_type": "education", "sort_order": 3, "is_required": true},
      {"key": "experience", "label": "Work Experience", "field_type": "experience", "sort_order": 4, "is_required": true},
      {"key": "skills", "label": "Skills & Competencies", "field_type": "skills", "sort_order": 5, "is_required": true},
      {"key": "achievements", "label": "Achievements & Awards", "field_type": "achievements", "sort_order": 6, "is_required": false},
      {"key": "organizations", "label": "Organizations & Affiliations", "field_type": "list", "sort_order": 7, "is_required": false},
      {"key": "references", "label": "References", "field_type": "references", "sort_order": 8, "is_required": false}
    ]'::jsonb,
    true,
    false,
    3
  )
on conflict (slug) do nothing;

insert into public.resume_sections (template_id, section_key, label, field_type, is_required, sort_order)
select id, 'personal', 'Personal Information', 'text', true, 1
from public.resume_templates where slug = 'simple'
on conflict (template_id, section_key) do nothing;

insert into public.resume_sections (template_id, section_key, label, field_type, is_required, sort_order)
select id, 'objective', 'Objective / Summary', 'textarea', false, 2
from public.resume_templates where slug = 'simple'
on conflict (template_id, section_key) do nothing;

insert into public.resume_sections (template_id, section_key, label, field_type, is_required, sort_order)
select id, 'education', 'Education', 'education', true, 3
from public.resume_templates where slug = 'simple'
on conflict (template_id, section_key) do nothing;

insert into public.resume_sections (template_id, section_key, label, field_type, is_required, sort_order)
select id, 'skills', 'Skills', 'skills', true, 4
from public.resume_templates where slug = 'simple'
on conflict (template_id, section_key) do nothing;

insert into public.resume_sections (template_id, section_key, label, field_type, is_required, sort_order)
select id, 'experience', 'Work Experience', 'experience', false, 5
from public.resume_templates where slug = 'simple'
on conflict (template_id, section_key) do nothing;

insert into public.resume_sections (template_id, section_key, label, field_type, is_required, sort_order)
select id, 'achievements', 'Achievements', 'achievements', false, 6
from public.resume_templates where slug = 'simple'
on conflict (template_id, section_key) do nothing;
