import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getCeaDashboard = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/cea_iot/dashboard`, {
    params: { farm_id: farmId },
  });
  return response.data;
};

export const getAquaBalance = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/cea_iot/aqua-balance`, {
    params: { farm_id: farmId },
  });
  return response.data;
};

export const getVerticalOptimization = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/api/v1/cea_iot/vertical-optimization`, {
    params: { farm_id: farmId },
  });
  return response.data;
};
