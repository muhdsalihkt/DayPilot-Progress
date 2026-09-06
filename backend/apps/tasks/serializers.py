from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'name', 'duration_minutes', 'priority', 'status', 'notify', 'completed_at', 'created_at']
        read_only_fields = ['id', 'name', 'created_at']

class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status']

class TaskEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['duration_minutes', 'priority', 'notify']
