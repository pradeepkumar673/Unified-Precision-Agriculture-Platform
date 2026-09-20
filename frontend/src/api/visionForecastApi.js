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

export const checkStress = (data) => api.post('/vision_forecast/stress-check', data);
export const countPlants = (formData) => api.post('/vision_forecast/plant-count', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const analyzeGrainQuality = (formData) => api.post('/vision_forecast/grain-quality', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getPriceForecast = (params) => api.get('/vision_forecast/price-forecast', { params });
export const forecastYield = (data) => api.post('/vision_forecast/yield-forecast', data);
export const getClimateRisk = (farmId, params) => api.get(`/vision_forecast/climate-risk/${farmId}`, { params });

export default api;
