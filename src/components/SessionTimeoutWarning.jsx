/**
 * SessionTimeoutWarning
 * Reads the JWT access token expiry and warns the user 2 minutes before it expires.
 * Shows a modal with a "Stay logged in" button that silently refreshes the token.
 * If the user ignores it and the token expires, the api.js interceptor redirects to /login.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const WARN_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before expiry

function getTokenExpiry() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}

export default function SessionTimeoutWarning() {
  const { logout } = useAuth();
  const [show, setShow] = useState(false);
  const [extending, setExtending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);

  const scheduleCheck = useCallback(() => {
    const expiry = getTokenExpiry();
    if (!expiry) return;

    const msUntilWarn = expiry - Date.now() - WARN_BEFORE_MS;
    if (msUntilWarn <= 0) {
      // Already in warning window — show immediately
      setSecondsLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
      setShow(true);
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
      setShow(true);
    }, msUntilWarn);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = scheduleCheck();
    return cleanup;
  }, [scheduleCheck]);

  // Countdown ticker when modal is visible
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      const expiry = getTokenExpiry();
      if (!expiry) return;
      const secs = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs <= 0) {
        clearInterval(interval);
        setShow(false);
        logout();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [show, logout]);

  const handleExtend = async () => {
    setExtending(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const { data } = await api.post(`${BASE_URL.replace('/api', '')}/api/auth/refresh`, { refreshToken });
      localStorage.setItem('accessToken', data.data.accessToken);
      setShow(false);
      toast.success('Session extended');
      // Re-schedule the next warning
      scheduleCheck();
    } catch {
      toast.error('Could not extend session. Please log in again.');
      logout();
    } finally {
      setExtending(false);
    }
  };

  if (!show) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = secondsLeft > 60
    ? `${mins}m ${secs}s`
    : `${secondsLeft}s`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="card max-w-sm w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Session expiring soon</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">You'll be logged out in <span className="font-bold text-yellow-600 dark:text-yellow-400">{timeStr}</span></p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Any unsaved changes will be lost. Click below to stay logged in.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExtend}
            disabled={extending}
            className="btn-primary flex-1 justify-center text-sm"
          >
            {extending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Extending...</>
            ) : 'Stay logged in'}
          </button>
          <button onClick={logout} className="btn-secondary text-sm">Log out</button>
        </div>
      </div>
    </div>
  );
}
