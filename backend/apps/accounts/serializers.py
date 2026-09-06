from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OTPVerification
import re

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    onboarding_completed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'role', 'is_verified', 'created_at', 'onboarding_completed']
        read_only_fields = ['id', 'role', 'is_verified', 'created_at', 'onboarding_completed']

    def get_onboarding_completed(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.onboarding_completed
        return False


class OTPRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)
    
    def validate_identifier(self, value):
        # Basic validation to check if email or phone
        is_email = '@' in value
        is_phone = re.match(r'^\+?1?\d{9,15}$', value)
        
        if not is_email and not is_phone:
            raise serializers.ValidationError("Must be a valid email or phone number.")
        return value


class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)
    otp = serializers.CharField(max_length=6)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    identifier = serializers.CharField(max_length=255, write_only=True) # email or phone used for reg
    otp = serializers.CharField(max_length=6, write_only=True)
    
    class Meta:
        model = User
        fields = ['identifier', 'password', 'otp']

    def validate(self, data):
        identifier = data.get('identifier')
        otp = data.get('otp')
        
        # Verify OTP
        try:
            otp_record = OTPVerification.objects.filter(
                identifier=identifier, 
                is_used=False
            ).latest('created_at')
        except OTPVerification.DoesNotExist:
            raise serializers.ValidationError("No active OTP found for this identifier.")
            
        if not otp_record.check_otp(otp):
            otp_record.attempts += 1
            otp_record.save()
            raise serializers.ValidationError("Invalid OTP.")
            
        data['otp_record'] = otp_record
        return data
        
    def create(self, validated_data):
        identifier = validated_data['identifier']
        password = validated_data['password']
        otp_record = validated_data['otp_record']
        
        is_email = '@' in identifier
        
        user_data = {
            'email': identifier if is_email else None,
            'phone': identifier if not is_email else None,
            'is_verified': True
        }
        
        user = User.objects.create_user(**user_data, password=password)
        
        otp_record.is_used = True
        otp_record.user = user
        otp_record.save()
        
        return user


class CustomTokenObtainSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        identifier = attrs.get('identifier')
        password = attrs.get('password')
        
        is_email = '@' in identifier
        
        try:
            if is_email:
                user = User.objects.get(email=identifier)
            else:
                user = User.objects.get(phone=identifier)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this identifier.")
            
        if not user.check_password(password):
            raise serializers.ValidationError("Incorrect password.")
            
        refresh = RefreshToken.for_user(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }


class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField()
    
    def validate(self, attrs):
        import requests
        token = attrs.get('token')
        
        try:
            # Note: In production, consider using google-auth library.
            # Here we are using requests to the tokeninfo endpoint.
            response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
            if response.status_code != 200:
                # If network fails or invalid token, we'll mock it for local dev 
                # if it starts with 'MOCK_GOOGLE_TOKEN'
                if token.startswith('MOCK_GOOGLE_TOKEN_'):
                    email = token.replace('MOCK_GOOGLE_TOKEN_', '') + '@example.com'
                    return self._get_or_create_user(email)
                raise serializers.ValidationError("Invalid Google token.")
                
            info = response.json()
            email = info.get('email')
            if not email:
                raise serializers.ValidationError("Google token did not contain an email.")
                
            return self._get_or_create_user(email)
            
        except requests.RequestException:
            # Fallback for dev if no internet
            if token.startswith('MOCK_GOOGLE_TOKEN_'):
                email = token.replace('MOCK_GOOGLE_TOKEN_', '') + '@example.com'
                return self._get_or_create_user(email)
            raise serializers.ValidationError("Could not verify Google token.")

    def _get_or_create_user(self, email):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'is_verified': True,
                'auth_provider': User.AuthProvider.GOOGLE
            }
        )
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }
