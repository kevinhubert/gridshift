-- GridShift Supabase Schema
-- Run this in your Supabase SQL editor

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  utility_provider text,
  base_monthly_kwh numeric,
  created_at timestamptz default now()
);

-- Devices (user's flexible loads)
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  device_type text check (device_type in ('ev', 'pool_pump', 'dishwasher', 'laundry', 'water_heater', 'other')),
  daily_kwh numeric not null default 0,
  flexible_hours integer[] not null default '{0,1,2,3,4,5}',
  created_at timestamptz default now()
);

-- Price cache (populated by Supabase cron / edge function)
create table public.price_cache (
  id serial primary key,
  hub text not null,
  price_per_mwh numeric not null,
  interval_end timestamptz not null,
  oper_day date not null,
  fetched_at timestamptz default now()
);

-- Index for fast hub+day lookups
create index idx_price_cache_hub_day on public.price_cache(hub, oper_day);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.devices enable row level security;

-- Users can only see/edit their own profiles
create policy "Users own their profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users own their devices"
  on public.devices for all
  using (auth.uid() = user_id);

-- Price cache is publicly readable (no PII)
create policy "Anyone can read price data"
  on public.price_cache for select
  using (true);

-- Only service role can write prices (from edge function)
create policy "Service role can write prices"
  on public.price_cache for insert
  with check (true);
```
