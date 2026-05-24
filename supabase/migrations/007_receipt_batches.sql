create table if not exists public.receipt_batches (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'manual' check (source_type in ('manual')),
  title text not null,
  billing_year_month text not null check (billing_year_month ~ '^\d{4}-\d{2}$'),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.receipt_batches(id) on delete cascade not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  student_name text not null check (length(trim(student_name)) > 0),
  class_name text,
  start_date date,
  studies_saturday boolean not null default false,
  boarding_amount integer not null default 0 check (boarding_amount >= 0),
  saturday_amount integer not null default 0 check (saturday_amount >= 0),
  computer_amount integer not null default 0 check (computer_amount >= 0),
  english_amount integer not null default 0 check (english_amount >= 0),
  other_label text,
  other_amount integer not null default 0,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists receipt_batches_created_at_idx on public.receipt_batches(created_at desc);
create index if not exists receipt_batches_billing_month_idx on public.receipt_batches(billing_year_month);
create index if not exists receipt_items_batch_id_idx on public.receipt_items(batch_id, sort_order);

drop trigger if exists set_receipt_batches_updated_at on public.receipt_batches;
create trigger set_receipt_batches_updated_at before update on public.receipt_batches for each row execute function public.set_updated_at();
drop trigger if exists set_receipt_items_updated_at on public.receipt_items;
create trigger set_receipt_items_updated_at before update on public.receipt_items for each row execute function public.set_updated_at();

alter table public.receipt_batches enable row level security;
alter table public.receipt_items enable row level security;

create policy "Admins manage receipt batches" on public.receipt_batches for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage receipt items" on public.receipt_items for all using (public.is_admin()) with check (public.is_admin());
