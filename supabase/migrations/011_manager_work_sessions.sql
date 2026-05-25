create table if not exists public.manager_work_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  work_date date not null,
  morning_worked boolean not null default false,
  afternoon_worked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint manager_work_sessions_profile_date_key unique (profile_id, work_date),
  constraint manager_work_sessions_has_shift_check check (morning_worked or afternoon_worked)
);

create index if not exists manager_work_sessions_profile_date_idx on public.manager_work_sessions(profile_id, work_date);
create index if not exists manager_work_sessions_work_date_idx on public.manager_work_sessions(work_date desc);

drop trigger if exists set_manager_work_sessions_updated_at on public.manager_work_sessions;
create trigger set_manager_work_sessions_updated_at before update on public.manager_work_sessions for each row execute function public.set_updated_at();

alter table public.manager_work_sessions enable row level security;

create policy "Admins manage manager work sessions" on public.manager_work_sessions for all using (public.is_admin()) with check (public.is_admin());
create policy "Managers read own work sessions" on public.manager_work_sessions for select using (
  public.is_manager() and profile_id = (public.get_current_profile()).id
);
create policy "Managers insert own work sessions" on public.manager_work_sessions for insert with check (
  public.is_manager() and profile_id = (public.get_current_profile()).id
);
create policy "Managers update own work sessions" on public.manager_work_sessions for update using (
  public.is_manager() and profile_id = (public.get_current_profile()).id
) with check (
  public.is_manager() and profile_id = (public.get_current_profile()).id
);
create policy "Managers delete own work sessions" on public.manager_work_sessions for delete using (
  public.is_manager() and profile_id = (public.get_current_profile()).id
);
