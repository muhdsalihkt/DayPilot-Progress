from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Task
from .serializers import TaskSerializer, TaskStatusUpdateSerializer, TaskEditSerializer
from apps.scheduling.engine import SchedulingEngine

class TaskStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk, user=request.user)
        serializer = TaskStatusUpdateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            new_status = serializer.validated_data.get('status')
            if new_status == Task.Status.COMPLETED and task.status != Task.Status.COMPLETED:
                task.completed_at = timezone.now()
            elif new_status != Task.Status.COMPLETED:
                task.completed_at = None
                
            serializer.save()
            
            # Recalculate and cache Goal progress
            from apps.goals.services import calculate_goal_progress
            calculate_goal_progress(task.goal)
            
            # Return full task data
            return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskEditView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk, user=request.user)
        serializer = TaskEditSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # MVP Dynamic Recalculation: Just update the corresponding schedule block's end time.
            # A true AI recalculation would shift all subsequent blocks without deleting existing tasks.
            from apps.scheduling.models import ScheduleBlock
            from apps.scheduling.engine import add_minutes_to_time
            block = ScheduleBlock.objects.filter(task=task).first()
            if block:
                block.end_time = add_minutes_to_time(block.start_time, task.duration_minutes)
                block.save()

            return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DueNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.scheduling.models import ScheduleBlock
        from datetime import datetime
        
        now = timezone.localtime(timezone.now())
        current_time = now.time()
        current_date = now.date()
        
        # Give a 2-minute window to avoid exact second mismatch issues from polling
        start_bound = (now - timezone.timedelta(minutes=1)).time()
        end_bound = (now + timezone.timedelta(minutes=1)).time()

        due_blocks = ScheduleBlock.objects.filter(
            schedule__user=request.user,
            schedule__date=current_date,
            block_type='TASK',
            task__notify=True,
            start_time__gte=start_bound,
            start_time__lte=end_bound,
            task__status=Task.Status.PENDING # Don't notify if already complete or in progress
        )
        
        tasks_due = []
        for block in due_blocks:
            serializer = TaskSerializer(block.task)
            task_data = serializer.data
            task_data['start_time'] = block.start_time
            tasks_due.append(task_data)
            
        return Response(tasks_due, status=status.HTTP_200_OK)
