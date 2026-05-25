create table if not exists public.monthly_tuition_records (
  id uuid primary key default gen_random_uuid(),
  billing_year_month text not null check (billing_year_month ~ '^\d{4}-\d{2}$'),
  student_id uuid references public.students(id) on delete cascade not null,
  is_paid boolean not null default false,
  receipt_sent boolean not null default false,
  note text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint monthly_tuition_records_month_student_key unique (billing_year_month, student_id)
);

create index if not exists monthly_tuition_records_billing_month_idx on public.monthly_tuition_records(billing_year_month);
create index if not exists monthly_tuition_records_student_id_idx on public.monthly_tuition_records(student_id);

drop trigger if exists set_monthly_tuition_records_updated_at on public.monthly_tuition_records;
create trigger set_monthly_tuition_records_updated_at before update on public.monthly_tuition_records for each row execute function public.set_updated_at();

alter table public.monthly_tuition_records enable row level security;

create policy "Admins manage monthly tuition records" on public.monthly_tuition_records for all using (public.is_admin()) with check (public.is_admin());
