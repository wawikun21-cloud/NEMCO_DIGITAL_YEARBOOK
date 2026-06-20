alter table profiles
  add column if not exists qr_data text,
  add column if not exists contact_number text,
  add column if not exists website text,
  add column if not exists home_address text,
  add column if not exists school text,
  add column if not exists about_me text,
  add column if not exists skills text[] default '{}',
  add column if not exists year_graduated text;