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

class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            is_email = '@' in identifier
            otp_type = OTPVerification.Type.EMAIL if is_email else OTPVerification.Type.SMS
            
            raw_otp = OTPVerification.generate_raw_otp()
            
            # Create OTP Record
            otp_record = OTPVerification(identifier=identifier, otp_type=otp_type)
            otp_record.set_otp(raw_otp)
            otp_record.save()
            
            # MOCK SENDER
            print(f"\n{'='*40}")
            print(f"MOCK OTP DISPATCH")
            print(f"To: {identifier}")
            print(f"OTP: {raw_otp}")
            print(f"{'='*40}\n")
            
            return Response({"message": "OTP sent successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
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
                # Valid OTP, but we do NOT mark it used here yet, 
                # because they need it to register/reset password.
                # In a more complex flow, we'd return a temporary token.
                return Response({"message": "OTP verified. Proceed to register/reset."}, status=status.HTTP_200_OK)
            else:
                otp_record.attempts += 1
                otp_record.save()
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "Account created successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
        
        if not identifier or not otp or not new_password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

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
            
        is_email = '@' in identifier
        try:
            user = User.objects.get(email=identifier) if is_email else User.objects.get(phone=identifier)
            user.set_password(new_password)
            user.save()
            
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
