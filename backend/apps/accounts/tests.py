from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core import mail
from .models import User, OTPVerification

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = 'test@example.com'
        self.phone = '+1234567890'
        self.password = 'securepassword123'

    def test_request_otp_email(self):
        url = reverse('otp_request')
        response = self.client.post(url, {'identifier': self.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('otp_required'), True)
        self.assertTrue(OTPVerification.objects.filter(identifier=self.email).exists())
        # Check that email was sent to outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Your verification code is', mail.outbox[0].body)

    def test_request_otp_phone(self):
        url = reverse('otp_request')
        response = self.client.post(url, {'identifier': self.phone})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('otp_required'), False)

    def test_phone_register_without_otp(self):
        register_url = reverse('register')
        reg_response = self.client.post(register_url, {
            'identifier': self.phone,
            'password': self.password
        })
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(phone=self.phone).exists())

    def test_phone_reset_password_without_otp(self):
        # Create user
        user = User.objects.create_user(phone=self.phone, password=self.password)
        reset_url = reverse('password_reset')
        new_pass = 'newpassword123'
        response = self.client.post(reset_url, {
            'identifier': self.phone,
            'new_password': new_pass
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password(new_pass))

    def test_register_and_login_flow(self):
        # 1. Request OTP
        self.client.post(reverse('otp_request'), {'identifier': self.email})
        otp_record = OTPVerification.objects.get(identifier=self.email)
        
        # Override the OTP hash so we know the raw OTP to use for the test
        raw_otp = '123456'
        otp_record.set_otp(raw_otp)
        otp_record.save()

        # 2. Register
        register_url = reverse('register')
        reg_response = self.client.post(register_url, {
            'identifier': self.email,
            'password': self.password,
            'otp': raw_otp
        })
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.email).exists())

        # 3. Login
        login_url = reverse('login')
        login_response = self.client.post(login_url, {
            'identifier': self.email,
            'password': self.password
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)

    def test_invalid_otp(self):
        self.client.post(reverse('otp_request'), {'identifier': self.email})
        
        register_url = reverse('register')
        response = self.client.post(register_url, {
            'identifier': self.email,
            'password': self.password,
            'otp': '000000' # Wrong OTP
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_me_endpoint(self):
        user = User.objects.create_user(email='me@example.com', password=self.password)
        self.client.force_authenticate(user=user)
        
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'me@example.com')

