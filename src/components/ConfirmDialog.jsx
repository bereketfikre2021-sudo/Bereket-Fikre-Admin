import { useEffect, useRef } from 'react';

/**
 * Reusable confirmation dialog
 * Props: isOpen, title, message, onConfirm, onCancel, loading, danger
 */
export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading, danger = true }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (isOpen) confirmRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="card max-w-md w-full p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
            <svg className={`w-5 h-5 ${danger ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 id="confirm-title" className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {title || 'Are you sure?'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message || 'This action cannot be undone.'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting...</>
            ) : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
