from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import OnboardingCompleteSerializer, AssessGoalRequestSerializer
from apps.ai.services import generate_assessment_questions
from django.db import transaction

class AssessGoalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AssessGoalRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                questions = generate_assessment_questions(
                    goal_name=serializer.validated_data['name'],
                    initial_level=serializer.validated_data['initial_estimate_level'],
                    goal_type=serializer.validated_data['goal_type']
                )
                return Response(questions, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompleteOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingCompleteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    serializer.save()
                return Response({"message": "Onboarding completed successfully."}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from apps.goals.models import Goal
from apps.tasks.models import Task
from apps.scheduling.models import DailySchedule, FixedCommitment, EverydayActivity

class ResetAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            with transaction.atomic():
                # Delete all user data
                Goal.objects.filter(user=request.user).delete()
                Task.objects.filter(user=request.user).delete()
                DailySchedule.objects.filter(user=request.user).delete()
                FixedCommitment.objects.filter(user=request.user).delete()
                EverydayActivity.objects.filter(user=request.user).delete()
                
                # Reset User Profile
                profile = request.user.profile
                profile.age = None
                profile.wake_up_time = None
                profile.bedtime = None
                profile.sleep_duration_hours = None
                profile.onboarding_completed = False
                profile.save()
                
            return Response({"message": "Account reset successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        
        # New users in last 7 days
        seven_days_ago = timezone.now() - timedelta(days=7)
        new_users = User.objects.filter(date_joined__gte=seven_days_ago).count()
        
        # We define "Verified" as users who have completed onboarding
        from .models import UserProfile
        verified_users = UserProfile.objects.filter(onboarding_completed=True).count()
        unverified_users = total_users - verified_users
        
        data = {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "new_users": new_users,
            "verified_users": verified_users,
            "unverified_users": unverified_users,
        }
        
        return Response(data, status=status.HTTP_200_OK)
