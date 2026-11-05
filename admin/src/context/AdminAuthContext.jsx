import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, ROLES } from '../utils/constants';
import { INITIAL_ADMIN_PROFILE } from '../data/mockData';
import { initializeStorage, getStoredItem, setStoredItem } from '../services/storageService';
import { hasPermission } from '../utils/permissions';
import toast from 'react-hot-toast';

export const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  // Ensure default datasets are seeded
  useEffect(() => {
    initializeStorage();
  }, []);

  const [authData, setAuthData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_ADMIN);
      if (stored) return JSON.parse(stored);
    } catch (err) {
      console.error('Failed to parse auth data', err);
    }
    return {
      isAuthenticated: true,
      user: INITIAL_ADMIN_PROFILE,
      token: 'demo_jwt_token_learnconnect_superadmin',
    };
  });

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [badgeCounts, setBadgeCounts] = useState({
    usersCount: 0,
    unansweredQuestions: 0,
    upcomingSessions: 0,
    pendingReports: 0,
  });

  // Calculate badges from storage
  const refreshBadgeCounts = () => {
    try {
      const users = getStoredItem(STORAGE_KEYS.USERS, []);
      const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
      const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
      const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);

      setBadgeCounts({
        usersCount: users.length,
        unansweredQuestions: questions.filter(q => q.status === 'Unanswered').length,
        upcomingSessions: sessions.filter(s => s.status === 'Upcoming' || s.status === 'Ongoing').length,
        pendingReports: reports.filter(r => r.status === 'Pending' || r.status === 'Under Review').length,
      });
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    refreshBadgeCounts();
    const handleStorageChange = () => refreshBadgeCounts();
    window.addEventListener('learnconnect_storage_update', handleStorageChange);
    return () => window.removeEventListener('learnconnect_storage_update', handleStorageChange);
  }, []);

  // Theme synchronization with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (email, password) => {
    // Realistic auth validation
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return false;
    }

    const updatedUser = {
      ...INITIAL_ADMIN_PROFILE,
      email,
      lastLogin: new Date().toISOString(),
    };

    const newAuth = {
      isAuthenticated: true,
      user: updatedUser,
      token: `token_${Date.now()}`,
    };

    setAuthData(newAuth);
    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, newAuth);
    toast.success(`Welcome back, ${updatedUser.name}!`);
    return true;
  };

  const logout = () => {
    const cleared = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
    setAuthData(cleared);
    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, cleared);
    toast.success('Logged out successfully');
  };

  const updateProfile = (profileData) => {
    const updatedUser = {
      ...authData.user,
      ...profileData,
    };
    const newAuth = {
      ...authData,
      user: updatedUser,
    };
    setAuthData(newAuth);
    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, newAuth);
    toast.success('Admin profile updated successfully');
    return updatedUser;
  };

  // Switch demo roles dynamically (Super Admin / Admin / Moderator)
  const setRole = (newRole) => {
    if (!Object.values(ROLES).includes(newRole)) return;
    const updatedUser = {
      ...authData.user,
      role: newRole,
    };
    const newAuth = {
      ...authData,
      user: updatedUser,
    };
    setAuthData(newAuth);
    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, newAuth);
    toast.success(`Role switched to ${newRole}`);
  };

  const checkPermission = (permission) => {
    return hasPermission(authData.user?.role, permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin: authData.user,
        role: authData.user?.role || ROLES.SUPER_ADMIN,
        isAuthenticated: authData.isAuthenticated,
        theme,
        badgeCounts,
        toggleTheme,
        login,
        logout,
        updateProfile,
        setRole,
        checkPermission,
        refreshBadgeCounts,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;
