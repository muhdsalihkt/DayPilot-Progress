import apiClient from './auth';

export const getGoals = async () => {
  const response = await apiClient.get('/goals/');
  return response.data;
};

export const generateRoadmap = async (goalId) => {
  const response = await apiClient.post(`/goals/${goalId}/generate-roadmap/`);
  return response.data;
};
