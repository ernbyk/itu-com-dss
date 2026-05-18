import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Admin client for presentation hack to bypass RLS
const adminSupabase = createClient(
  'https://xwvkmggdwbypaeumzywv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dmttZ2dkd2J5cGFldW16eXd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExNTg3MCwiZXhwIjoyMDk0NjkxODcwfQ.SXJ6Q-lhR06q0hO--QCWHkCjdK5m7yoe_OFAZYblQ3s'
);
function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.');
  }

  return supabase;
}

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
  const { data, error } = await requireSupabase()
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
  const { data, error } = await requireSupabase()
    .from('occupancy_records')
    .select('current_count, recorded_at')
    .eq('facility_id', facilityId)
    .order('recorded_at', { ascending: false })
    .limit(7);

  if (error) throw error;
  return data.reverse();
}

export async function fetchRecommendations(facilityId) {
  const { data, error } = await requireSupabase()
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
  const { error } = await requireSupabase().from('feedback_reports').insert({
    facility_id: facilityId,
    report_type: reportType,
  });

  if (error) throw error;

  // --- Presentation Hack: Auto-update occupancy by 1% ---
  if (reportType !== 'accurate') {
    // 1. Get facility capacity
    const { data: facility } = await adminSupabase
      .from('facilities')
      .select('capacity')
      .eq('id', facilityId)
      .single();

    if (!facility) return;

    // 2. Get the latest occupancy record
    const { data: records } = await adminSupabase
      .from('occupancy_records')
      .select('id, current_count')
      .eq('facility_id', facilityId)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (records && records.length > 0) {
      const latestRecord = records[0];
      const capacity = facility.capacity;
      const changeAmount = Math.max(1, Math.round(capacity * 0.01));
      
      let newCount = latestRecord.current_count;
      if (reportType === 'more_busy') newCount += changeAmount;
      if (reportType === 'less_busy') newCount -= changeAmount;
      
      // Keep within bounds
      newCount = Math.max(0, Math.min(capacity, newCount));
      
      const newScore = Math.round((newCount / capacity) * 100);
      let newStatus = 'Quiet';
      if (newScore >= 80) newStatus = 'Crowded';
      else if (newScore >= 35) newStatus = 'Moderate';

      await adminSupabase
        .from('occupancy_records')
        .update({
          current_count: newCount,
          busy_score: newScore,
          status: newStatus
        })
        .eq('id', latestRecord.id);
    }
  }
}

export async function fetchTrendSeries() {
  const { data, error } = await requireSupabase()
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
  const data = await fetchFacilities();

  // Fetch feedback reports count from database
  const { count, error } = await requireSupabase()
    .from('feedback_reports')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching feedback reports count:', error);
  }

  const congested = data.filter((item) => item.status === 'Crowded').length;
  const utilizationRate = data.length
    ? Math.round(data.reduce((sum, item) => sum + item.occupancy_rate, 0) / data.length)
    : 0;

  return {
    cards: {
      congested,
      avgSearchTime: '4.2 min',
      feedbackReports: count ?? 0,
      utilizationRate,
    },
    chart: {
      labels: data.map((item) => item.name),
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
