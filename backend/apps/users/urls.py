from django.urls import path
from .views import AssessGoalView, CompleteOnboardingView, AdminDashboardStatsView, ResetAccountView

urlpatterns = [
    path('onboarding/assess-goal/', AssessGoalView.as_view(), name='onboarding_assess_goal'),
    path('onboarding/complete/', CompleteOnboardingView.as_view(), name='onboarding_complete'),
    path('onboarding/reset/', ResetAccountView.as_view(), name='onboarding_reset'),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
]
