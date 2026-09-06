import uuid
import string
import random
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password


class CustomUserManager(BaseUserManager):
    def create_user(self, email, phone=None, password=None, **extra_fields):
        if not email and not phone:
            raise ValueError('Either email or phone must be set')
        
        email = self.normalize_email(email) if email else None
        user = self.model(email=email, phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email=email, password=password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = 'USER', 'User'
        ADMIN = 'ADMIN', 'Admin'
    
    class AuthProvider(models.TextChoices):
        LOCAL = 'LOCAL', 'Local'
        GOOGLE = 'GOOGLE', 'Google'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None # Remove standard username, we use email/phone
    
    email = models.EmailField('email address', unique=True, null=True, blank=True)
    phone = models.CharField('phone number', max_length=20, unique=True, null=True, blank=True)
    
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    auth_provider = models.CharField(max_length=15, choices=AuthProvider.choices, default=AuthProvider.LOCAL)
    
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email or self.phone or str(self.id)


class OTPVerification(models.Model):
    class Type(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        SMS = 'SMS', 'SMS'
        
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps', null=True, blank=True)
    identifier = models.CharField(max_length=255) # email or phone
    otp_type = models.CharField(max_length=10, choices=Type.choices)
    
    # Store hashed OTP for security
    otp_hash = models.CharField(max_length=128)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10) # 10 mins expiry
        super().save(*args, **kwargs)

    def set_otp(self, raw_otp):
        self.otp_hash = make_password(raw_otp)

    def check_otp(self, raw_otp):
        return check_password(raw_otp, self.otp_hash)

    @staticmethod
    def generate_raw_otp(length=6):
        return ''.join(random.choices(string.digits, k=length))

