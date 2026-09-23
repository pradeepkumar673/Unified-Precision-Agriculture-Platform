import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: `${API_BASE}/gov`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const matchSchemes = (farmId) => api.get(`/schemes/match/${farmId}`);

export const uploadDocument = (formData) => api.post('/documents/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const autofillForm = (docId, schemeId) => api.post(`/documents/${docId}/autofill/${schemeId}`);

export const getDocuments = (farmId) => api.get(`/documents/${farmId}`);
