from rest_framework import serializers
from .models import DailySchedule, ScheduleBlock, EverydayActivity

from apps.tasks.serializers import TaskSerializer

class EverydayActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = EverydayActivity
        fields = ['id', 'name', 'category', 'duration_minutes', 'preferred_time']

class ScheduleBlockSerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)
    
    class Meta:
        model = ScheduleBlock
        fields = ['id', 'start_time', 'end_time', 'block_type', 'title', 'is_completed', 'task']

class DailyScheduleSerializer(serializers.ModelSerializer):
    blocks = ScheduleBlockSerializer(many=True, read_only=True)
    
    class Meta:
        model = DailySchedule
        fields = ['id', 'user', 'date', 'generated_at', 'warning_message', 'blocks']
