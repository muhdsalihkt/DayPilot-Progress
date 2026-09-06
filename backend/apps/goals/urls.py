from django.urls import path
from .views import GoalListView, GenerateRoadmapView

urlpatterns = [
    path('', GoalListView.as_view(), name='goal_list'),
    path('<uuid:pk>/generate-roadmap/', GenerateRoadmapView.as_view(), name='generate_roadmap'),
]
