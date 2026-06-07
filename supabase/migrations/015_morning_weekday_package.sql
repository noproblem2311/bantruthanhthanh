alter table public.students
  drop constraint if exists students_boarding_package_type_check;

alter table public.students
  add constraint students_boarding_package_type_check
  check (
    boarding_package_type in (
      'weekday',
      'saturday',
      'two_days',
      'three_days',
      'four_days',
      'morning_weekday'
    )
  );

alter table public.monthly_history_students
  drop constraint if exists monthly_history_students_boarding_package_type_check;

alter table public.monthly_history_students
  add constraint monthly_history_students_boarding_package_type_check
  check (
    boarding_package_type in (
      'weekday',
      'saturday',
      'two_days',
      'three_days',
      'four_days',
      'morning_weekday'
    )
  );

update public.students
set boarding_package_type = 'morning_weekday',
    updated_at = now()
where id = '18c9aa5f-218a-48d8-b092-1e15c28d0212';
