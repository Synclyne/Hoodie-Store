import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hoodie_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hoodie_token');
      localStorage.removeItem('hoodie_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
