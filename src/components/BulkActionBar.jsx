/**
 * BulkActionBar
 * Appears above the table when one or more rows are selected.
 *
 * Props:
 *   count        {number}    how many items are selected
 *   onPublish    {function}  bulk publish handler
 *   onUnpublish  {function}  bulk unpublish handler
 *   onDelete     {function}  bulk delete handler
 *   onClear      {function}  deselect all
 *   loading      {boolean}   disables buttons while in-flight
 */
export default function BulkActionBar({ count, onPublish, onUnpublish, onDelete, onClear, loading }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg mb-3 flex-wrap">
      {/* Selection count */}
      <span className="text-sm font-medium text-brand-700 dark:text-brand-300 flex-shrink-0">
        {count} selected
      </span>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Publish */}
        <button
          onClick={onPublish}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Publish
        </button>

        {/* Unpublish → Draft */}
        <button
          onClick={onUnpublish}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Set Draft
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          Delete
        </button>
      </div>

      {/* Clear selection */}
      <button
        onClick={onClear}
        className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
      >
        Clear
      </button>
    </div>
  );
}
