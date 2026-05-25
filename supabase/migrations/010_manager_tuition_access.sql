create policy "Managers read monthly history snapshots"
on public.monthly_history_snapshots
for select
using (public.is_manager());

create policy "Managers read monthly history students"
on public.monthly_history_students
for select
using (public.is_manager());

create policy "Managers read monthly tuition records"
on public.monthly_tuition_records
for select
using (public.is_manager());

create policy "Managers insert monthly tuition records"
on public.monthly_tuition_records
for insert
with check (public.is_manager());

create policy "Managers update monthly tuition records"
on public.monthly_tuition_records
for update
using (public.is_manager())
with check (public.is_manager());
