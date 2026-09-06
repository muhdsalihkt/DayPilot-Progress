from django.urls import path
from .views import RequestOTPView, VerifyOTPView, RegisterView, LoginView, MeView, GoogleAuthView, ResetPasswordView, CookieTokenRefreshView

urlpatterns = [
    path('otp/request/', RequestOTPView.as_view(), name='otp_request'),
    path('otp/verify/', VerifyOTPView.as_view(), name='otp_verify'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('password/reset/', ResetPasswordView.as_view(), name='password_reset'),
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
]
