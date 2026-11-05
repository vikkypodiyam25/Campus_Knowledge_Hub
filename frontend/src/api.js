import axios from 'axios';

function readSession(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

const api = axios.create({ baseURL: '/api', timeout: 15000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
  const isAdminRequest = config.url?.startsWith('/admin/');
  const session = readSession(isAdminRequest ? 'learnconnect_admin_user' : 'learnconnect-user-session');
  const token = session?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(response => response.data, error => {
  const message = error.response?.data?.message || error.message || 'Could not connect to the backend.';
  return Promise.reject(Object.assign(new Error(message), { status: error.response?.status, response: error.response?.data }));
});

export default api;
