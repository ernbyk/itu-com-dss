import { useEffect, useMemo, useState } from 'react';
import {
  BarChart2,
  Book,
  BookOpen,
  Clock,
  LayoutDashboard,
  List,
  Map,
  PieChart,
  Search,
  Settings,
  Sparkles,
  User,
  Utensils,
  X,
} from 'lucide-react';
import {
  Bar,
  Line,
} from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import {
  fetchAdminAnalytics,
  fetchFacilities,
  fetchFacilityForecast,
  fetchRecommendations,
  fetchTrendSeries,
  submitFeedback,
} from './services/comDssApi';
import { isSupabaseConfigured } from './lib/supabase';

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

const studentNav = [
  { id: 'map', icon: Map, label: 'Live Campus Map' },
  { id: 'list', icon: List, label: 'Browse Facilities' },
  { id: 'trends', icon: BarChart2, label: 'Historical Trends' },
];

const adminNav = [
  { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Overview' },
  { id: 'admin-analytics', icon: PieChart, label: 'Structural Analytics' },
  { id: 'admin-settings', icon: Settings, label: 'System Config' },
];

const statusClass = {
  Quiet: 'status-quiet',
  Moderate: 'status-moderate',
  Crowded: 'status-crowded',
};

const statusColor = {
  Quiet: 'bg-green-500',
  Moderate: 'bg-orange-500',
  Crowded: 'bg-red-500',
};

function FacilityIcon({ facility, className = 'w-5 h-5' }) {
  const Icon = facility.category === 'Eating' ? Utensils : BookOpen;
  return <Icon className={`${className} text-emerald-400`} />;
}

function App() {
  const [currentRole, setCurrentRole] = useState('student');
  const [activePage, setActivePage] = useState('map');
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendSeries, setTrendSeries] = useState({ labels: [], values: [] });
  const [adminAnalytics, setAdminAnalytics] = useState(null);

  const loadAppData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError('Supabase environment variables are not configured yet.');
      return;
    }

    try {
      setLoading(true);
      const [facilityData, trendData, analyticsData] = await Promise.all([
        fetchFacilities(),
        fetchTrendSeries(),
        fetchAdminAnalytics(),
      ]);
      setFacilities(facilityData);
      setTrendSeries(trendData);
      setAdminAnalytics(analyticsData);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  const filteredFacilities = useMemo(() => facilities, [facilities]);

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setActivePage(role === 'admin' ? 'admin-dashboard' : 'map');
  };

  const navItems = currentRole === 'student' ? studentNav : adminNav;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex space-x-2 rounded-full border border-stone-700 bg-stone-900 p-2 shadow-2xl">
        <button
          onClick={() => handleRoleChange('student')}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${currentRole === 'student'
              ? 'bg-stone-700 text-white'
              : 'text-stone-400 hover:text-white'
            }`}
        >
          STUDENT VIEW
        </button>
        <button
          onClick={() => handleRoleChange('admin')}
          className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${currentRole === 'admin'
              ? 'bg-stone-700 text-white'
              : 'text-stone-400 hover:text-white'
            }`}
        >
          ADMIN PORTAL
        </button>
      </div>

      <div className="flex h-screen">
        <aside className="flex w-64 flex-col border-r border-stone-800 bg-stone-950/50">
          <div className="p-6">
            <div className="mb-8 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-xl font-bold shadow-lg shadow-emerald-900/20">
                C
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">COM-DSS</h1>
                <p className="text-[10px] uppercase leading-none tracking-widest text-stone-500">
                  ITU Ayazağa Campus
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${activePage === item.id
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'text-stone-400 hover:bg-stone-800'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-stone-800 p-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-400">
                <User className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-medium text-stone-300">
                  {currentRole === 'admin' ? 'Admin: Facility Mgr.' : 'Anonymous User'}
                </p>
                <p className="text-stone-500">ITU-Net Connected</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b border-stone-800 bg-stone-950/20 px-8">
            <div className="flex max-w-xl flex-1 items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search facilities, study rooms..."
                  className="w-full rounded-lg border border-stone-800 bg-stone-900 py-2 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-stone-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>LIVE SYSTEM STATUS</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#0c0a09] p-8">
            <AppContent
              activePage={activePage}
              adminAnalytics={adminAnalytics}
              error={error}
              facilities={filteredFacilities}
              loading={loading}
              onSelectFacility={setSelectedFacility}
              trendSeries={trendSeries}
            />
          </div>
        </main>
      </div>

      {selectedFacility && (
        <FacilityModal
          facilities={facilities}
          facility={selectedFacility}
          onClose={() => setSelectedFacility(null)}
          onRefresh={loadAppData}
        />
      )}
    </>
  );
}

