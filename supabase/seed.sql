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
    ('Mustafa İnan Library', 255, 30, 'Quiet', now() - interval '1 days'),
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
select source.id, target.id, 'MED B is currently crowded. Mustafa İnan Library may be more suitable later, but this lounge is quieter now:'
from public.facilities source
join public.facilities target on target.name = 'Faculty of Management Lounge'
where source.name = 'MED B Building';

insert into public.recommendations (source_facility_id, target_facility_id, reason)
select source.id, target.id, 'Dining demand is rising. Vadi Cafeteria is currently a quieter eating option:'
from public.facilities source
join public.facilities target on target.name = 'Vadi Cafeteria'
where source.name = 'Central Dining Hall';

insert into public.feedback_reports (facility_id, report_type, created_at)
select f.id, report_type, created_at::timestamptz
from public.facilities f
join (
  values
    ('Mustafa İnan Library', 'accurate', now() - interval '1 day'),
    ('Mustafa İnan Library', 'more_busy', now() - interval '8 hours'),
    ('Central Dining Hall', 'accurate', now() - interval '3 hours'),
    ('MED B Building', 'more_busy', now() - interval '2 hours'),
    ('Vadi Cafeteria', 'less_busy', now() - interval '1 hour')
) as reports(name, report_type, created_at)
on reports.name = f.name;
