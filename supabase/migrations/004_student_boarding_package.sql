alter table public.students
  add column if not exists boarding_package_type text;

update public.students
set boarding_package_type = 'saturday'
where boarding_package_type is null
  and exists (
    select 1
    from public.attendance_records ar
    where ar.student_id = students.id
      and ar.status = 'present'
      and extract(dow from ar.attendance_date) = 6
  );

update public.students
set boarding_package_type = coalesce(boarding_package_type, 'weekday');

alter table public.students
  alter column boarding_package_type set default 'weekday',
  alter column boarding_package_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'students_boarding_package_type_check'
  ) then
    alter table public.students
      add constraint students_boarding_package_type_check check (boarding_package_type in ('weekday', 'saturday'));
  end if;
end $$;
