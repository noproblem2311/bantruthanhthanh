alter table public.students
  add column if not exists enrollment_date date;

update public.students
set enrollment_date = (created_at at time zone 'Asia/Ho_Chi_Minh')::date
where enrollment_date is null;

alter table public.monthly_history_students
  add column if not exists enrollment_date date;

alter table public.fee_settings
  alter column fee_per_attendance_day set default 18000,
  alter column absence_deduction_amount set default 18000;

update public.fee_settings
set fee_per_attendance_day = 18000
where fee_per_attendance_day = 33000;

update public.fee_settings
set absence_deduction_amount = 18000
where absence_deduction_amount = 33000;
