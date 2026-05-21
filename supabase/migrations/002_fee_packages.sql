alter table public.fee_settings
  add column if not exists saturday_package_amount integer,
  add column if not exists weekday_package_amount integer,
  add column if not exists absence_deduction_amount integer;

update public.fee_settings
set saturday_package_amount = coalesce(saturday_package_amount, 850000),
    weekday_package_amount = coalesce(weekday_package_amount, 720000),
    absence_deduction_amount = coalesce(absence_deduction_amount, 33000),
    fee_per_attendance_day = coalesce(fee_per_attendance_day, 33000);

alter table public.fee_settings
  alter column saturday_package_amount set default 850000,
  alter column weekday_package_amount set default 720000,
  alter column absence_deduction_amount set default 33000,
  alter column fee_per_attendance_day set default 33000,
  alter column saturday_package_amount set not null,
  alter column weekday_package_amount set not null,
  alter column absence_deduction_amount set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fee_settings_saturday_package_amount_check'
  ) then
    alter table public.fee_settings
      add constraint fee_settings_saturday_package_amount_check check (saturday_package_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'fee_settings_weekday_package_amount_check'
  ) then
    alter table public.fee_settings
      add constraint fee_settings_weekday_package_amount_check check (weekday_package_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'fee_settings_absence_deduction_amount_check'
  ) then
    alter table public.fee_settings
      add constraint fee_settings_absence_deduction_amount_check check (absence_deduction_amount >= 0);
  end if;
end $$;
