import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/gov'
});

export const matchSchemes = (farmId) => api.get(`/schemes/match/${farmId}`);

export const uploadDocument = (formData) => api.post('/documents/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

export const autofillForm = (docId, schemeId) => api.post(`/documents/${docId}/autofill/${schemeId}`);
