do $$
declare
  admin_user_id uuid;
  sample_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where email = 'admin@nemco.test';

  if admin_user_id is null then
    admin_user_id := gen_random_uuid();
    insert into auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      role,
      instance_id,
      aud
    )
    values (
      admin_user_id,
      'admin@nemco.test',
      crypt('NemcoYearbook@123', gen_salt('bf')),
      now(),
      '{"full_name":"Admin User","display_name":"Admin","student_number":"ADMIN-0001"}'::jsonb,
      'authenticated'::text,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated'::text
    );
  end if;

  select id into sample_user_id
  from auth.users
  where email = 'user@nemco.test';

  if sample_user_id is null then
    sample_user_id := gen_random_uuid();
    insert into auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      role,
      instance_id,
      aud
    )
    values (
      sample_user_id,
      'user@nemco.test',
      crypt('NemcoYearbook@123', gen_salt('bf')),
      now(),
      '{"full_name":"Sample User","display_name":"Sample User","student_number":"2026-0001"}'::jsonb,
      'authenticated'::text,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated'::text
    );
  end if;

  insert into public.profiles (
    id,
    email,
    student_number,
    full_name,
    display_name,
    role,
    status,
    profile_status,
    year_level,
    course_or_strand,
    section,
    bio,
    quote,
    is_public,
    resume_public
  )
  values (
    admin_user_id,
    'admin@nemco.test',
    'ADMIN-0001',
    'Admin User',
    'Admin',
    'admin',
    'active',
    'approved',
    null,
    null,
    null,
    'System administrator account',
    'Managing the digital yearbook',
    true,
    false
  )
  on conflict (id) do update
  set email = excluded.email,
      student_number = excluded.student_number,
      full_name = excluded.full_name,
      display_name = excluded.display_name,
      role = excluded.role,
      status = excluded.status,
      profile_status = excluded.profile_status,
      bio = excluded.bio,
      quote = excluded.quote,
      is_public = excluded.is_public,
      resume_public = excluded.resume_public,
      updated_at = now();

  insert into public.profiles (
    id,
    email,
    student_number,
    full_name,
    display_name,
    role,
    status,
    profile_status,
    year_level,
    course_or_strand,
    section,
    bio,
    quote,
    is_public,
    resume_public
  )
  values (
    sample_user_id,
    'user@nemco.test',
    '2026-0001',
    'Sample User',
    'Sample User',
    'user',
    'active',
    'approved',
    '4th Year',
    'BS Information Technology',
    'Section A',
    'Sample student profile for testing the digital yearbook.',
    'Building memories one page at a time.',
    true,
    true
  )
  on conflict (id) do update
  set email = excluded.email,
      student_number = excluded.student_number,
      full_name = excluded.full_name,
      display_name = excluded.display_name,
      role = excluded.role,
      status = excluded.status,
      profile_status = excluded.profile_status,
      year_level = excluded.year_level,
      course_or_strand = excluded.course_or_strand,
      section = excluded.section,
      bio = excluded.bio,
      quote = excluded.quote,
      is_public = excluded.is_public,
      resume_public = excluded.resume_public,
      updated_at = now();

  raise notice 'Sample admin created. Student ID: ADMIN-0001 / Password: NemcoYearbook@123';
  raise notice 'Sample user created. Student ID: 2026-0001 / Password: NemcoYearbook@123';
end $$;

select
  p.email,
  p.role,
  p.status,
  p.student_number,
  p.full_name,
  p.display_name,
  p.profile_status
from public.profiles p
where p.email in ('admin@nemco.test', 'user@nemco.test')
order by p.role desc, p.email asc;
