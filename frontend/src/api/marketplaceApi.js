import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/marketplace'
});

export const getEquipmentListings = () => api.get('/equipment');
export const getLaborListings = () => api.get('/labor');
export const getProducts = (farmId) => api.get('/products', { params: { farm_id: farmId } });
export const createOrder = (data) => api.post('/order', data);
export const bookEquipment = (data) => api.post('/equipment/book', data);
export const bookLabor = (data) => api.post('/labor/book', data);
export const createBuyerRequirement = (data) => api.post('/buyer-requirement', data);
export const matchExchange = (data) => api.post('/exchange-match', data);
export const getDeliveryStatus = (orderId) => api.get(`/delivery-status/${orderId}`);
export const createStandingOrder = (data) => api.post('/b2b/standing-order', data);
