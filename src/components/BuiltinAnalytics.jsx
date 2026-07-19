import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// ── Shared UI helpers ─────────────────────────────────────────────────────────
const Tile = ({ label, value, sub, accent }) => (
  <div className="card p-4">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white'}`}>
      {value ?? '—'}
    </p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const SectionHeader = ({ title, badge }) => (
  <div className="flex items-center gap-2 mb-3">
    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h2>
    {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium">{badge}</span>}
  </div>
);

const BarRow = ({ label, value, max, color = 'bg-brand-500' }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[65%] capitalize">{label || 'Unknown'}</span>
        <span className="text-gray-500 dark:text-gray-400 font-medium tabular-nums">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const fmtDuration = (secs) => {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function BuiltinAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['builtin-analytics'],
    queryFn: () => api.get('/admin/analytics/builtin/all').then(r => r.data.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // refresh every minute for live data
  });

  if (isLoading) return (
    <div className="card p-6 flex items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-400">Loading built-in analytics...</span>
    </div>
  );

  if (isError || !data) return (
    <div className="card p-5 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">Built-in analytics data unavailable.</p>
      <p className="text-xs text-gray-400 mt-1">Visitors will be tracked once the frontend is deployed.</p>
    </div>
  );

  const { overview, trend7, trend30, devices, browsers, countries, sections, conversions, live, health } = data;

  const maxTrend7  = Math.max(...(trend7  || []).map(d => d.count), 1);
  const maxTrend30 = Math.max(...(trend30 || []).map(d => d.count), 1);

  return (
    <div className="space-y-6">

      {/* ── Live ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>{live?.activeSessions ?? 0}</strong> active visitor{live?.activeSessions !== 1 ? 's' : ''} right now
          {live?.latestVisitor?.country && <span className="opacity-70"> · last from {live.latestVisitor.country}</span>}
          {live?.recentSection?.target && <span className="opacity-70"> · viewing <strong>{live.recentSection.target}</strong></span>}
        </p>
      </div>

      {/* ── Overview tiles ───────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Visitor Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Tile label="Total Sessions"    value={overview?.totalSessions?.toLocaleString()}     accent />
          <Tile label="Unique Visitors"   value={overview?.uniqueVisitors?.toLocaleString()} />
          <Tile label="Returning"         value={overview?.returningVisitors?.toLocaleString()} />
          <Tile label="Active Now"        value={overview?.activeNow}                            accent />
          <Tile label="Today"             value={overview?.newVisitorsToday?.toLocaleString()} />
          <Tile label="This Week"         value={overview?.visitorsThisWeek?.toLocaleString()} />
          <Tile label="This Month"        value={overview?.visitorsThisMonth?.toLocaleString()} />
          <Tile label="Avg Session"       value={fmtDuration(overview?.avgSessionDuration)} sub={`${overview?.bounceRate ?? 0}% bounce`} />
        </div>
      </div>

      {/* ── Trends ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Visitors — Last 7 Days</h3>
          <div className="flex items-end gap-1 h-20">
            {(trend7 || []).map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                <div
                  className="w-full bg-brand-500 rounded-sm transition-all"
                  style={{ height: `${maxTrend7 > 0 ? Math.max(4, (d.count / maxTrend7) * 72) : 4}px` }}
                />
                <span className="text-[9px] text-gray-400 hidden sm:block">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Visitors — Last 30 Days</h3>
          <div className="flex items-end gap-0.5 h-20">
            {(trend30 || []).map((d) => (
              <div key={d.date} className="flex-1" title={`${d.date}: ${d.count}`}>
                <div
                  className="w-full bg-brand-400 rounded-sm"
                  style={{ height: `${maxTrend30 > 0 ? Math.max(2, (d.count / maxTrend30) * 72) : 2}px` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Breakdowns ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Devices</h3>
          {(devices || []).map((r, i) => <BarRow key={i} label={r.dimension} value={r.value} max={devices[0]?.value || 1} />)}
        </div>
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Browsers</h3>
          {(browsers || []).slice(0, 6).map((r, i) => <BarRow key={i} label={r.dimension} value={r.value} max={browsers[0]?.value || 1} color="bg-blue-500" />)}
        </div>
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Countries</h3>
          {(countries || []).slice(0, 6).map((r, i) => <BarRow key={i} label={r.dimension} value={r.value} max={countries[0]?.value || 1} color="bg-purple-500" />)}
        </div>
      </div>

      {/* ── Section popularity ────────────────────────────────────────────── */}
      {sections?.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Section Popularity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sections.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium text-gray-800 dark:text-gray-200">{s.section}</span>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{s.totalViews} views</span>
                  <span>{s.uniqueViews} unique</span>
                  <span>{fmtDuration(s.avgTimeSpent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversions ───────────────────────────────────────────────────── */}
      {conversions?.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conversions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {conversions.map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">{c.action?.replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{c.count}</p>
                <p className="text-xs text-brand-600 dark:text-brand-400">{c.rate}% rate</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── System health ─────────────────────────────────────────────────── */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">System Health</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Database</p>
            <span className={`inline-flex items-center gap-1.5 font-medium ${health?.database?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health?.database?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              {health?.database?.status === 'ok' ? 'Connected' : 'Error'}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">{health?.database?.latencyMs}ms latency</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">API</p>
            <span className="inline-flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Online
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Uptime</p>
            <p className="font-medium text-gray-900 dark:text-white">{fmtDuration(health?.api?.uptimeSeconds)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Memory</p>
            <p className="font-medium text-gray-900 dark:text-white">{health?.server?.memoryMB ?? '—'} MB</p>
            <p className="text-xs text-gray-400">{health?.server?.nodeVersion}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
