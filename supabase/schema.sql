-- BGPI schema for a dedicated Supabase project.
-- Review the target project before applying. Do not run against the Gadgets BD project.
-- This migration creates BGPI-prefixed tables and does not drop existing tables.
create extension if not exists pgcrypto;

create table if not exists public.bgpi_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','admin','editor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bgpi_faculty (
  id uuid primary key default gen_random_uuid(),
  name_bn text not null,
  name_en text,
  designation_bn text not null,
  designation_en text,
  department text not null,
  email text,
  phone text,
  photo_url text,
  profile_url text,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bgpi_faculty add column if not exists profile_url text;

create table if not exists public.bgpi_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  publication_date date,
  attachment_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bgpi_departments (
  id uuid primary key default gen_random_uuid(),
  name_bn text not null,
  name_en text not null unique,
  description text,
  image_or_icon text,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bgpi_notices_public_date_idx on public.bgpi_notices (published, publication_date desc);
create index if not exists bgpi_faculty_public_sort_idx on public.bgpi_faculty (published, sort_order, name_bn);
create index if not exists bgpi_departments_public_sort_idx on public.bgpi_departments (published, display_order);

create or replace function public.bgpi_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bgpi_admin_users a
    where a.user_id = (select auth.uid()) and a.active = true
  );
$$;
revoke all on function public.bgpi_is_admin() from public;
grant execute on function public.bgpi_is_admin() to anon, authenticated;

create or replace function public.bgpi_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bgpi_faculty_touch_updated_at on public.bgpi_faculty;
create trigger bgpi_faculty_touch_updated_at before update on public.bgpi_faculty for each row execute function public.bgpi_touch_updated_at();
drop trigger if exists bgpi_notices_touch_updated_at on public.bgpi_notices;
create trigger bgpi_notices_touch_updated_at before update on public.bgpi_notices for each row execute function public.bgpi_touch_updated_at();
drop trigger if exists bgpi_departments_touch_updated_at on public.bgpi_departments;
create trigger bgpi_departments_touch_updated_at before update on public.bgpi_departments for each row execute function public.bgpi_touch_updated_at();

alter table public.bgpi_admin_users enable row level security;
alter table public.bgpi_faculty enable row level security;
alter table public.bgpi_notices enable row level security;
alter table public.bgpi_departments enable row level security;

drop policy if exists "bgpi_admins_read_own_admin_record" on public.bgpi_admin_users;
create policy "bgpi_admins_read_own_admin_record" on public.bgpi_admin_users
for select to authenticated using (user_id = (select auth.uid()) or public.bgpi_is_admin());
drop policy if exists "bgpi_admins_manage_admins" on public.bgpi_admin_users;
create policy "bgpi_admins_manage_admins" on public.bgpi_admin_users
for all to authenticated using (public.bgpi_is_admin()) with check (public.bgpi_is_admin());

drop policy if exists "bgpi_public_read_published_faculty" on public.bgpi_faculty;
create policy "bgpi_public_read_published_faculty" on public.bgpi_faculty for select to anon, authenticated using (published = true or public.bgpi_is_admin());
drop policy if exists "bgpi_admin_manage_faculty" on public.bgpi_faculty;
create policy "bgpi_admin_manage_faculty" on public.bgpi_faculty for all to authenticated using (public.bgpi_is_admin()) with check (public.bgpi_is_admin());

drop policy if exists "bgpi_public_read_published_notices" on public.bgpi_notices;
create policy "bgpi_public_read_published_notices" on public.bgpi_notices for select to anon, authenticated using (published = true or public.bgpi_is_admin());
drop policy if exists "bgpi_admin_manage_notices" on public.bgpi_notices;
create policy "bgpi_admin_manage_notices" on public.bgpi_notices for all to authenticated using (public.bgpi_is_admin()) with check (public.bgpi_is_admin());

drop policy if exists "bgpi_public_read_published_departments" on public.bgpi_departments;
create policy "bgpi_public_read_published_departments" on public.bgpi_departments for select to anon, authenticated using (published = true or public.bgpi_is_admin());
drop policy if exists "bgpi_admin_manage_departments" on public.bgpi_departments;
create policy "bgpi_admin_manage_departments" on public.bgpi_departments for all to authenticated using (public.bgpi_is_admin()) with check (public.bgpi_is_admin());

grant select on public.bgpi_faculty, public.bgpi_notices, public.bgpi_departments to anon, authenticated;
grant insert, update, delete on public.bgpi_faculty, public.bgpi_notices, public.bgpi_departments to authenticated;
grant select on public.bgpi_admin_users to authenticated;
grant insert, update, delete on public.bgpi_admin_users to authenticated;

-- Optional public bucket for published notices/teacher photos.
-- Keep uploads protected: only an active BGPI admin may upload/update/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bgpi-public-files', 'bgpi-public-files', true, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "bgpi_public_read_assets" on storage.objects;
create policy "bgpi_public_read_assets" on storage.objects for select to anon, authenticated using (bucket_id = 'bgpi-public-files');
drop policy if exists "bgpi_admin_upload_assets" on storage.objects;
create policy "bgpi_admin_upload_assets" on storage.objects for insert to authenticated with check (bucket_id = 'bgpi-public-files' and public.bgpi_is_admin());
drop policy if exists "bgpi_admin_update_assets" on storage.objects;
create policy "bgpi_admin_update_assets" on storage.objects for update to authenticated using (bucket_id = 'bgpi-public-files' and public.bgpi_is_admin()) with check (bucket_id = 'bgpi-public-files' and public.bgpi_is_admin());
drop policy if exists "bgpi_admin_delete_assets" on storage.objects;
create policy "bgpi_admin_delete_assets" on storage.objects for delete to authenticated using (bucket_id = 'bgpi-public-files' and public.bgpi_is_admin());

-- Seed the nine requested technology labels only. These are supplied project requirements,
-- not claims about current department-specific programmes beyond those labels.
insert into public.bgpi_departments (name_bn, name_en, description, image_or_icon, display_order, published)
values
('সিভিল টেকনোলজি','Civil Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','▦',1,true),
('ইলেকট্রিক্যাল টেকনোলজি','Electrical Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','ϟ',2,true),
('কম্পিউটার সায়েন্স টেকনোলজি','Computer Science Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','⌘',3,true),
('মেকানিক্যাল টেকনোলজি','Mechanical Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','⚙',4,true),
('ইলেকট্রনিক্স টেকনোলজি','Electronics Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','⌁',5,true),
('পাওয়ার টেকনোলজি','Power Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','ϟ',6,true),
('রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং (RAC) টেকনোলজি','Refrigeration and Air Conditioning (RAC) Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','❄',7,true),
('ট্যুরিজম অ্যান্ড হসপিটালিটি ম্যানেজমেন্ট','Tourism and Hospitality Management','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','✧',8,true),
('মাইনিং অ্যান্ড মাইন সার্ভে টেকনোলজি','Mining and Mine Survey Technology','বিভাগের বিস্তারিত তথ্য যাচাই করে যুক্ত করা হবে।','⌖',9,true)
on conflict do nothing;

-- First-admin bootstrap (run only after creating the first Auth user in Supabase Dashboard):
-- insert into public.bgpi_admin_users (user_id, role, active)
-- values ('REPLACE-WITH-AUTH-USER-UUID'::uuid, 'owner', true);
-- Never expose a service-role key or database password in frontend files.