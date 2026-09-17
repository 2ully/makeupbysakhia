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
  token       text not null,
  lang        text not null default 'en'
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

-- Where the booking came from: the public form, or typed in by hand in /admin.
alter table public.bookings add column if not exists source text not null default 'website';

-- The API talks to Supabase with the service-role key (server-side only),
-- which bypasses Row Level Security. We still enable RLS with no public
-- policies so the table is not exposed via the public anon key.
alter table public.bookings enable row level security;


-- ─────────────────────────────────────────────────────────────
--  Blocked days and slots — holidays, travel, days off.
--  time = null means the WHOLE day is closed.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.blocked_slots (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  date        date not null,
  time        text,
  reason      text
);

-- Stop the same day/slot being blocked twice ('*' stands in for a whole day).
create unique index if not exists blocked_slots_unique_idx
  on public.blocked_slots (date, coalesce(time, '*'));

create index if not exists blocked_slots_date_idx on public.blocked_slots (date);

alter table public.blocked_slots enable row level security;


-- ─────────────────────────────────────────────────────────────
--  Gallery images shown on the home page, managed from /admin.
--  url  = what the browser loads (Supabase Storage URL, or a file
--         shipped with the site such as "images/2.jpg")
--  path = storage path, only set for uploaded images
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gallery (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  url         text not null,
  path        text,
  category    text not null default 'glam'
                check (category in ('glam', 'editorial')),
  title       text,
  sort_order  int not null default 0
);

create unique index if not exists gallery_url_idx on public.gallery (url);
create index if not exists gallery_order_idx on public.gallery (sort_order);

alter table public.gallery enable row level security;

-- Seed the two images that already ship with the site so the gallery is not
-- empty on the first run. Safe to run again — duplicates are ignored.
insert into public.gallery (url, category, title, sort_order) values
  ('images/2.jpg', 'glam', 'Golden Hour Glam', 1),
  ('images/IMG_2744 - Copy.png', 'editorial', 'Editorial & Graduation', 2)
on conflict (url) do nothing;


-- ─────────────────────────────────────────────────────────────
--  Categories — one row per "Explore by Category" card on the home
--  page, which is also one gallery filter button. Managed in /admin.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  key         text not null unique,   -- short id used in the gallery rows
  title_en    text not null,
  title_ar    text,
  cover_url   text,                   -- card photo; null keeps the gradient
  cover_path  text,
  sort_order  int not null default 0
);

alter table public.categories enable row level security;

-- The two categories the site started with.
insert into public.categories (key, title_en, title_ar, sort_order) values
  ('glam', 'Glam & Special Events', 'الجلام والمناسبات الخاصة', 1),
  ('editorial', 'Editorial & Graduation', 'التصوير والتخرّج', 2)
on conflict (key) do nothing;

-- Gallery images used to be limited to those two categories; now any category
-- in the table above is allowed.
alter table public.gallery drop constraint if exists gallery_category_check;


-- ─────────────────────────────────────────────────────────────
--  Single-value site settings. Card photos lived here briefly; they
--  now live on the categories table, and this moves any across.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.site_settings (
  key         text primary key,
  value       text,
  path        text,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

update public.categories c
   set cover_url = s.value, cover_path = s.path
  from public.site_settings s
 where s.key = 'cover_' || c.key
   and c.cover_url is null;
