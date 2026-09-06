from rest_framework import serializers
from .models import UserProfile
from apps.scheduling.models import FixedCommitment, EverydayActivity
from apps.goals.models import Goal

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['age', 'wake_up_time', 'bedtime', 'sleep_duration_hours']
        read_only_fields = ['bedtime', 'sleep_duration_hours']

class FixedCommitmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FixedCommitment
        fields = ['name', 'category', 'start_time', 'end_time', 'days_of_week']

class EverydayActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = EverydayActivity
        fields = ['name', 'category', 'duration_minutes', 'preferred_time']

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ['name', 'goal_type', 'priority', 'deadline', 'daily_target_hours', 'initial_estimate_level', 'assessment_data']

class OnboardingCompleteSerializer(serializers.Serializer):
    profile = UserProfileSerializer(required=False)
    fixed_commitments = FixedCommitmentSerializer(many=True, required=False)
    everyday_activities = EverydayActivitySerializer(many=True, required=False)
    goals = GoalSerializer(many=True, required=False)

    def create(self, validated_data):
        user = self.context['request'].user
        
        # 1. Update Profile
        profile_data = validated_data.pop('profile', {})
        profile, _ = UserProfile.objects.get_or_create(user=user)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.onboarding_completed = True
        profile.save()

        # 2. Create Fixed Commitments
        commitments_data = validated_data.pop('fixed_commitments', [])
        for c_data in commitments_data:
            FixedCommitment.objects.create(user=user, **c_data)

        # 3. Create Everyday Activities
        activities_data = validated_data.pop('everyday_activities', [])
        for a_data in activities_data:
            EverydayActivity.objects.create(user=user, **a_data)

        # 4. Create Goals
        goals_data = validated_data.pop('goals', [])
        for g_data in goals_data:
            Goal.objects.create(user=user, **g_data)

        return profile

class AssessGoalRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    goal_type = serializers.CharField(max_length=50)
    initial_estimate_level = serializers.IntegerField(min_value=1, max_value=10)
