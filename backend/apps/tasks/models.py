import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.goals.models import Goal, RoadmapObjective

User = get_user_model()

class Task(models.Model):
    class Priority(models.IntegerChoices):
        LOW = 1, 'Low'
        MEDIUM = 2, 'Medium'
        HIGH = 3, 'High'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        INCOMPLETE = 'INCOMPLETE', 'Incomplete'
        SKIPPED = 'SKIPPED', 'Skipped'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='tasks')
    objective = models.ForeignKey(RoadmapObjective, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    
    name = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField(help_text="Duration determined by AI, editable by user")
    priority = models.IntegerField(choices=Priority.choices, default=Priority.MEDIUM, help_text="Set by user")
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    notify = models.BooleanField(default=False, help_text="User opted in to notifications")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.duration_minutes}m] {self.name}"
