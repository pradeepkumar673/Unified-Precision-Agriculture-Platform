import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const recommendIrrigation = (data) => api.post('/water_soil/irrigation-recommendation', data);
export const getIrrigationHistory = (farmId) => api.get(`/water_soil/irrigation-history/${farmId}`);

export const createSoilMap = (data) => api.post('/water_soil/soil-map', data);
export const getSoilMap = (farmId) => api.get(`/water_soil/soil-map/${farmId}`);

export default api;
