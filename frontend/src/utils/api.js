import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

const appBasePath = '';
const canUseStorage = () => typeof window !== 'undefined' && window.localStorage;

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = canUseStorage() ? localStorage.getItem('hoodie_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && canUseStorage()) {
      localStorage.removeItem('hoodie_token');
      localStorage.removeItem('hoodie_user');
      window.location.href = `${appBasePath}/login`;
    }
    return Promise.reject(error);
  }
);

export default api;
