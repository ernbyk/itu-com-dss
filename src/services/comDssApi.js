import { supabase } from '../lib/supabase';

const toFacility = (facility) => {
  const latest = facility.occupancy_records?.[0] ?? null;
  const currentCount = latest?.current_count ?? 0;
  const occupancyRate = facility.capacity
    ? Math.round((currentCount / facility.capacity) * 100)
    : 0;

  return {
    ...facility,
    current_count: currentCount,
    occupancy_rate: occupancyRate,
    status: latest?.status ?? statusFromRate(occupancyRate),
    recorded_at: latest?.recorded_at ?? null,
  };
};

export const statusFromRate = (rate) => {
  if (rate >= 80) return 'Crowded';
  if (rate >= 35) return 'Moderate';
  return 'Quiet';
};

export async function fetchFacilities() {
  const { data, error } = await supabase
    .from('facilities')
    .select(
      `
        id,
        name,
        category,
        capacity,
        hours,
        map_x,
        map_y,
        icon,
        is_active,
        occupancy_records (
          current_count,
          status,
          recorded_at
        )
      `,
    )
    .eq('is_active', true)
    .order('name')
    .order('recorded_at', {
      foreignTable: 'occupancy_records',
      ascending: false,
    })
    .limit(1, { foreignTable: 'occupancy_records' });

  if (error) throw error;
  return data.map(toFacility);
}

export async function fetchFacilityForecast(facilityId) {
  const { data, error } = await supabase
    .from('occupancy_records')
    .select('current_count, recorded_at')
    .eq('facility_id', facilityId)
    .order('recorded_at', { ascending: false })
    .limit(7);

  if (error) throw error;
  return data.reverse();
}

export async function fetchRecommendations(facilityId) {
  const { data, error } = await supabase
    .from('recommendations')
    .select(
      `
        id,
        reason,
        target_facility:facilities!recommendations_target_facility_id_fkey (
          id,
          name,
          category
        )
      `,
    )
    .eq('source_facility_id', facilityId)
    .eq('is_active', true)
    .limit(1);

  if (error) throw error;
  return data[0] ?? null;
}

export async function submitFeedback({ facilityId, reportType }) {
  const { error } = await supabase.from('feedback_reports').insert({
    facility_id: facilityId,
    report_type: reportType,
  });

  if (error) throw error;
}

export async function fetchTrendSeries() {
  const { data, error } = await supabase
    .from('occupancy_records')
    .select('busy_score, recorded_at, facilities!inner(name)')
    .eq('facilities.name', 'Mustafa İnan Library')
    .order('recorded_at', { ascending: true })
    .limit(21);

  if (error) throw error;

  const byDay = data.reduce((days, record) => {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
      new Date(record.recorded_at),
    );
    days[day] = days[day] ?? [];
    days[day].push(record.busy_score);
    return days;
  }, {});

  const labels = Object.keys(byDay).slice(-7);
  return {
    labels,
    values: labels.map((day) =>
      Math.round(byDay[day].reduce((sum, value) => sum + value, 0) / byDay[day].length),
    ),
  };
}

export async function fetchAdminAnalytics() {
  const { data, error } = await supabase
    .from('admin_analytics')
    .select('*')
    .order('facility_name');

  if (error) throw error;

  const congested = data.filter((item) => item.status === 'Crowded').length;
  const utilizationRate = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.occupancy_rate, 0) / data.length)
    : 0;
  const feedbackReports = data.reduce(
    (sum, item) => sum + Number(item.feedback_count ?? 0),
    0,
  );

  return {
    cards: {
      congested,
      avgSearchTime: '4.2 min',
      feedbackReports,
      utilizationRate,
    },
    chart: {
      labels: data.map((item) => item.facility_name),
      values: data.map((item) => item.occupancy_rate),
      colors: data.map((item) =>
        item.status === 'Crowded'
          ? '#ef4444'
          : item.status === 'Moderate'
            ? '#f97316'
            : '#10b981',
      ),
    },
  };
}
