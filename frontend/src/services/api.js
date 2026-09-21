import axios from 'axios';

// Keep the CEA pages on the same API base as the rest of the application.
// VITE_API_BASE_URL may point at a deployed backend; local development uses
// the FastAPI server on port 8000.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('farmId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
