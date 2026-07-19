import { Link, useLocation } from 'react-router-dom';

/**
 * Consistent page header with breadcrumb navigation.
 * Shows "Dashboard > PageTitle" on all pages except dashboard itself.
 */
export default function PageHeader({ title, subtitle, backTo, action }) {
  const { pathname } = useLocation();
  const onDashboard = pathname === '/dashboard';

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      {!onDashboard && (
        <div className="flex items-center gap-1.5 mb-2">
          <Link
            to="/dashboard"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Dashboard
          </Link>
          <svg className="w-3 h-3 text-gray-400 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        </div>
      )}

      {/* Title row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Explicit back button for form pages */}
          {backTo && (
            <Link
              to={backTo}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Go back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
