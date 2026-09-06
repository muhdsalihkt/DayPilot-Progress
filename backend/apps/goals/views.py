from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Goal, RoadmapPhase, RoadmapObjective
from .serializers import GoalSerializer
from apps.ai.services import generate_roadmap
from django.db import transaction

class GoalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        goals = Goal.objects.filter(user=request.user)
        serializer = GoalSerializer(goals, many=True)
        return Response(serializer.data)

class GenerateRoadmapView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        goal = get_object_or_404(Goal, pk=pk, user=request.user)
        
        # If phases already exist, we might not want to overwrite unless requested.
        # But for this MVP, we will clear existing ones and regenerate.
        
        try:
            deadline_str = goal.deadline.isoformat() if goal.deadline else None
            
            roadmap_data = generate_roadmap(
                goal_name=goal.name,
                initial_level=goal.initial_estimate_level,
                goal_type=goal.goal_type,
                assessment_data=goal.assessment_data,
                deadline=deadline_str
            )
            
            with transaction.atomic():
                goal.phases.all().delete()
                
                # Update deadline if AI generated one
                ai_deadline = roadmap_data.get('estimated_completion_date')
                if ai_deadline and not goal.deadline:
                    from datetime import datetime
                    try:
                        goal.deadline = datetime.strptime(ai_deadline, "%Y-%m-%d").date()
                        goal.save()
                    except ValueError:
                        pass # Ignore if AI returns invalid date format
                
                for p_idx, phase_data in enumerate(roadmap_data.get('phases', [])):
                    phase = RoadmapPhase.objects.create(
                        goal=goal,
                        title=phase_data['title'],
                        description=phase_data['description'],
                        order=p_idx,
                        estimated_weeks=phase_data['estimated_weeks']
                    )
                    
                    for o_idx, obj_data in enumerate(phase_data.get('objectives', [])):
                        RoadmapObjective.objects.create(
                            phase=phase,
                            title=obj_data['title'],
                            description=obj_data['description'],
                            order=o_idx
                        )
            
            # Re-fetch the goal to return updated data
            goal.refresh_from_db()
            serializer = GoalSerializer(goal)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e), "detail": "The AI service failed to generate a roadmap. Please check your Gemini API key."},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception as e:
            return Response(
                {"error": str(e), "detail": "An unexpected error occurred while generating the roadmap."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
