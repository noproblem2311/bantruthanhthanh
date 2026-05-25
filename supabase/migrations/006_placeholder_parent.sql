insert into public.parents (
  username,
  username_normalized,
  full_name,
  phone,
  email,
  internal_auth_email,
  status,
  profile_completed
)
values (
  'ph-chua-cap-nhat',
  'ph-chua-cap-nhat',
  '(chưa cập nhật)',
  null,
  null,
  'parent_ph-chua-cap-nhat@internal.bantru.local',
  'active',
  false
)
on conflict (username_normalized) do update
set full_name = excluded.full_name,
    status = 'active',
    updated_at = now();
