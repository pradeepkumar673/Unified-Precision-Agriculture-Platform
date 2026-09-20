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

// Disease Detection
export const detectDisease = (formData) => api.post('/health/disease-detect', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getDiseaseHistory = (farmId) => api.get(`/health/disease-history/${farmId}`);

// Weed Detection
export const detectWeed = (formData) => api.post('/health/weed-detect', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Pest & Surveillance Maps
export const getPestRiskMap = (district) => api.get(`/health/pest-risk-map?district=${encodeURIComponent(district)}`);
export const getSurveillanceMap = (district) => api.get(`/health/surveillance-map?district=${encodeURIComponent(district)}`);

// Livestock
export const registerLivestock = (data) => api.post('/health/livestock', data);
export const checkLivestockHealth = (id, formData) => api.post(`/health/livestock/${id}/health-check`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getLivestockSchedule = (id) => api.get(`/health/livestock/${id}/schedule`);

export default api;
