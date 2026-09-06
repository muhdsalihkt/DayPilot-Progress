import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet, and it's not the refresh endpoint itself
    if (error.response && error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh/') {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Attempt to refresh token using the explicitly stored refresh token
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        }, {
          withCredentials: true // Still send cookies just in case
        });

        const newAccessToken = refreshResponse.data.access;
        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          if (refreshResponse.data.refresh) {
            localStorage.setItem('refresh_token', refreshResponse.data.refresh);
          }
          // Update the original request header with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails (e.g., refresh token is expired or invalid), log out
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Force redirect to login only if we aren't already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const requestOtp = async (identifier) => {
  const response = await apiClient.post('/auth/otp/request/', { identifier });
  return response.data;
};

export const verifyOtp = async (identifier, otp) => {
  const response = await apiClient.post('/auth/otp/verify/', { identifier, otp });
  return response.data;
};

export const register = async (identifier, password, otp) => {
  const response = await apiClient.post('/auth/register/', { identifier, password, otp });
  return response.data;
};

export const login = async (identifier, password) => {
  const response = await apiClient.post('/auth/login/', { identifier, password });
  if (response.data.access) {
    localStorage.setItem('access_token', response.data.access);
  }
  if (response.data.refresh) {
    localStorage.setItem('refresh_token', response.data.refresh);
  }
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me/');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export default apiClient;
