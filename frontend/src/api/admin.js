import apiClient from './auth';

export const getAdminDashboardStats = async () => {
  const response = await apiClient.get('/users/admin/dashboard/');
  return response.data;
};
