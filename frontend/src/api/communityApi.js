import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getAlerts = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/community/alerts/${farmId}`);
  return response.data;
};

export const getSeasonReport = async (farmId, season, year) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/community/season-report/${farmId}`, {
    params: { season, year }
  });
  return response.data;
};

export const createSupportTicket = async (ticketData) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/community/support-ticket`, ticketData);
  return response.data;
};

export const createShgGroup = async (groupData) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/community/shg/create`, groupData);
  return response.data;
};

export const createShgBooking = async (shgId, bookingData) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/community/shg/${shgId}/book`, bookingData);
  return response.data;
};

export const getGrowerScore = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/community/grower-score/${farmId}`);
  return response.data;
};

export const getActiveFPO = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/community/fpo/active`);
  return response.data;
};

export const createFpo = async (fpoData) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/community/fpo`, fpoData);
  return response.data;
};

export const joinFpoTender = async (tenderId, joinData) => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/community/fpo/tender/${tenderId}/join`, joinData);
  return response.data;
};
