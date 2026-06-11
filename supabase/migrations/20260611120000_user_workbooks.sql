-- Optional cross-device sync for the Phase 1 workbook.
--
-- One row per signed-in user holding the entire Phase1Workbook JSON document
-- (id "phase1-default"). The anonymous local-first experience never touches
-- this table — it is only written/read when a user opts into an account.
--
-- Mirrors the per-user RLS model already used by plan_documents. Existing
-- tables are left untouched.

create table if not exists user_workbooks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table user_workbooks enable row level security;

drop policy if exists "Users can read their own workbook" on user_workbooks;
create policy "Users can read their own workbook"
on user_workbooks
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workbook" on user_workbooks;
create policy "Users can insert their own workbook"
on user_workbooks
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workbook" on user_workbooks;
create policy "Users can update their own workbook"
on user_workbooks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own workbook" on user_workbooks;
create policy "Users can delete their own workbook"
on user_workbooks
for delete
using (auth.uid() = user_id);
