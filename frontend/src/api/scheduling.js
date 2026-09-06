import apiClient from './auth';

export const generateSchedule = async (dateStr) => {
  const response = await apiClient.post('/schedules/generate/', { date: dateStr });
  return response.data;
};

export const getSchedules = async () => {
  const response = await apiClient.get('/schedules/');
  return response.data;
};

export const deleteSchedule = async (dateStr) => {
  const response = await apiClient.delete(`/schedules/delete/?date=${dateStr}`);
  return response.data;
};

export const getActivities = async () => {
  const response = await apiClient.get('/schedules/activities/');
  return response.data;
};

export const addActivity = async (activityData) => {
  const response = await apiClient.post('/schedules/activities/', activityData);
  return response.data;
};

export const deleteActivity = async (activityId) => {
  const response = await apiClient.delete(`/schedules/activities/${activityId}/delete/`);
  return response.data;
};

export const toggleBlockComplete = async (blockId) => {
  const response = await apiClient.patch(`/schedules/blocks/${blockId}/toggle/`);
  return response.data;
};
