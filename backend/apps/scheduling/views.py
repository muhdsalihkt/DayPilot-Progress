from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta
from .models import DailySchedule, EverydayActivity
from .serializers import DailyScheduleSerializer, EverydayActivitySerializer
from .engine import SchedulingEngine
from apps.tasks.models import Task

class GenerateScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_date_str = request.data.get('date')
        if target_date_str:
            target_date = date.fromisoformat(target_date_str)
        else:
            # Default to tomorrow if no date is provided
            target_date = date.today() + timedelta(days=1)
            
        try:
            engine = SchedulingEngine(user=request.user, target_date=target_date)
            schedule = engine.generate_schedule()
            
            serializer = DailyScheduleSerializer(schedule)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeleteScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        target_date_str = request.query_params.get('date')
        if target_date_str:
            target_date = date.fromisoformat(target_date_str)
        else:
            target_date = date.today()

        schedule = DailySchedule.objects.filter(user=request.user, date=target_date).first()
        if not schedule:
            return Response({"message": "No schedule found for this date, nothing to delete."}, status=status.HTTP_200_OK)

        # Delete associated AI-generated tasks (only PENDING ones to preserve history)
        Task.objects.filter(
            user=request.user,
            scheduleblock__schedule=schedule,
            status=Task.Status.PENDING
        ).delete()

        schedule.delete()
        return Response({"message": f"Schedule for {target_date} deleted successfully."}, status=status.HTTP_200_OK)

class DailyScheduleListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return next 7 days
        end_date = date.today() + timedelta(days=7)
        schedules = DailySchedule.objects.filter(
            user=request.user, 
            date__gte=date.today(),
            date__lte=end_date
        ).order_by('date')
        
        serializer = DailyScheduleSerializer(schedules, many=True)
        return Response(serializer.data)


class EverydayActivityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        activities = EverydayActivity.objects.filter(user=request.user, is_active=True)
        serializer = EverydayActivitySerializer(activities, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EverydayActivitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EverydayActivityDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            activity = EverydayActivity.objects.get(pk=pk, user=request.user)
            activity.delete()
            return Response({"message": "Activity deleted."}, status=status.HTTP_200_OK)
        except EverydayActivity.DoesNotExist:
            return Response({"error": "Activity not found."}, status=status.HTTP_404_NOT_FOUND)


class ToggleBlockCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from .models import ScheduleBlock
        try:
            block = ScheduleBlock.objects.get(pk=pk, schedule__user=request.user)
            block.is_completed = not block.is_completed
            block.save()
            return Response({"id": str(block.id), "is_completed": block.is_completed}, status=status.HTTP_200_OK)
        except ScheduleBlock.DoesNotExist:
            return Response({"error": "Block not found."}, status=status.HTTP_404_NOT_FOUND)
