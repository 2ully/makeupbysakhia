-- Makeup by Sakhia — booking table
-- Run this once in the Supabase dashboard: Project → SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  fname       text not null,
  lname       text not null,
  email       text not null,
  phone       text not null,
  service     text,
  message     text,
  date        date not null,
  time        text not null,
  status      text not null default 'pending'
                check (status in ('pending', 'confirmed', 'declined')),
  token       text not null
);

-- A given date+time can only have ONE active (pending or confirmed) booking.
-- Declined bookings are ignored, so a declined slot frees up again.
create unique index if not exists bookings_active_slot_idx
  on public.bookings (date, time)
  where status in ('pending', 'confirmed');

-- Look up by token quickly (used by the confirm/decline email links).
create index if not exists bookings_token_idx on public.bookings (token);

-- Look up a day's bookings quickly (used to compute availability + the 4/day cap).
create index if not exists bookings_date_idx on public.bookings (date);

-- The API talks to Supabase with the service-role key (server-side only),
-- which bypasses Row Level Security. We still enable RLS with no public
-- policies so the table is not exposed via the public anon key.
alter table public.bookings enable row level security;
