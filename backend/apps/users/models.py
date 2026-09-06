from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.PositiveIntegerField(null=True, blank=True)
    wake_up_time = models.TimeField(null=True, blank=True)
    
    # Calculated Fields based on Age & Wake up time
    bedtime = models.TimeField(null=True, blank=True)
    sleep_duration_hours = models.FloatField(null=True, blank=True)
    
    onboarding_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_sleep(self):
        """
        Calculates recommended sleep duration and bedtime based on age.
        """
        if not self.age or not self.wake_up_time:
            return

        # Simple Sleep Rules
        if self.age <= 12:
            self.sleep_duration_hours = 10.0
        elif self.age <= 18:
            self.sleep_duration_hours = 9.0
        elif self.age <= 64:
            self.sleep_duration_hours = 8.0
        else:
            self.sleep_duration_hours = 7.5

        # Calculate bedtime (wake_up_time - sleep_duration_hours)
        from datetime import datetime, timedelta
        
        # Create a dummy datetime to subtract hours
        dummy_date = datetime(2000, 1, 1, self.wake_up_time.hour, self.wake_up_time.minute)
        bedtime_dt = dummy_date - timedelta(hours=self.sleep_duration_hours)
        self.bedtime = bedtime_dt.time()

    def save(self, *args, **kwargs):
        self.calculate_sleep()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Profile for {self.user}"
