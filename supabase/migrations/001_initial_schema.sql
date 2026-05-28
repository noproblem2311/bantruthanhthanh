create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  center_name text not null default 'Phát Triển Toàn Diện',
  address text,
  phone text,
  zalo_url text,
  facebook_url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique not null,
  role text not null check (role in ('admin', 'manager', 'parent')),
  full_name text not null,
  phone text,
  email text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null unique,
  full_name text,
  username text not null,
  username_normalized text not null unique,
  phone text,
  email text,
  internal_auth_email text unique not null,
  status text default 'active' check (status in ('active', 'inactive')),
  profile_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade not null,
  full_name text not null,
  nickname text,
  date_of_birth date,
  gender text,
  school_name text,
  class_name text,
  health_notes text,
  allergy_notes text,
  pickup_notes text,
  boarding_package_type text not null default 'weekday' check (boarding_package_type in ('weekday', 'saturday')),
  enrollment_date date,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  attendance_date date not null,
  status text not null check (status in ('present', 'excused_absent', 'unexcused_absent', 'not_marked')),
  note text,
  marked_by uuid references public.profiles(id) on delete set null,
  marked_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint attendance_records_student_date_key unique (student_id, attendance_date)
);

create table if not exists public.off_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade not null,
  parent_id uuid references public.parents(id) on delete cascade not null,
  off_date date not null,
  reason text,
  status text default 'auto_approved' check (status in ('auto_approved', 'pending', 'approved', 'rejected', 'cancelled')),
  submitted_at timestamptz default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint off_requests_student_date_key unique (student_id, off_date)
);

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete set null,
  username text not null,
  phone text,
  note text,
  status text default 'pending' check (status in ('pending', 'resolved', 'rejected')),
  requested_at timestamptz default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fee_settings (
  id uuid primary key default gen_random_uuid(),
  year_month text not null unique,
  fee_per_attendance_day integer not null default 18000 check (fee_per_attendance_day >= 0),
  saturday_package_amount integer not null default 850000 check (saturday_package_amount >= 0),
  weekday_package_amount integer not null default 720000 check (weekday_package_amount >= 0),
  absence_deduction_amount integer not null default 18000 check (absence_deduction_amount >= 0),
  currency text default 'VND',
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists attendance_records_attendance_date_idx on public.attendance_records(attendance_date);
create index if not exists attendance_records_student_date_idx on public.attendance_records(student_id, attendance_date);
create index if not exists off_requests_off_date_idx on public.off_requests(off_date);
create index if not exists off_requests_parent_id_idx on public.off_requests(parent_id);
create index if not exists off_requests_student_id_idx on public.off_requests(student_id);
create index if not exists students_parent_id_idx on public.students(parent_id);
create index if not exists parents_username_normalized_idx on public.parents(username_normalized);
create index if not exists profiles_auth_user_id_idx on public.profiles(auth_user_id);

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_parents_updated_at on public.parents;
create trigger set_parents_updated_at before update on public.parents for each row execute function public.set_updated_at();
drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at before update on public.students for each row execute function public.set_updated_at();
drop trigger if exists set_attendance_records_updated_at on public.attendance_records;
create trigger set_attendance_records_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
drop trigger if exists set_off_requests_updated_at on public.off_requests;
create trigger set_off_requests_updated_at before update on public.off_requests for each row execute function public.set_updated_at();
drop trigger if exists set_password_reset_requests_updated_at on public.password_reset_requests;
create trigger set_password_reset_requests_updated_at before update on public.password_reset_requests for each row execute function public.set_updated_at();
drop trigger if exists set_fee_settings_updated_at on public.fee_settings;
create trigger set_fee_settings_updated_at before update on public.fee_settings for each row execute function public.set_updated_at();

create or replace function public.get_current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.get_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where auth_user_id = auth.uid() and status = 'active' limit 1
$$;

create or replace function public.get_current_parent()
returns public.parents
language sql
stable
security definer
set search_path = public
as $$
  select * from public.parents where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_role() = 'admin', false)
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_role() = 'manager', false)
$$;

