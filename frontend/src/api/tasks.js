import apiClient from './auth';

export const updateTaskStatus = async (taskId, status) => {
  const response = await apiClient.patch(`/tasks/${taskId}/status/`, { status });
  return response.data;
};

export const editTask = async (taskId, updates) => {
  // updates can include duration_minutes, priority
  const response = await apiClient.patch(`/tasks/${taskId}/edit/`, updates);
  return response.data;
};

export const getDueNotifications = async () => {
  const response = await apiClient.get('/tasks/due/');
  return response.data;
};
