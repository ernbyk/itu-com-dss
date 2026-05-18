create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  display_name text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  capacity integer not null check (capacity > 0),
  hours text not null,
  map_x numeric(5, 2) not null check (map_x >= 0 and map_x <= 100),
  map_y numeric(5, 2) not null check (map_y >= 0 and map_y <= 100),
  icon text not null default 'book',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.occupancy_records (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  current_count integer not null check (current_count >= 0),
  busy_score integer not null check (busy_score >= 0 and busy_score <= 100),
  status text not null check (status in ('Quiet', 'Moderate', 'Crowded')),
  source text not null default 'sample',
  recorded_at timestamptz not null default now()
);

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  report_type text not null check (report_type in ('less_busy', 'accurate', 'more_busy')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  source_facility_id uuid not null references public.facilities(id) on delete cascade,
  target_facility_id uuid not null references public.facilities(id) on delete cascade,
  reason text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint recommendations_no_self_reference check (source_facility_id <> target_facility_id)
);

create index if not exists occupancy_records_facility_recorded_at_idx
  on public.occupancy_records (facility_id, recorded_at desc);

create index if not exists feedback_reports_facility_created_at_idx
  on public.feedback_reports (facility_id, created_at desc);

create or replace view public.admin_analytics as
select
  f.id as facility_id,
  f.name as facility_name,
  f.category,
  f.capacity,
  coalesce(latest.current_count, 0) as current_count,
  coalesce(latest.busy_score, 0) as occupancy_rate,
  coalesce(latest.status, 'Quiet') as status,
  coalesce(feedback.feedback_count, 0) as feedback_count,
  latest.recorded_at
from public.facilities f
left join lateral (
  select current_count, busy_score, status, recorded_at
  from public.occupancy_records o
  where o.facility_id = f.id
  order by o.recorded_at desc
  limit 1
) latest on true
left join lateral (
  select count(*)::integer as feedback_count
  from public.feedback_reports fr
  where fr.facility_id = f.id
) feedback on true
where f.is_active = true;

alter table public.users enable row level security;
alter table public.facilities enable row level security;
alter table public.occupancy_records enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.recommendations enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = auth_user_id);

drop policy if exists "Public can read active facilities" on public.facilities;
create policy "Public can read active facilities"
  on public.facilities for select
  using (is_active = true);

drop policy if exists "Public can read occupancy records" on public.occupancy_records;
create policy "Public can read occupancy records"
  on public.occupancy_records for select
  using (true);

drop policy if exists "Public can create feedback reports" on public.feedback_reports;
create policy "Public can create feedback reports"
  on public.feedback_reports for insert
  with check (true);

drop policy if exists "Public can read recommendations" on public.recommendations;
create policy "Public can read recommendations"
  on public.recommendations for select
  using (is_active = true);

grant usage on schema public to anon, authenticated;
grant select on public.facilities to anon, authenticated;
grant select on public.occupancy_records to anon, authenticated;
grant insert on public.feedback_reports to anon, authenticated;
grant select on public.recommendations to anon, authenticated;
grant select on public.admin_analytics to anon, authenticated;
