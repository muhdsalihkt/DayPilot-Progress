from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile
from datetime import time

User = get_user_model()

class UserProfileTests(TestCase):
    def test_sleep_calculation_adult(self):
        user = User.objects.create_user(email='adult@test.com', password='password123')
        profile = UserProfile.objects.create(
            user=user,
            age=30,
            wake_up_time=time(7, 0)
        )
        
        # 30 y/o requires 8 hours of sleep. Wake up at 7:00 AM -> Bedtime should be 23:00 (11:00 PM)
        self.assertEqual(profile.sleep_duration_hours, 8.0)
        self.assertEqual(profile.bedtime, time(23, 0))

    def test_sleep_calculation_child(self):
        user = User.objects.create_user(email='child@test.com', password='password123')
        profile = UserProfile.objects.create(
            user=user,
            age=10,
            wake_up_time=time(6, 30)
        )
        
        # 10 y/o requires 10 hours of sleep. Wake up at 6:30 AM -> Bedtime should be 20:30 (8:30 PM)
        self.assertEqual(profile.sleep_duration_hours, 10.0)
        self.assertEqual(profile.bedtime, time(20, 30))
