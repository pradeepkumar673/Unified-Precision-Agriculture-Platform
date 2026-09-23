import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: `${API_BASE}/marketplace`
});

export const getEquipmentListings = () => api.get('/equipment');
export const getLaborListings = () => api.get('/labor');
export const getProducts = (farmId) => api.get('/products', { params: { farm_id: farmId } });
export const getBuyers = (params) => api.get('/buyers', { params });
export const createOrder = (data) => api.post('/order', data);
export const bookEquipment = (data) => api.post('/equipment/book', data);
export const bookLabor = (data) => api.post('/labor/book', data);
export const createBuyerRequirement = (data) => api.post('/buyer-requirement', data);
export const matchExchange = (data) => api.post('/exchange-match', data);
export const getDeliveryStatus = (orderId) => api.get(`/delivery-status/${orderId}`);
export const createStandingOrder = (data) => api.post('/b2b/standing-order', data);

export const createProduct = (data) => api.post('/products', data);
export const createEquipmentListing = (data) => api.post('/equipment', data);
