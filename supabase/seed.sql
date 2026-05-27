insert into public.app_settings (center_name, description)
select 'Phát Triển Toàn Diện', 'Bán trú học tập cho học sinh tiểu học'
where not exists (select 1 from public.app_settings);

insert into public.fee_settings (
  year_month,
  fee_per_attendance_day,
  saturday_package_amount,
  weekday_package_amount,
  absence_deduction_amount,
  currency,
  note
)
values (
  to_char((now() at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM' , 'weekday'),
  33000,
  850000,
  720000,
  33000,
  'VND',
  'Seed SQL tháng hiện tại'
)
on conflict (year_month) do update
set fee_per_attendance_day = excluded.fee_per_attendance_day,
    saturday_package_amount = excluded.saturday_package_amount,
    weekday_package_amount = excluded.weekday_package_amount,
    absence_deduction_amount = excluded.absence_deduction_amount,
    currency = excluded.currency,
    note = excluded.note;

with parent_rows(username, full_name, phone, internal_auth_email, status) as (
  values
    ('ph-chua-cap-nhat', '(chưa cập nhật)'::text, null::text, 'parent_ph-chua-cap-nhat@internal.bantru.local', 'active'),
    ('ph-tu-quynh-1-1', null::text, null::text, 'parent_ph-tu-quynh-1-1@internal.bantru.local', 'active'),
    ('ph-thuy-ngan-1-1', null, null, 'parent_ph-thuy-ngan-1-1@internal.bantru.local', 'active'),
    ('ph-hoang-long-1-1', null, null, 'parent_ph-hoang-long-1-1@internal.bantru.local', 'active'),
    ('ph-trung-long-1-2', null, null, 'parent_ph-trung-long-1-2@internal.bantru.local', 'active'),
    ('ph-duc-phuc-1-3', null, null, 'parent_ph-duc-phuc-1-3@internal.bantru.local', 'active'),
    ('ph-duc-thinh-1-3', null, null, 'parent_ph-duc-thinh-1-3@internal.bantru.local', 'active'),
    ('ph-nhat-thanh-1-3', null, null, 'parent_ph-nhat-thanh-1-3@internal.bantru.local', 'active'),
    ('ph-thuy-diem-1-3', null, null, 'parent_ph-thuy-diem-1-3@internal.bantru.local', 'active'),
    ('ph-an-nhien-1-3', null, null, 'parent_ph-an-nhien-1-3@internal.bantru.local', 'inactive'),
    ('ph-bao-vy-1-3', null, null, 'parent_ph-bao-vy-1-3@internal.bantru.local', 'active'),
    ('ph-khanh-hung-1-3', null, null, 'parent_ph-khanh-hung-1-3@internal.bantru.local', 'active'),
    ('ph-nha-phuong-1-3', null, null, 'parent_ph-nha-phuong-1-3@internal.bantru.local', 'active'),
    ('ph-minh-khang-1-4', null, null, 'parent_ph-minh-khang-1-4@internal.bantru.local', 'active'),
    ('ph-bao-chau-2-2', null, null, 'parent_ph-bao-chau-2-2@internal.bantru.local', 'active'),
    ('ph-huu-viet-2-4', null, null, 'parent_ph-huu-viet-2-4@internal.bantru.local', 'active'),
    ('ph-tan-phat-2-4', null, null, 'parent_ph-tan-phat-2-4@internal.bantru.local', 'active'),
    ('ph-bao-chau-2-4', null, null, 'parent_ph-bao-chau-2-4@internal.bantru.local', 'active'),
    ('ph-tam-an-2-4', null, null, 'parent_ph-tam-an-2-4@internal.bantru.local', 'active'),
    ('ph-anh-tuyet-3-1', null, null, 'parent_ph-anh-tuyet-3-1@internal.bantru.local', 'active'),
    ('ph-truc-lien-3-1', null, null, 'parent_ph-truc-lien-3-1@internal.bantru.local', 'active'),
    ('ph-chi-nhan-3-1', null, null, 'parent_ph-chi-nhan-3-1@internal.bantru.local', 'active'),
    ('ph-dieu-thao-3-2', null, null, 'parent_ph-dieu-thao-3-2@internal.bantru.local', 'active'),
    ('ph-bao-uyen-3-4', null, null, 'parent_ph-bao-uyen-3-4@internal.bantru.local', 'active'),
    ('ph-nguyen-huu-tam-2-4', null, null, 'parent_ph-nguyen-huu-tam-2-4@internal.bantru.local', 'active'),
    ('ph-nguyen-huu-tai-4-4', null, null, 'parent_ph-nguyen-huu-tai-4-4@internal.bantru.local', 'active')
)
insert into public.parents (
  username,
  username_normalized,
  full_name,
  phone,
  internal_auth_email,
  status,
  profile_completed
)
select username, username, full_name, phone, internal_auth_email, status, false
from parent_rows
on conflict (username_normalized) do update
set full_name = coalesce(public.parents.full_name, excluded.full_name),
    phone = coalesce(public.parents.phone, excluded.phone),
    status = excluded.status,
    updated_at = now();

with student_rows(full_name, class_name, status, parent_username, boarding_package_type) as (
  values
    ('Tú Quỳnh', '1/1', 'active', 'ph-tu-quynh-1-1' , 'weekday'),
    ('Thuỷ Ngân', '1/1', 'active', 'ph-thuy-ngan-1-1' , 'weekday'),
    ('Hoàng Long', '1/1', 'active', 'ph-hoang-long-1-1' , 'weekday'),
    ('Trung Long', '1/2', 'active', 'ph-trung-long-1-2' , 'weekday'),
    ('Đức Phúc', '1/3', 'active', 'ph-duc-phuc-1-3' , 'weekday'),
    ('Đức Thịnh', '1/3', 'active', 'ph-duc-thinh-1-3' , 'weekday'),
    ('Nhật Thành', '1/3', 'active', 'ph-nhat-thanh-1-3' , 'weekday'),
    ('Thuý Diễm', '1/3', 'active', 'ph-thuy-diem-1-3' , 'weekday'),
    ('an Nhiên', '1/3', 'inactive', 'ph-an-nhien-1-3' , 'weekday'),
    ('Bảo Vy', '1/3', 'active', 'ph-bao-vy-1-3' , 'weekday'),
    ('Khánh Hưng', '1/3', 'active', 'ph-khanh-hung-1-3' , 'weekday'),
    ('Nhã Phương', '1/3', 'active', 'ph-nha-phuong-1-3' , 'weekday'),
    ('Minh Khang', '1/4', 'active', 'ph-minh-khang-1-4' , 'weekday'),
    ('Bảo Châu', '2/2', 'active', 'ph-bao-chau-2-2' , 'weekday'),
    ('Hữu Việt', '2/4', 'active', 'ph-huu-viet-2-4' , 'weekday'),
    ('Tấn Phát', '2/4', 'active', 'ph-tan-phat-2-4' , 'weekday'),
    ('Bảo Châu', '2/4', 'active', 'ph-bao-chau-2-4' , 'weekday'),
    ('Tam An', '2/4', 'active', 'ph-tam-an-2-4' , 'weekday'),
    ('Ánh Tuyêt', '3/1', 'active', 'ph-anh-tuyet-3-1' , 'weekday'),
    ('Trúc Liên', '3/1', 'active', 'ph-truc-lien-3-1' , 'weekday'),
    ('Chí Nhân', '3/1', 'active', 'ph-chi-nhan-3-1' , 'weekday'),
    ('diệu thảo', '3/2', 'active', 'ph-dieu-thao-3-2' , 'weekday'),
    ('Bảo Uyên', '3/4', 'active', 'ph-bao-uyen-3-4' , 'weekday'),
    ('Nguyễn Hữu Tâm', '2/4', 'active', 'ph-nguyen-huu-tam-2-4' , 'weekday'),
    ('Nguyễn Hữu Tài', '4/4', 'active', 'ph-nguyen-huu-tai-4-4' , 'weekday')
)
insert into public.students (parent_id, full_name, class_name, status, boarding_package_type)
select parents.id, student_rows.full_name, student_rows.class_name, student_rows.status, student_rows.boarding_package_type
from student_rows
join public.parents on parents.username_normalized = student_rows.parent_username
where not exists (
  select 1
  from public.students existing
  where existing.parent_id = parents.id
    and existing.full_name = student_rows.full_name
    and existing.class_name is not distinct from student_rows.class_name
);