function AppContent({
  activePage,
  adminAnalytics,
  error,
  facilities,
  loading,
  onSelectFacility,
  trendSeries,
}) {
  if (loading) {
    return <StatePanel title="Loading live campus data" body="Connecting to Supabase..." />;
  }

  if (error) {
    return <StatePanel title="Data connection needed" body={error} />;
  }

  if (activePage === 'map') {
    return <CampusMap facilities={facilities} onSelectFacility={onSelectFacility} />;
  }

  if (activePage === 'list') {
    return <FacilityGrid facilities={facilities} onSelectFacility={onSelectFacility} />;
  }

  if (activePage === 'trends') {
    return <Trends trendSeries={trendSeries} />;
  }

  if (activePage === 'admin-dashboard' || activePage === 'admin-analytics') {
    return <AdminDashboard analytics={adminAnalytics} />;
  }

  return (
    <div className="glass-panel p-8">
      <h2 className="mb-2 text-xl font-bold">System Config</h2>
      <p className="text-sm text-stone-400">
        Configuration is managed through Supabase tables and Vercel environment variables.
      </p>
    </div>
  );
}

function StatePanel({ title, body }) {
  return (
    <div className="glass-panel p-8">
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      <p className="text-sm text-stone-400">{body}</p>
    </div>
  );
}

