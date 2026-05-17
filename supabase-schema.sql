-- Supabase Schema for PhiNova Bulk SMS Platform
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'user')) default 'user',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Contacts Table
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  phone text not null,
  group_name text,
  opt_out boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Templates Table
create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Messages Table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  recipient text not null,
  content text not null,
  status text check (status in ('pending', 'sent', 'failed')) default 'pending',
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Scheduled Reminders Table
create table public.scheduled_reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  message text not null,
  trigger_time timestamp with time zone not null,
  status text check (status in ('pending', 'processing', 'sent', 'failed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) setup

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.templates enable row level security;
alter table public.messages enable row level security;
alter table public.scheduled_reminders enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Contacts Policies
create policy "Users can view own contacts" on public.contacts for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on public.contacts for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on public.contacts for update using (auth.uid() = user_id);
create policy "Users can delete own contacts" on public.contacts for delete using (auth.uid() = user_id);

-- Templates Policies
create policy "Users can view own templates" on public.templates for select using (auth.uid() = user_id);
create policy "Users can insert own templates" on public.templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates" on public.templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates" on public.templates for delete using (auth.uid() = user_id);

-- Messages Policies
create policy "Users can view own messages" on public.messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.messages for insert with check (auth.uid() = user_id);

-- Scheduled Reminders Policies
create policy "Users can view own reminders" on public.scheduled_reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.scheduled_reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.scheduled_reminders for update using (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.scheduled_reminders for delete using (auth.uid() = user_id);

-- Trigger to create a profile automatically when a new auth user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
