insert into public.app_settings (center_name, description)
select 'Bán trú Learning Hub', 'Bán trú học tập cho học sinh tiểu học'
where not exists (select 1 from public.app_settings);

insert into public.fee_settings (year_month, fee_per_attendance_day, currency, note)
values (
  to_char((now() at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM'),
  80000,
  'VND',
  'Seed SQL tháng hiện tại'
)
on conflict (year_month) do update
set fee_per_attendance_day = excluded.fee_per_attendance_day,
    currency = excluded.currency,
    note = excluded.note;