function CampusMap({ facilities, onSelectFacility }) {
  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Interactive Campus View</h2>
        <div className="flex space-x-4 text-xs font-semibold">
          <Legend color="bg-green-500" label="Quiet" />
          <Legend color="bg-orange-500" label="Moderate" />
          <Legend color="bg-red-500" label="Crowded" />
        </div>
      </div>
      <div className="itu-gradient relative flex-1 overflow-hidden rounded-3xl border border-stone-800 p-8">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)',
            backgroundSize: '20px 20px',
          }}
        />
        {facilities.map((facility) => (
          <button
            key={facility.id}
            onClick={() => onSelectFacility(facility)}
            className="absolute cursor-pointer transition-all hover:scale-110"
            style={{ left: `${facility.map_x}%`, top: `${facility.map_y}%` }}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 shadow-2xl ${statusColor[facility.status]
                  } ${facility.status === 'Crowded' ? 'animate-pulse' : ''}`}
              >
                {facility.category === 'Eating' ? (
                  <Utensils className="h-4 w-4 text-white" />
                ) : (
                  <Book className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="mt-2 rounded border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter backdrop-blur-md">
                {facility.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center">
      <span className={`mr-2 h-3 w-3 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function FacilityGrid({ facilities, onSelectFacility }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {facilities.map((facility) => (
        <button
          key={facility.id}
          onClick={() => onSelectFacility(facility)}
          className="glass-panel group cursor-pointer p-6 text-left transition-all hover:border-emerald-500/50"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-stone-800 p-2 transition-all group-hover:bg-emerald-500/20">
              <FacilityIcon facility={facility} />
            </div>
            <span
              className={`rounded border px-2 py-1 text-[10px] font-bold uppercase ${statusClass[facility.status]
                }`}
            >
              {facility.status}
            </span>
          </div>
          <h3 className="mb-1 text-lg font-bold">{facility.name}</h3>
          <p className="mb-4 text-sm text-stone-500">
            {facility.category} • {facility.hours}
          </p>
          <OccupancyBar facility={facility} />
        </button>
      ))}
    </div>
  );
}

function OccupancyBar({ facility }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-stone-400">
        <span>Current Occupancy</span>
        <span>{facility.occupancy_rate}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-800">
        <div
          className={`h-full ${statusColor[facility.status]}`}
          style={{ width: `${facility.occupancy_rate}%` }}
        />
      </div>
    </div>
  );
}

function Trends({ trendSeries }) {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-8">
        <h2 className="mb-6 text-xl font-bold">Typical Weekly Crowding: Mustafa İnan Library</h2>
        <div className="h-[400px]">
          <Line
            data={{
              labels: trendSeries.labels,
              datasets: [
                {
                  data: trendSeries.values,
                  borderColor: '#10b981',
                  tension: 0.4,
                  fill: true,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { color: '#78716c' } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ analytics }) {
  const cards = analytics?.cards ?? {
    congested: 0,
    avgSearchTime: '0 min',
    feedbackReports: 0,
    utilizationRate: 0,
  };
  const chart = analytics?.chart ?? { labels: [], values: [], colors: [] };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Congested Areas" value={cards.congested} tone="text-red-400" />
        <Metric label="Avg. Search Time" value={cards.avgSearchTime} tone="text-emerald-400" />
        <Metric label="Feedback Reports" value={cards.feedbackReports} />
        <Metric label="Utilization Rate" value={`${cards.utilizationRate}%`} />
      </div>
      <div className="glass-panel p-8">
        <h3 className="mb-4 font-bold">Structural Utilization Trends</h3>
        <Bar
          data={{
            labels: chart.labels,
            datasets: [
              {
                data: chart.values,
                backgroundColor: chart.colors,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { grid: { color: '#292524' }, ticks: { color: '#78716c' } },
              x: { grid: { display: false }, ticks: { color: '#78716c' } },
            },
          }}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, tone = '' }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-xs font-bold uppercase text-stone-500">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function FacilityModal({ facilities, facility, onClose, onRefresh }) {
  const [forecast, setForecast] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [feedbackState, setFeedbackState] = useState('');

  useEffect(() => {
    async function loadDetails() {
      const [forecastData, recommendationData] = await Promise.all([
        fetchFacilityForecast(facility.id),
        fetchRecommendations(facility.id),
      ]);
      setForecast(forecastData);
      setRecommendation(recommendationData);
    }

    loadDetails().catch(() => {
      const fallback = facilities.find(
        (item) => item.status === 'Quiet' && item.category === facility.category,
      );
      setRecommendation(
        fallback
          ? {
            reason: `${facility.name} is currently crowded. Try this quieter alternative nearby:`,
            target_facility: fallback,
          }
          : null,
      );
    });
  }, [facilities, facility]);

  const handleFeedback = async (reportType) => {
    try {
      setFeedbackState('Sending...');
      await submitFeedback({ facilityId: facility.id, reportType });
      setFeedbackState('Thanks, report received.');
      if (onRefresh) {
        await onRefresh();
      }
    } catch (feedbackError) {
      setFeedbackState(feedbackError.message);
    }
  };

  const bars = forecast.length
    ? forecast.map((item) => Math.round((item.current_count / facility.capacity) * 100))
    : [40, 50, 80, 100, 90, 70, 30];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-stone-700 bg-stone-900 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="mb-6 rounded-full p-2 transition-colors hover:bg-stone-800"
          aria-label="Close details"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-8">
          <span
            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase ${statusClass[facility.status]
              }`}
          >
            {facility.status}
          </span>
          <h2 className="mt-4 text-3xl font-bold">{facility.name}</h2>
          <p className="mt-2 flex items-center text-stone-400">
            <Clock className="mr-2 h-4 w-4" />
            Open Today: {facility.hours}
          </p>
        </div>

        <div className="glass-panel mb-6 p-6">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-stone-500">
            Live Density Validation
          </p>
          <div className="flex items-center justify-between space-x-2">
            {[
              ['less_busy', 'Less Busy'],
              ['accurate', 'Accurate'],
              ['more_busy', 'More Busy'],
            ].map(([type, label]) => (
              <button
                key={type}
                onClick={() => handleFeedback(type)}
                className={`flex-1 rounded border py-2 text-[10px] transition-all ${type === 'accurate'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-stone-700 hover:bg-stone-800'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          {feedbackState && <p className="mt-3 text-center text-xs text-stone-400">{feedbackState}</p>}
        </div>

        {recommendation?.target_facility && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <div className="mb-3 flex items-center text-emerald-400">
              <Sparkles className="mr-2 h-4 w-4" />
              <p className="text-xs font-bold uppercase">Smart Recommendation</p>
            </div>
            <p className="mb-4 text-sm text-stone-300">
              {recommendation.reason ||
                `${facility.name} is currently crowded. Try this quieter alternative nearby:`}
            </p>
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/10 bg-stone-900/50 p-4">
              <div>
                <p className="text-sm font-bold">{recommendation.target_facility.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-500">
                  Alternative Facility
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase text-stone-500">Usage Forecast</h4>
          <div className="flex h-40 items-end space-x-2 border-b border-stone-800 pb-2">
            {bars.map((value, index) => (
              <div
                key={`${value}-${index}`}
                className={`flex-1 rounded-t-sm ${value >= 95 ? 'bg-red-500' : 'bg-stone-700'}`}
                style={{ height: `${Math.min(value, 100)}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-stone-600">
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>00:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
