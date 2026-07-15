/**
 * useUnsavedChanges
 * Warns the user if they try to navigate away with unsaved changes.
 *
 * Usage:
 *   const { markDirty, markClean } = useUnsavedChanges(isDirty);
 *
 * - Pass `isDirty` (boolean) — true when form has been modified but not saved.
 * - Blocks browser tab-close/refresh via beforeunload.
 * - Blocks React Router navigation via a custom confirm prompt.
 *
 * Call markClean() before programmatic navigation (e.g. after successful save)
 * so the guard doesn't fire on deliberate exits.
 */

import { useEffect, useCallback, useRef } from 'react';

export function useUnsavedChanges(isDirty) {
  const dirtyRef = useRef(isDirty);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  // Block browser tab-close / refresh
  useEffect(() => {
    const handler = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return { isDirty };
}

/**
 * useFormSaveShortcut
 * Triggers a save callback when the user presses Cmd+S / Ctrl+S.
 * Pass the form's submit handler as `onSave`.
 */
export function useFormSaveShortcut(onSave) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSave]);
}

/**
 * UnsavedBanner — shows a sticky banner when form is dirty.
 * Purely presentational — import and render in form pages.
 */
export function UnsavedBanner({ isDirty }) {
  if (!isDirty) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700 rounded-xl px-4 py-2.5 shadow-lg text-sm text-yellow-800 dark:text-yellow-200 pointer-events-none">
      <svg className="w-4 h-4 flex-shrink-0 text-yellow-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      Unsaved changes — press Ctrl+S / ⌘S to save
    </div>
  );
}
