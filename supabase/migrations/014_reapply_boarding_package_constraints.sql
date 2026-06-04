alter table public.students
  drop constraint if exists students_boarding_package_type_check;

alter table public.students
  add constraint students_boarding_package_type_check
  check (boarding_package_type in ('weekday', 'saturday', 'two_days', 'three_days', 'four_days'));

alter table public.monthly_history_students
  drop constraint if exists monthly_history_students_boarding_package_type_check;

alter table public.monthly_history_students
  add constraint monthly_history_students_boarding_package_type_check
  check (boarding_package_type in ('weekday', 'saturday', 'two_days', 'three_days', 'four_days'));
