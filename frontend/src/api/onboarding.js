import apiClient from './auth';

export const assessGoal = async (name, goal_type, initial_estimate_level) => {
  const response = await apiClient.post('/users/onboarding/assess-goal/', {
    name,
    goal_type,
    initial_estimate_level
  });
  return response.data;
};

export const completeOnboarding = async (onboardingData) => {
  const response = await apiClient.post('/users/onboarding/complete/', onboardingData);
  return response.data;
};

export const resetAccount = async () => {
  const response = await apiClient.post('/users/onboarding/reset/');
  return response.data;
};
