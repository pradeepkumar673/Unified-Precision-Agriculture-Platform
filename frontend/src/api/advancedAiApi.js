import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const submitVoiceQuery = async (farmId, audioFile) => {
  const formData = new FormData();
  formData.append('farm_id', farmId);
  formData.append('audio_file', audioFile);

  const response = await axios.post(`${API_BASE_URL}/api/v1/advanced_ai/voice-query`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const submitMultimodalQuery = async (farmId, inputText, imageFile) => {
  const formData = new FormData();
  formData.append('farm_id', farmId);
  if (inputText) {
    formData.append('input_text', inputText);
  }
  if (imageFile) {
    formData.append('image_file', imageFile);
  }

  const response = await axios.post(`${API_BASE_URL}/api/v1/advanced_ai/multimodal-query`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const triggerFederatedRound = async () => {
  const response = await axios.post(`${API_BASE_URL}/api/v1/advanced_ai/federated/trigger-round`);
  return response.data;
};

export const simulateWhatIf = async (farmId, currentDecision, proposedChange) => {
  const payload = {
    farm_id: farmId,
    current_decision: currentDecision,
    proposed_change: proposedChange,
  };
  const response = await axios.post(`${API_BASE_URL}/api/v1/advanced_ai/whatif-simulate`, payload);
  return response.data;
};
