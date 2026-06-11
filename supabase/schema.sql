create table if not exists plan_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table plan_documents enable row level security;

drop policy if exists "Users can read their own plan documents" on plan_documents;
create policy "Users can read their own plan documents"
on plan_documents
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own plan documents" on plan_documents;
create policy "Users can insert their own plan documents"
on plan_documents
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own plan documents" on plan_documents;
create policy "Users can update their own plan documents"
on plan_documents
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own plan documents" on plan_documents;
create policy "Users can delete their own plan documents"
on plan_documents
for delete
using (auth.uid() = user_id);

create table if not exists price_cache (
  symbol text not null,
  price_date date not null,
  close_price numeric not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  primary key (symbol, price_date)
);

alter table price_cache enable row level security;

drop policy if exists "Price cache is readable" on price_cache;
create policy "Price cache is readable"
on price_cache
for select
using (true);

-- Feedback: only the message is required. Name, email, and phone are all
-- optional so a visitor can leave a comment without any contact details.
create table if not exists feedback_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table feedback_messages enable row level security;

-- Anyone (including anonymous visitors) can submit feedback, but nobody can
-- read it through the anon/authenticated API — view messages in the Supabase
-- dashboard or with the service role key.
drop policy if exists "Anyone can submit feedback" on feedback_messages;
create policy "Anyone can submit feedback"
on feedback_messages
for insert
to anon, authenticated
with check (true);
