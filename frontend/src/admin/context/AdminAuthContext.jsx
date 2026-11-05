import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, ROLES } from '../utils/constants';
import { getStoredItem, setStoredItem } from '../services/storageService';
import api from '../services/api.js';
import { hasPermission } from '../utils/permissions';
import toast from 'react-hot-toast';

export const AdminAuthContext = createContext(null);

function readAuth() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH_ADMIN) || 'null');
    if (saved?.isAuthenticated && saved.token) return saved;
  } catch (error) { console.error('Failed to parse admin auth data', error); }
  return { isAuthenticated: false, user: null, token: null };
}

export const AdminAuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(readAuth);
  const [authReady, setAuthReady] = useState(() => !readAuth().token);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [badgeCounts, setBadgeCounts] = useState({ usersCount: 0, unansweredQuestions: 0, upcomingSessions: 0, pendingReports: 0 });

  useEffect(() => {
    for (const key of [STORAGE_KEYS.USERS, STORAGE_KEYS.QUESTIONS, STORAGE_KEYS.DISCUSSIONS, STORAGE_KEYS.SESSIONS, STORAGE_KEYS.REPORTS, STORAGE_KEYS.ACTIVITIES]) localStorage.removeItem(key);
  }, []);

  useEffect(() => {
    let active = true;
    if (!authData.token) { setAuthReady(true); return () => { active = false; }; }
    setAuthReady(false);
    (async () => {
      const response = await api.get('/admin/auth/me');
      const authenticated = { ...authData, isAuthenticated: true, user: response.data.admin };
      if (!active) return;
      setAuthData(authenticated);
      setStoredItem(STORAGE_KEYS.AUTH_ADMIN, authenticated);
      if (!active) return;
      const [users, questions, discussions, sessions] = await Promise.all([api.get('/admin/users'), api.get('/admin/questions'), api.get('/admin/discussions'), api.get('/admin/sessions')]);
      for (const [key, value] of [[STORAGE_KEYS.USERS, users.data], [STORAGE_KEYS.QUESTIONS, questions.data], [STORAGE_KEYS.DISCUSSIONS, discussions.data], [STORAGE_KEYS.SESSIONS, sessions.data]]) {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('learnconnect_storage_update', { detail: { key, value } }));
      }
    })().catch(() => {
      if (!active) return;
      const cleared = { isAuthenticated: false, user: null, token: null };
      setAuthData(cleared);
      setStoredItem(STORAGE_KEYS.AUTH_ADMIN, cleared);
    }).finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, [authData.token]);

  const refreshBadgeCounts = () => {
    try {
      const users = getStoredItem(STORAGE_KEYS.USERS, []);
      const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
      const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
      const reports = [];
      setBadgeCounts({
        usersCount: users.length,
        unansweredQuestions: questions.filter(q => q.status === 'Unanswered').length,
        upcomingSessions: sessions.filter(s => s.status === 'Upcoming' || s.status === 'Ongoing').length,
        pendingReports: reports.filter(r => r.status === 'Pending' || r.status === 'Under Review').length,
      });
    } catch { /* Ignore malformed dashboard badges. */ }
  };

  useEffect(() => {
    refreshBadgeCounts();
    const handleStorageChange = () => refreshBadgeCounts();
    window.addEventListener('learnconnect_storage_update', handleStorageChange);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorageChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(previous => previous === 'dark' ? 'light' : 'dark');

  const login = async (email, password) => {
    if (!email || !password) { toast.error('Please enter both email and password'); return false; }
    try {
      const response = await api.post('/admin/auth/login', { email, password });
      const newAuth = { isAuthenticated: true, user: response.data.admin, token: response.data.token, expiresAt: response.data.expiresAt };
      localStorage.setItem(STORAGE_KEYS.AUTH_ADMIN, JSON.stringify(newAuth));
      setAuthData(newAuth);
      const [users, questions, discussions, sessions] = await Promise.all([api.get('/admin/users'), api.get('/admin/questions'), api.get('/admin/discussions'), api.get('/admin/sessions')]);
      for (const [key, value] of [[STORAGE_KEYS.USERS, users.data], [STORAGE_KEYS.QUESTIONS, questions.data], [STORAGE_KEYS.DISCUSSIONS, discussions.data], [STORAGE_KEYS.SESSIONS, sessions.data]]) {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('learnconnect_storage_update', { detail: { key, value } }));
      }
      toast.success(`Welcome back, ${newAuth.user.name}!`);
      return true;
    } catch (error) { toast.error(error.message); return false; }
  };

  const logout = () => {
    api.post('/admin/auth/logout').catch(() => {});
    const cleared = { isAuthenticated: false, user: null, token: null };
    setAuthData(cleared);
    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, cleared);
    toast.success('Logged out successfully');
  };

  const updateProfile = () => { toast.error('Admin profile changes must be made in the server configuration.'); return authData.user; };

  const checkPermission = permission => hasPermission(authData.user?.role, permission);

  return <AdminAuthContext.Provider value={{
    admin: authData.user,
    role: authData.user?.role || null,
    isAuthenticated: authData.isAuthenticated,
    authReady,
    theme,
    badgeCounts,
    toggleTheme,
    login,
    logout,
    updateProfile,
    checkPermission,
    refreshBadgeCounts,
  }}>{children}</AdminAuthContext.Provider>;
};

export default AdminAuthProvider;
