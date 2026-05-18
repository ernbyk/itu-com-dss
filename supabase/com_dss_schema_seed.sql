create extension if not exists pgcrypto;

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  capacity integer not null check (capacity > 0),
  hours text not null,
  map_x numeric(5, 2) not null check (map_x >= 0 and map_x <= 100),
  map_y numeric(5, 2) not null check (map_y >= 0 and map_y <= 100),
  icon text not null default 'book-open',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists recommendations_source_facility_idx
  on public.recommendations (source_facility_id)
  where is_active = true;

alter table public.facilities enable row level security;
alter table public.occupancy_records enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.recommendations enable row level security;

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

truncate table
  public.recommendations,
  public.feedback_reports,
  public.occupancy_records,
  public.facilities
restart identity cascade;

insert into public.facilities (name, category, capacity, hours, map_x, map_y, icon)
values
  ('Mustafa İnan Library', 'Studying', 850, '24/7', 45, 30, 'book-open'),
  ('Central Dining Hall', 'Eating', 1200, '11:30 - 14:30', 55, 50, 'utensils'),
  ('Faculty of Management Lounge', 'Quiet Zone', 80, '08:30 - 18:00', 20, 60, 'book-open'),
  ('MED B Building', 'Studying', 200, '08:30 - 22:00', 40, 45, 'book-open'),
  ('Vadi Cafeteria', 'Eating', 300, '08:00 - 23:00', 70, 20, 'utensils'),
  ('SDKM Common Area', 'Group Work', 150, '08:30 - 21:00', 30, 15, 'book-open');

insert into public.occupancy_records (facility_id, current_count, busy_score, status, recorded_at)
select f.id, sample.current_count, sample.busy_score, sample.status, sample.recorded_at::timestamptz
from public.facilities f
join (
  values
    ('Mustafa İnan Library', 552, 65, 'Moderate', now() - interval '6 days'),
    ('Mustafa İnan Library', 663, 78, 'Moderate', now() - interval '5 days'),
    ('Mustafa İnan Library', 765, 90, 'Crowded', now() - interval '4 days'),
    ('Mustafa İnan Library', 722, 85, 'Crowded', now() - interval '3 days'),
    ('Mustafa İnan Library', 383, 45, 'Moderate', now() - interval '2 days'),
    ('Mustafa İnan Library', 255, 30, 'Quiet', now() - interval '1 day'),
    ('Mustafa İnan Library', 790, 93, 'Crowded', now()),
    ('Central Dining Hall', 380, 32, 'Quiet', now() - interval '2 hours'),
    ('Central Dining Hall', 450, 38, 'Moderate', now()),
    ('Faculty of Management Lounge', 11, 14, 'Quiet', now() - interval '2 hours'),
    ('Faculty of Management Lounge', 15, 19, 'Quiet', now()),
    ('MED B Building', 165, 83, 'Crowded', now() - interval '2 hours'),
    ('MED B Building', 185, 93, 'Crowded', now()),
    ('Vadi Cafeteria', 38, 13, 'Quiet', now() - interval '2 hours'),
    ('Vadi Cafeteria', 40, 13, 'Quiet', now()),
    ('SDKM Common Area', 56, 37, 'Moderate', now() - interval '2 hours'),
    ('SDKM Common Area', 65, 43, 'Moderate', now())
) as sample(name, current_count, busy_score, status, recorded_at)
on sample.name = f.name;

insert into public.recommendations (source_facility_id, target_facility_id, reason)
select source.id, target.id, 'This facility is currently crowded. Try this quieter alternative nearby:'
from public.facilities source
join public.facilities target on target.name = 'Faculty of Management Lounge'
where source.name = 'Mustafa İnan Library';

insert into public.recommendations (source_facility_id, target_facility_id, reason)
select source.id, target.id, 'MED B is currently crowded. This lounge is quieter now:'
from public.facilities source
join public.facilities target on target.name = 'Faculty of Management Lounge'
where source.name = 'MED B Building';

insert into public.recommendations (source_facility_id, target_facility_id, reason)
select source.id, target.id, 'Dining demand is rising. Vadi Cafeteria is currently a quieter eating option:'
from public.facilities source
join public.facilities target on target.name = 'Vadi Cafeteria'
where source.name = 'Central Dining Hall';
