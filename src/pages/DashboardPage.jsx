import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SparklineChart from '../components/SparklineChart';

const StatCard = ({ label, value, sub, to, color = 'brand' }) => (
  <Link to={to} className="card p-5 hover:shadow-md transition-shadow group">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400 group-hover:scale-105 transition-transform inline-block`}>
      {value ?? '—'}
    </p>
    {sub !== undefined && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    )}
  </Link>
);

const AnalyticTile = ({ label, value, suffix = '' }) => (
  <div className="card p-4">
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">
      {value ?? '—'}{value != null && suffix ? <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span> : null}
    </p>
  </div>
);

const BarRow = ({ label, value, max }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{label}</span>
        <span className="text-gray-500 dark:text-gray-400 font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── First-run checklist ──────────────────────────────────────────────────────
const CHECKLIST = [
  { key: 'heroImage',  label: 'Upload hero & about images',   to: '/settings',  check: (s) => !!s?.heroImage },
  { key: 'project',   label: 'Add your first project',        to: '/projects/new',  check: (s) => (s?.projects?.total ?? 0) > 0 },
  { key: 'service',   label: 'Add a service',                 to: '/services/new',  check: (s) => (s?.services?.total ?? 0) > 0 },
  { key: 'insight',   label: 'Write a case study or blog',    to: '/insights/new',  check: (s) => (s?.insights?.total ?? 0) > 0 },
  { key: 'partner',   label: 'Add a trusted partner logo',    to: '/partners',      check: (s) => (s?.partners?.total ?? 0) > 0 },
  { key: 'faq',       label: 'Add at least one FAQ',          to: '/faqs',          check: (s) => (s?.faqs?.total ?? 0) > 0 },
];

function FirstRunChecklist({ stats, siteSettings }) {
  const combined = { ...stats, heroImage: siteSettings?.heroImage };
  const done = CHECKLIST.filter((c) => c.check(combined)).length;
  const total = CHECKLIST.length;
  if (done === total) return null; // hide once everything is done

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Get started</h2>
        <span className="text-xs text-gray-400">{done}/{total} done</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <ul className="space-y-2">
        {CHECKLIST.map((item) => {
          const completed = item.check(combined);
          return (
            <li key={item.key} className="flex items-center gap-3 text-sm">
              <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                completed
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {completed && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {completed ? (
                <span className="text-gray-400 line-through">{item.label}</span>
              ) : (
                <Link to={item.to} className="text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
                  {item.label} →
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/site-settings').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  // GA analytics — non-blocking, gracefully hidden if credentials not set
  const { data: gaData, isLoading: gaLoading, isError: gaError } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/admin/analytics/all').then((r) => r.data.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;

  const { stats, trends } = data || {};
  const ga = gaData || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of your portfolio content</p>
      </div>

      {/* First-run checklist — visible until all steps complete */}
      <FirstRunChecklist stats={stats} siteSettings={siteSettings} />

      {/* Inbox Alert */}
      {stats?.unread > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              You have <strong>{stats.unread}</strong> unread {stats.unread === 1 ? 'message' : 'messages'}
            </p>
            {/* Break down by source */}
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 opacity-75">
              {[
                stats.contacts?.new > 0 && `${stats.contacts.new} contact ${stats.contacts.new === 1 ? 'message' : 'messages'}`,
                stats.projectRequests?.new > 0 && `${stats.projectRequests.new} project ${stats.projectRequests.new === 1 ? 'request' : 'requests'}`,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
          {/* Smart links — show both if both have unread, otherwise show the one that does */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {stats.contacts?.new > 0 && (
              <Link to="/contacts" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                Messages →
              </Link>
            )}
            {stats.projectRequests?.new > 0 && (
              <Link to="/project-requests" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
                Requests →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Content Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Content</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Projects" value={stats?.projects.total} sub={`${stats?.projects.published} published`} to="/projects" />
          <StatCard label="Services" value={stats?.services.total} to="/services" />
          <StatCard label="Insights" value={stats?.insights.total} sub={`${stats?.insights.caseStudies} case studies`} to="/insights" />
          <StatCard label="Partners" value={stats?.partners.total} to="/partners" />
          <StatCard label="FAQs" value={stats?.faqs.total} to="/faqs" />
        </div>
      </div>

      {/* Inbox Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Inbox</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Contact Messages"
            value={stats?.contacts.total}
            sub={stats?.contacts.new > 0 ? `${stats.contacts.new} new` : 'All read'}
            to="/contacts"
            color={stats?.contacts.new > 0 ? 'blue' : 'brand'}
          />
          <StatCard
            label="Project Requests"
            value={stats?.projectRequests.total}
            sub={stats?.projectRequests.new > 0 ? `${stats.projectRequests.new} new` : 'All read'}
            to="/project-requests"
            color={stats?.projectRequests.new > 0 ? 'blue' : 'brand'}
          />
        </div>
      </div>

      {/* 30-day Trends */}
      {trends && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">30-Day Trends</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SparklineChart
              data={trends.contacts}
              color="brand"
              label="Contact Messages"
              total={stats?.contacts.total}
            />
            <SparklineChart
              data={trends.requests}
              color="blue"
              label="Project Requests"
              total={stats?.projectRequests.total}
            />
          </div>
        </div>
      )}

      {/* Google Analytics Section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Website Analytics
          {ga?.realtime?.activeUsers != null && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 normal-case">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {ga.realtime.activeUsers} active now
            </span>
          )}
        </h2>

        {gaLoading ? (
          <div className="card p-6 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading analytics...</span>
          </div>
        ) : gaError ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analytics not available — add GA credentials to Render environment variables.
            </p>
            <p className="text-xs text-gray-400 mt-1">GA_PROPERTY_ID · GA_CLIENT_EMAIL · GA_PRIVATE_KEY</p>
          </div>
        ) : ga ? (
          <div className="space-y-4">
            {/* Visitor overview tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AnalyticTile label="Today" value={ga.overview.visitorsToday?.toLocaleString()} />
              <AnalyticTile label="This Week" value={ga.overview.visitorsThisWeek?.toLocaleString()} />
              <AnalyticTile label="This Month" value={ga.overview.visitorsThisMonth?.toLocaleString()} />
              <AnalyticTile label="Total Users" value={ga.overview.totalUsers?.toLocaleString()} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <AnalyticTile label="Page Views" value={ga.overview.pageViews?.toLocaleString()} />
              <AnalyticTile label="Avg Session" value={ga.overview.avgSessionDuration} suffix="s" />
              <AnalyticTile label="Bounce Rate" value={ga.overview.bounceRate} suffix="%" />
            </div>

            {/* Bottom grid: top pages, traffic sources, countries, devices */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="card p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Top Pages</h3>
                {ga.topPages?.slice(0, 6).map((p, i) => (
                  <BarRow key={i} label={p.dimension || '/'} value={p.value} max={ga.topPages[0]?.value || 1} />
                ))}
              </div>
              <div className="card p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Traffic Sources</h3>
                {ga.trafficSources?.slice(0, 6).map((s, i) => (
                  <BarRow key={i} label={s.dimension} value={s.value} max={ga.trafficSources[0]?.value || 1} />
                ))}
              </div>
              <div className="card p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Countries</h3>
                {ga.countries?.slice(0, 6).map((c, i) => (
                  <BarRow key={i} label={c.dimension} value={c.value} max={ga.countries[0]?.value || 1} />
                ))}
              </div>
              <div className="space-y-4">
                <div className="card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Devices</h3>
                  {ga.devices?.map((d, i) => (
                    <BarRow key={i} label={d.dimension} value={d.value} max={ga.devices[0]?.value || 1} />
                  ))}
                </div>
                <div className="card p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Browsers</h3>
                  {ga.browsers?.slice(0, 4).map((b, i) => (
                    <BarRow key={i} label={b.dimension} value={b.value} max={ga.browsers[0]?.value || 1} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
}
