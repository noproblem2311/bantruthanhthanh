create table if not exists public.ingredient_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  ingredient_name text not null check (length(trim(ingredient_name)) > 0),
  description text,
  price integer not null check (price >= 0),
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ingredient_expenses_expense_date_idx on public.ingredient_expenses(expense_date desc);
create index if not exists ingredient_expenses_recorded_by_idx on public.ingredient_expenses(recorded_by);

drop trigger if exists set_ingredient_expenses_updated_at on public.ingredient_expenses;
create trigger set_ingredient_expenses_updated_at before update on public.ingredient_expenses for each row execute function public.set_updated_at();

alter table public.ingredient_expenses enable row level security;

create policy "Admins manage ingredient expenses" on public.ingredient_expenses for all using (public.is_admin()) with check (public.is_admin());
create policy "Managers manage ingredient expenses" on public.ingredient_expenses for all using (public.is_manager()) with check (public.is_manager());
