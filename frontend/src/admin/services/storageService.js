export const getStoredItem = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

export const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('learnconnect_storage_update', { detail: { key, value } }));
    return true;
  } catch {
    return false;
  }
};

export const logAdminActivity = () => {};
