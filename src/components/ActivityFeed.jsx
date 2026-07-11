/**
 * ActivityFeed — renders a list of admin activity log entries
 * Props:
 *   items: ActivityLog[] from /api/admin/dashboard → recentActivity.activityLog
 */

const ACTION_STYLES = {
  CREATED:          { color: 'text-green-600  dark:text-green-400',  bg: 'bg-green-100  dark:bg-green-900/30',  icon: '✚' },
  UPDATED:          { color: 'text-blue-600   dark:text-blue-400',   bg: 'bg-blue-100   dark:bg-blue-900/30',   icon: '✎' },
  DELETED:          { color: 'text-red-600    dark:text-red-400',    bg: 'bg-red-100    dark:bg-red-900/30',    icon: '✕' },
  PUBLISHED:        { color: 'text-brand-600  dark:text-brand-400',  bg: 'bg-brand-100  dark:bg-brand-900/30', icon: '●' },
  UNPUBLISHED:      { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30',icon: '○' },
  UPLOADED:         { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30',icon: '↑' },
  LOGIN:            { color: 'text-gray-600   dark:text-gray-400',   bg: 'bg-gray-100   dark:bg-gray-800',     icon: '→' },
  LOGOUT:           { color: 'text-gray-600   dark:text-gray-400',   bg: 'bg-gray-100   dark:bg-gray-800',     icon: '←' },
  PASSWORD_CHANGED: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30',icon: '🔑'},
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function ActivityFeed({ items }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
        No activity yet — actions will appear here
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const style = ACTION_STYLES[item.action] || ACTION_STYLES.UPDATED;
        return (
          <div key={item.id} className="flex items-start gap-2.5">
            {/* Action badge */}
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${style.bg} ${style.color}`}>
              {style.icon}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                <span className={`font-semibold ${style.color}`}>{item.action}</span>
                {' '}
                <span className="font-medium text-gray-900 dark:text-white">{item.entity}</span>
                {item.entityName && (
                  <span className="text-gray-500 dark:text-gray-400"> — {item.entityName}</span>
                )}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {item.adminName} · {timeAgo(item.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
