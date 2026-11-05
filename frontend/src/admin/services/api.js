import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Axios instance configured for LearnConnect Admin API.
 * Currently works seamlessly with mock/local state, and is fully ready
 * for plugging in a real REST / GraphQL backend when endpoints become available.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attaches auth token
api.interceptors.request.use(
  (config) => {
    try {
      const storedAuth = localStorage.getItem(STORAGE_KEYS.AUTH_ADMIN);
      if (storedAuth) {
        const { token } = JSON.parse(storedAuth);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles common status codes
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export default api;
