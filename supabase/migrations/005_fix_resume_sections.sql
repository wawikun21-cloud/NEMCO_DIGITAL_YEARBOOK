-- ============================================================
-- 005_fix_resume_sections.sql
--
-- Fixes two bugs from migration 004:
--   1. field_type CHECK constraint did not include 'personal'
--   2. personal sections were stored as field_type='text'
--      so extractPersonal() received a string, not an object
-- ============================================================

-- ── 1. Widen the CHECK constraint to include 'personal' ─────
alter table public.resume_sections
  drop constraint if exists resume_sections_field_type_check;

alter table public.resume_sections
  add constraint resume_sections_field_type_check
  check (field_type in (
    'personal',       -- ← added: structured name/email/phone/etc.
    'text',
    'textarea',
    'list',
    'date_range',
    'education',
    'experience',
    'skills',
    'achievements',
    'references'
  ));

-- ── 2. Fix existing rows: personal sections must use field_type='personal' ─
update public.resume_sections
set
  field_type = 'personal',
  updated_at = now()
where section_key = 'personal'
  and field_type != 'personal';

-- Also fix the stale personal-information key if it exists
update public.resume_sections
set
  section_key = 'personal',
  field_type  = 'personal',
  updated_at  = now()
where section_key = 'personal-information';

-- ── 3. Fix default_sections JSONB on the templates table ────
--    (used when new resume sections are seeded from the template)
update public.resume_templates
set
  default_sections = (
    select jsonb_agg(
      case
        when (s->>'key') = 'personal'
          then jsonb_set(s, '{field_type}', '"personal"')
        else s
      end
    )
    from jsonb_array_elements(default_sections) as s
  ),
  updated_at = now()
where slug in ('simple', 'classic', 'modern');

-- ── 4. Ensure all three templates have a personal section ───
insert into public.resume_sections
  (template_id, section_key, label, description, field_type, is_required, sort_order, config)
select
  t.id,
  'personal',
  'Personal Information',
  'Your full name, job title, email, phone, location and LinkedIn',
  'personal',
  true,
  0,                -- sort_order 0 → always first
  '{}'::jsonb
from public.resume_templates t
where t.slug in ('simple', 'classic', 'modern')
on conflict (template_id, section_key) do update
  set
    field_type  = 'personal',
    is_required = true,
    sort_order  = 0,
    updated_at  = now();

-- ── 5. Verify ───────────────────────────────────────────────
-- Run this SELECT after applying to confirm all looks correct:
--
-- select t.slug, s.section_key, s.field_type, s.is_required, s.sort_order
-- from public.resume_sections s
-- join public.resume_templates t on t.id = s.template_id
-- order by t.slug, s.sort_order;