create or replace function public.is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_current_role() = 'parent', false)
$$;

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.parents enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.off_requests enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.fee_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "Public can read app settings" on public.app_settings for select using (true);
create policy "Admins manage app settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "Users read own profile" on public.profiles for select using (auth_user_id = auth.uid());
create policy "Users update own basic profile" on public.profiles for update using (auth_user_id = auth.uid()) with check (
  auth_user_id = auth.uid()
  and role = public.get_current_role()
  and status = (public.get_current_profile()).status
);

create policy "Admins manage parents" on public.parents for all using (public.is_admin()) with check (public.is_admin());
create policy "Managers read parents for contact" on public.parents for select using (public.is_manager());
create policy "Parents read own parent record" on public.parents for select using (auth_user_id = auth.uid());
create policy "Parents update own parent record" on public.parents for update using (auth_user_id = auth.uid()) with check (
  auth_user_id = auth.uid()
  and profile_id is not distinct from (public.get_current_parent()).profile_id
  and username = (public.get_current_parent()).username
  and username_normalized = (public.get_current_parent()).username_normalized
  and internal_auth_email = (public.get_current_parent()).internal_auth_email
  and status = (public.get_current_parent()).status
);

create policy "Admins manage students" on public.students for all using (public.is_admin()) with check (public.is_admin());
create policy "Managers read active students" on public.students for select using (public.is_manager() and status = 'active');
create policy "Parents read own students" on public.students for select using (
  exists (
    select 1 from public.parents p
    where p.id = students.parent_id and p.auth_user_id = auth.uid()
  )
);

create policy "Admins manage attendance" on public.attendance_records for all using (public.is_admin()) with check (public.is_admin());
create policy "Managers read attendance" on public.attendance_records for select using (public.is_manager());
create policy "Managers insert attendance" on public.attendance_records for insert with check (public.is_manager());
create policy "Managers update attendance" on public.attendance_records for update using (public.is_manager()) with check (public.is_manager());
create policy "Parents read own attendance" on public.attendance_records for select using (
  exists (
    select 1
    from public.students s
    join public.parents p on p.id = s.parent_id
    where s.id = attendance_records.student_id and p.auth_user_id = auth.uid()
  )
);

create policy "Admins manage off requests" on public.off_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "Managers read off requests" on public.off_requests for select using (public.is_manager());
create policy "Parents read own off requests" on public.off_requests for select using (
  exists (select 1 from public.parents p where p.id = off_requests.parent_id and p.auth_user_id = auth.uid())
);
create policy "Parents insert own off requests" on public.off_requests for insert with check (
  exists (
    select 1
    from public.students s
    join public.parents p on p.id = s.parent_id
    where s.id = off_requests.student_id
      and p.id = off_requests.parent_id
      and p.auth_user_id = auth.uid()
  )
);
create policy "Parents cancel own off requests before deadline" on public.off_requests for update using (
  exists (select 1 from public.parents p where p.id = off_requests.parent_id and p.auth_user_id = auth.uid())
  and now() < ((off_requests.off_date::timestamp + time '06:00') at time zone 'Asia/Ho_Chi_Minh')
) with check (
  exists (select 1 from public.parents p where p.id = off_requests.parent_id and p.auth_user_id = auth.uid())
  and status = 'cancelled'
);

create policy "Admins manage password reset requests" on public.password_reset_requests for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage fee settings" on public.fee_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Parents and managers read fee settings" on public.fee_settings for select using (public.is_parent() or public.is_manager());

create policy "Admins read audit logs" on public.audit_logs for select using (public.is_admin());
create policy "Admins insert audit logs" on public.audit_logs for insert with check (public.is_admin());

insert into public.app_settings (center_name, description)
select 'Phát Triển Toàn Diện', 'Bán trú học tập cho học sinh tiểu học'
where not exists (select 1 from public.app_settings);
