import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: `${API_BASE}/finance`
});

export const getCreditProfile = (farmId) => api.get(`/credit-profile/${farmId}`);

export const initiatePayment = (data) => api.post('/payment/initiate', data);
export const paymentWebhook = (data) => api.post('/payment/webhook', data);

export const getLedger = (farmId) => api.get(`/ledger/${farmId}`);
export const exportLedgerPdf = (farmId) => api.get(`/ledger/${farmId}/export`, { responseType: 'blob' });

export const bookWarehouse = (data) => api.post('/warehouse/book', data);
export const generateEnwr = (bookingId) => api.post(`/warehouse/${bookingId}/generate-enwr`);

export const applyLoan = (data) => api.post('/loan/apply', data);

export const fileInsuranceClaim = (data) => api.post('/insurance/claim', data);
export const getInsuranceClaim = (claimId) => api.get(`/insurance/claim/${claimId}`);

export const checkFraud = (data) => api.post('/fraud-check', data);
