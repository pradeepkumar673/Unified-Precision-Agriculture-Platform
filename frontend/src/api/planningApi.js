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

// Crop Plan
export const createCropPlan = (data) => api.post('/planning/crop-plan', data);
export const getCropPlan = (farmId) => api.get(`/planning/crop-plan/${farmId}`);

// Rotation Plan
export const createRotationPlan = (data) => api.post('/planning/rotation-plan', data);

// Variety Recommendation
export const getVarietyRecommendation = (data) => api.post('/planning/variety-recommendation', data);

// Variable Rate
export const createVariableRate = (data) => api.post('/planning/variable-rate', data);
export const exportVariableRate = (id) => api.get(`/planning/variable-rate/${id}/export`);

export default api;
