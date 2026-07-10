import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';

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

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;

  const { stats, recentActivity } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of your portfolio content</p>
      </div>

      {/* Inbox Alert */}
      {stats?.unread > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              You have <strong>{stats.unread}</strong> unread {stats.unread === 1 ? 'message' : 'messages'}
            </p>
          </div>
          <Link to="/contacts" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">View →</Link>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Admin Activity Feed */}
        <div className="card p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <ActivityFeed items={recentActivity?.adminActions} />
        </div>

        {/* Recent Contacts */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Messages</h3>
            <Link to="/contacts" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
          </div>
          {recentActivity?.contacts?.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.contacts.map((c) => (
                <Link
                  key={c.id}
                  to="/contacts"
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300 flex-shrink-0 mt-0.5">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.subject}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
          )}
        </div>

        {/* Recent Project Requests */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Project Requests</h3>
            <Link to="/project-requests" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all</Link>
          </div>
          {recentActivity?.projectRequests?.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.projectRequests.map((r) => (
                <Link
                  key={r.id}
                  to="/project-requests"
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300 flex-shrink-0 mt-0.5">
                    {r.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.firstName} {r.lastName}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.serviceNeeded}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No requests yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
