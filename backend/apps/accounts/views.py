import threading
import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    OTPRequestSerializer, 
    OTPVerifySerializer, 
    RegisterSerializer,
    CustomTokenObtainSerializer,
    UserSerializer,
    GoogleAuthSerializer
)
from .models import OTPVerification
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()


def _dispatch_otp_email_async(identifier, raw_otp):
    """Background worker to send email. Tries HTTP APIs (Resend/Brevo) first, then SMTP."""
    import requests
    subject = "Your Verification Code - DayPilot"
    message = f"Hello,\n\nYour verification code is: {raw_otp}\nThis code will expire in 10 minutes.\n\nThank you!"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
        <h2 style="color: #6366f1;">DayPilot Verification</h2>
        <p>Hello,</p>
        <p>Your 6-digit verification code is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827; padding: 12px 0;">{raw_otp}</div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
    """

    # 1. Try Resend HTTP API (Port 443 - HTTPS, never blocked by Render)
    resend_api_key = getattr(settings, 'RESEND_API_KEY', '') or os.getenv('RESEND_API_KEY', '')
    if resend_api_key:
        try:
            from_email = getattr(settings, 'RESEND_FROM_EMAIL', '') or os.getenv('RESEND_FROM_EMAIL', 'DayPilot <onboarding@resend.dev>')
            resp = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": from_email,
                    "to": [identifier],
                    "subject": subject,
                    "html": html_content
                },
                timeout=8
            )
            if resp.status_code in (200, 201):
                print(f"[Resend Success] Sent OTP email to {identifier}")
                return
            else:
                print(f"[Resend Error] {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[Resend Exception] {str(e)}")

    # 2. Try Brevo HTTP API (Port 443 - HTTPS, never blocked by Render)
    brevo_api_key = getattr(settings, 'BREVO_API_KEY', '') or os.getenv('BREVO_API_KEY', '')
    if brevo_api_key:
        try:
            resp = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": brevo_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "sender": {"name": "DayPilot", "email": settings.DEFAULT_FROM_EMAIL},
                    "to": [{"email": identifier}],
                    "subject": subject,
                    "htmlContent": html_content
                },
                timeout=8
            )
            if resp.status_code in (200, 201):
                print(f"[Brevo Success] Sent OTP email to {identifier}")
                return
            else:
                print(f"[Brevo Error] {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[Brevo Exception] {str(e)}")

    # 3. Fallback to standard Django send_mail (SMTP)
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[identifier],
            fail_silently=False
        )
        print(f"[Email Dispatch Success] Sent OTP to {identifier}")
    except Exception as e:
        print(f"[Email Dispatch Error] Failed to send email to {identifier}: {str(e)}")
        print(f"FALLBACK OTP DISPATCH -> To: {identifier} | OTP: {raw_otp}")


class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = OTPRequestSerializer(data=request.data)
            if serializer.is_valid():
                identifier = serializer.validated_data['identifier']
                is_email = '@' in identifier
                
                if not is_email:
                    # Phone number signups do not require OTP
                    return Response({
                        "message": "OTP verification is not required for phone numbers.",
                        "otp_required": False
                    }, status=status.HTTP_200_OK)
                
                otp_type = OTPVerification.Type.EMAIL
                raw_otp = OTPVerification.generate_raw_otp()
                
                # Create OTP Record
                otp_record = OTPVerification(identifier=identifier, otp_type=otp_type)
                otp_record.set_otp(raw_otp)
                otp_record.save()
                
                # Dispatch OTP asynchronously via background thread so HTTP response
                # returns in milliseconds and NEVER causes Gunicorn worker timeout on Render
                threading.Thread(
                    target=_dispatch_otp_email_async,
                    args=(identifier, raw_otp),
                    daemon=True
                ).start()
                
                response_data = {
                    "message": "OTP sent successfully to email.",
                    "otp_required": True
                }
                if settings.DEBUG or os.getenv('DEV_OTP_RESPONSE', 'False') == 'True':
                    response_data["dev_otp"] = raw_otp
                
                return Response(response_data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[RequestOTP Exception] {str(e)}")
            return Response({"error": f"Failed to process OTP request: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = OTPVerifySerializer(data=request.data)
            if serializer.is_valid():
                identifier = serializer.validated_data['identifier']
                otp = serializer.validated_data['otp']
                
                try:
                    otp_record = OTPVerification.objects.filter(
                        identifier=identifier, 
                        is_used=False,
                        expires_at__gt=timezone.now()
                    ).latest('created_at')
                except OTPVerification.DoesNotExist:
                    return Response({"error": "OTP expired or does not exist."}, status=status.HTTP_400_BAD_REQUEST)
                    
                if otp_record.attempts >= 3:
                    return Response({"error": "Too many failed attempts."}, status=status.HTTP_400_BAD_REQUEST)
                    
                if otp_record.check_otp(otp):
                    return Response({"message": "OTP verified. Proceed to register/reset."}, status=status.HTTP_200_OK)
                else:
                    otp_record.attempts += 1
                    otp_record.save()
                    return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
                    
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[VerifyOTP Exception] {str(e)}")
            return Response({"error": f"Failed to verify OTP: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({"message": "Account created successfully."}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[Register Exception] {str(e)}")
            return Response({"error": f"Registration failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = CustomTokenObtainSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            response = Response({
                "message": "Login successful.",
                "user": data['user'],
                "access": data['access'],
                "refresh": data['refresh']
            }, status=status.HTTP_200_OK)
            
            # Set Refresh Token in HttpOnly Cookie
            response.set_cookie(
                key='refresh_token',
                value=data['refresh'],
                httponly=True,
                samesite='Lax',
                secure=False, # Set to True in production with HTTPS
                max_age=7 * 24 * 60 * 60 # 7 days
            )
            return response
            
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            response = Response({
                "message": "Google Login successful.",
                "user": data['user'],
                "access": data['access'],
                "refresh": data['refresh']
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                key='refresh_token',
                value=data['refresh'],
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=7 * 24 * 60 * 60
            )
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        if not identifier or not new_password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        is_email = '@' in identifier
        otp_record = None

        if is_email:
            if not otp:
                return Response({"error": "OTP is required for email password reset."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                otp_record = OTPVerification.objects.filter(
                    identifier=identifier, 
                    is_used=False
                ).latest('created_at')
            except OTPVerification.DoesNotExist:
                return Response({"error": "No active OTP found."}, status=status.HTTP_400_BAD_REQUEST)
                
            if not otp_record.check_otp(otp):
                otp_record.attempts += 1
                otp_record.save()
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=identifier) if is_email else User.objects.get(phone=identifier)
            user.set_password(new_password)
            user.save()
            
            if is_email and otp_record:
                otp_record.is_used = True
                otp_record.user = user
                otp_record.save()
            
            return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            request.data['refresh'] = refresh_token
            
        try:
            return super().post(request, *args, **kwargs)
        except InvalidToken:
            return Response({"error": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)
