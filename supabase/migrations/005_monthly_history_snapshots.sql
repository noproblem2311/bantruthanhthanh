create table if not exists public.monthly_history_snapshots (
  id uuid primary key default gen_random_uuid(),
  billing_year_month text not null check (billing_year_month ~ '^\d{4}-\d{2}$'),
  previous_year_month text not null check (previous_year_month ~ '^\d{4}-\d{2}$'),
  captured_by uuid references public.profiles(id) on delete set null,
  captured_at timestamptz not null default now(),
  note text,
  student_count integer not null default 0 check (student_count >= 0),
  excused_absence_total integer not null default 0 check (excused_absence_total >= 0),
  unexcused_absence_total integer not null default 0 check (unexcused_absence_total >= 0),
  package_total integer check (package_total >= 0),
  excused_deduction_total integer check (excused_deduction_total >= 0),
  billing_total integer check (billing_total >= 0),
  saturday_package_amount integer check (saturday_package_amount >= 0),
  weekday_package_amount integer check (weekday_package_amount >= 0),
  absence_deduction_amount integer check (absence_deduction_amount >= 0),
  currency text default 'VND',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.monthly_history_students (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid references public.monthly_history_snapshots(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete set null,
  parent_id uuid references public.parents(id) on delete set null,
  student_full_name text not null,
  student_nickname text,
  date_of_birth date,
  gender text,
  school_name text,
  class_name text,
  health_notes text,
  allergy_notes text,
  pickup_notes text,
  boarding_package_type text not null check (boarding_package_type in ('weekday', 'saturday')),
  student_status text not null check (student_status in ('active', 'inactive')),
  parent_full_name text,
  parent_username text,
  parent_phone text,
  parent_email text,
  excused_absent_count integer not null default 0 check (excused_absent_count >= 0),
  unexcused_absent_count integer not null default 0 check (unexcused_absent_count >= 0),
  excused_absent_dates jsonb not null default '[]'::jsonb,
  unexcused_absent_dates jsonb not null default '[]'::jsonb,
  package_amount integer check (package_amount >= 0),
  excused_deduction_amount integer check (excused_deduction_amount >= 0),
  billing_amount integer check (billing_amount >= 0),
  created_at timestamptz default now(),
  constraint monthly_history_students_snapshot_student_key unique (snapshot_id, student_id)
);

create index if not exists monthly_history_snapshots_billing_month_idx on public.monthly_history_snapshots(billing_year_month);
create index if not exists monthly_history_snapshots_captured_at_idx on public.monthly_history_snapshots(captured_at desc);
create index if not exists monthly_history_students_snapshot_id_idx on public.monthly_history_students(snapshot_id);
create index if not exists monthly_history_students_student_id_idx on public.monthly_history_students(student_id);

drop trigger if exists set_monthly_history_snapshots_updated_at on public.monthly_history_snapshots;
create trigger set_monthly_history_snapshots_updated_at before update on public.monthly_history_snapshots for each row execute function public.set_updated_at();

alter table public.monthly_history_snapshots enable row level security;
alter table public.monthly_history_students enable row level security;

create policy "Admins manage monthly history snapshots" on public.monthly_history_snapshots for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage monthly history students" on public.monthly_history_students for all using (public.is_admin()) with check (public.is_admin());
