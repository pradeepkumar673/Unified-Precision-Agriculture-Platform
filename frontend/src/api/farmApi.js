import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Farm Profile
export const createFarmProfile = (data) => api.post('/farm/profile', data);
export const getFarmProfile = (farmId) => api.get(`/farm/profile/${farmId}`);
export const updateFarmProfile = (farmId, data) => api.put(`/farm/profile/${farmId}`, data);

// Farm Boundary & Zones
export const saveFarmBoundary = (farmId, data) => api.post(`/farm/${farmId}/boundary`, data);
export const getFarmZones = (farmId) => api.get(`/farm/${farmId}/zones`);

export default api;
