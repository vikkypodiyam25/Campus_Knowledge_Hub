import {
  STORAGE_KEYS,
} from '../utils/constants';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_QUESTIONS,
  INITIAL_DISCUSSIONS,
  INITIAL_SESSIONS,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ADMIN_ACTIVITIES,
} from '../data/mockData';

// Initialize default data if not present in localStorage
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DISCUSSIONS)) {
    localStorage.setItem(STORAGE_KEYS.DISCUSSIONS, JSON.stringify(INITIAL_DISCUSSIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ADMIN_ACTIVITIES));
  }
};

// Generic read
export const getStoredItem = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.error(`Failed to read from localStorage key: ${key}`, error);
    return fallback;
  }
};

// Generic write
export const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('learnconnect_storage_update', { detail: { key, value } }));
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage key: ${key}`, error);
    return false;
  }
};

// Record admin activity
export const logAdminActivity = (action, target, icon = 'Activity', color = 'indigo') => {
  try {
    const activities = getStoredItem(STORAGE_KEYS.ACTIVITIES, []);
    const adminAuth = getStoredItem(STORAGE_KEYS.AUTH_ADMIN, {});
    const adminName = adminAuth?.user?.name || 'Admin';

    const newActivity = {
      id: `act_${Date.now()}`,
      admin: adminName,
      action,
      target,
      timestamp: new Date().toISOString(),
      icon,
      color,
    };

    setStoredItem(STORAGE_KEYS.ACTIVITIES, [newActivity, ...activities.slice(0, 24)]);
  } catch (err) {
    console.error('Failed to log admin activity', err);
  }
};
