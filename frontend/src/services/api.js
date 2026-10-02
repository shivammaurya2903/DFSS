import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ─────────────────────────────────────────
// REQUEST INTERCEPTOR — attach JWT
// ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────
// RESPONSE INTERCEPTOR — global error handling
// ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      error.isCanceled = true;
      return Promise.reject(error);
    }
    
    if (!error.response) {
      // Network error / backend unreachable
      error.isNetworkError = true;
      error.userMessage = 'Distributed Storage is temporarily unavailable. Please retry.';
    } else if (error.response.status === 401) {
      // Token expired or invalid — clear local storage and redirect to login
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response.status === 403) {
      error.userMessage = 'Access denied.';
    } else if (error.response.status >= 500) {
      error.userMessage = 'A server error occurred. Please try again.';
    }
    return Promise.reject(error);
  }
);

export default api;
