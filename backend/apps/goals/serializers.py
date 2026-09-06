from rest_framework import serializers
from .models import Goal, RoadmapPhase, RoadmapObjective

class RoadmapObjectiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapObjective
        fields = ['id', 'title', 'description', 'order', 'is_completed', 'completed_at']

class RoadmapPhaseSerializer(serializers.ModelSerializer):
    objectives = RoadmapObjectiveSerializer(many=True, read_only=True)
    
    class Meta:
        model = RoadmapPhase
        fields = ['id', 'title', 'description', 'order', 'estimated_weeks', 'objectives']

class GoalSerializer(serializers.ModelSerializer):
    phases = RoadmapPhaseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Goal
        fields = ['id', 'name', 'goal_type', 'priority', 'deadline', 
                  'initial_estimate_level', 'assessment_data', 'is_active', 
                  'created_at', 'phases', 'progress_percentage']
        read_only_fields = ['id', 'phases', 'progress_percentage']
