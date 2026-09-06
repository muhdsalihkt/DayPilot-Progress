import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Goal(models.Model):
    class Type(models.TextChoices):
        TIME_BOUND = 'TIME_BOUND', 'Time-bound'
        ONGOING = 'ONGOING', 'Ongoing'

    class Priority(models.IntegerChoices):
        LOW = 1, 'Low'
        MEDIUM = 2, 'Medium'
        HIGH = 3, 'High'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    
    name = models.CharField(max_length=255)
    goal_type = models.CharField(max_length=15, choices=Type.choices, default=Type.TIME_BOUND)
    priority = models.IntegerField(choices=Priority.choices, default=Priority.MEDIUM)
    
    deadline = models.DateField(null=True, blank=True)
    initial_estimate_level = models.IntegerField(default=1, help_text="User's self-assessed initial skill level (1-10)")
    daily_target_hours = models.FloatField(default=2.0, help_text="Target hours per day to spend on this goal")
    
    # Store dynamic AI assessment answers
    assessment_data = models.JSONField(default=dict, blank=True, help_text="Dynamic Q&A answers used by AI to generate the roadmap")
    
    is_active = models.BooleanField(default=True)
    
    progress_percentage = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_goal_type_display()})"

class RoadmapPhase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='phases')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    # Optional duration info
    estimated_weeks = models.PositiveIntegerField(default=4)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.goal.name} - Phase {self.order}: {self.title}"


class RoadmapObjective(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phase = models.ForeignKey(RoadmapPhase, on_delete=models.CASCADE, related_name='objectives')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    # Progress tracking
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.phase.title} - Obj {self.order}: {self.title}"
