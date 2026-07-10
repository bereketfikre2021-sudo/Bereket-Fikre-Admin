const ACTION_LABELS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  ACTIVATED: 'activated',
  DEACTIVATED: 'deactivated',
};

const ACTION_COLORS = {
  CREATED: 'text-green-600 dark:text-green-400',
  UPDATED: 'text-blue-600 dark:text-blue-400',
  DELETED: 'text-red-600 dark:text-red-400',
  PUBLISHED: 'text-emerald-600 dark:text-emerald-400',
  UNPUBLISHED: 'text-amber-600 dark:text-amber-400',
  ACTIVATED: 'text-emerald-600 dark:text-emerald-400',
  DEACTIVATED: 'text-amber-600 dark:text-amber-400',
};

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityFeed({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-gray-400 text-center py-4">No admin activity yet</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0 mt-0.5">
            {(log.adminName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-medium">{log.adminName || 'Admin'}</span>
              {' '}
              <span className={ACTION_COLORS[log.action] || 'text-gray-500'}>
                {ACTION_LABELS[log.action] || log.action.toLowerCase()}
              </span>
              {' '}
              <span className="text-gray-600 dark:text-gray-400">{log.entity}</span>
              {log.entityName && (
                <>
                  {' '}
                  <span className="font-medium truncate">&ldquo;{log.entityName}&rdquo;</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
