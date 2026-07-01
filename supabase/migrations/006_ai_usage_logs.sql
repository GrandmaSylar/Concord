-- 006_ai_usage_logs.sql
create table if not exists public.ai_usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  prompt text,
  model text not null,
  tokens_used integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.ai_usage_logs enable row level security;

-- Policies
create policy "Users can view their own AI usage logs"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI usage logs"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);
