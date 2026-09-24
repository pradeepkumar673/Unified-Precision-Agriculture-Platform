import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const getCeaDashboard = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/cea_iot/dashboard`, {
    params: { farm_id: farmId },
  });
  return response.data;
};

export const getAquaBalance = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/cea_iot/aqua-balance`, {
    params: { farm_id: farmId },
  });
  return response.data;
};

export const updateSetpoints = async (farmId, values) => {
  const response = await axios.post(`${API_BASE_URL}/cea_iot/setpoints`, {
    farm_id: farmId,
    values: values,
  });
  return response.data;
};

export const getVerticalOptimization = async (farmId) => {
  const response = await axios.get(`${API_BASE_URL}/cea_iot/vertical-optimization`, {
    params: { farm_id: farmId },
  });
  return response.data;
};
