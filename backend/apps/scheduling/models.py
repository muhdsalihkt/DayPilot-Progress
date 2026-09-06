import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class FixedCommitment(models.Model):
    class Category(models.TextChoices):
        WORK = 'WORK', 'Work'
        COLLEGE = 'COLLEGE', 'College'
        SCHOOL = 'SCHOOL', 'School'
        MEALS = 'MEALS', 'Meals'
        TRAVEL = 'TRAVEL', 'Travel'
        APPOINTMENTS = 'APPOINTMENTS', 'Appointments'
        FAMILY = 'FAMILY', 'Family'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fixed_commitments')
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.OTHER)
    
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Store days of the week as comma separated integers, e.g. "0,1,2,3,4" for Mon-Fri
    days_of_week = models.CharField(max_length=30, default="0,1,2,3,4,5,6") 
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"


class EverydayActivity(models.Model):
    class Category(models.TextChoices):
        BRUSHING = 'BRUSHING', 'Brushing'
        BATHING = 'BATHING', 'Bathing'
        MORNING_ROUTINE = 'MORNING_ROUTINE', 'Morning Routine'
        EVENING_ROUTINE = 'EVENING_ROUTINE', 'Evening Routine'
        PERSONAL_CARE = 'PERSONAL_CARE', 'Personal Care'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='everyday_activities')
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.OTHER)
    
    duration_minutes = models.PositiveIntegerField(default=15)
    
    # Optional preferred time block (e.g. MORNING, EVENING)
    preferred_time = models.CharField(max_length=50, blank=True, null=True) 

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.duration_minutes}m"

class DailySchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_schedules')
    date = models.DateField()
    
    # Track when it was generated
    generated_at = models.DateTimeField(auto_now_add=True)
    warning_message = models.TextField(blank=True, null=True, help_text="AI warning if schedule couldn't fit target hours")
    
    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"Schedule for {self.user} on {self.date}"

class ScheduleBlock(models.Model):
    class BlockType(models.TextChoices):
        FIXED = 'FIXED', 'Fixed Commitment'
        EVERYDAY = 'EVERYDAY', 'Everyday Activity'
        TASK = 'TASK', 'Goal Task'
        SLEEP = 'SLEEP', 'Sleep'
        BREAK = 'BREAK', 'Break'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(DailySchedule, on_delete=models.CASCADE, related_name='blocks')
    
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    block_type = models.CharField(max_length=20, choices=BlockType.choices)
    
    # Generic references depending on type
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    
    # Optional references
    task = models.ForeignKey('tasks.Task', on_delete=models.SET_NULL, null=True, blank=True)
    fixed_commitment = models.ForeignKey(FixedCommitment, on_delete=models.SET_NULL, null=True, blank=True)
    everyday_activity = models.ForeignKey(EverydayActivity, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.start_time}-{self.end_time}: {self.title} ({self.block_type})"
