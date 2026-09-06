from django.urls import path
from .views import GenerateScheduleView, DailyScheduleListView, DeleteScheduleView, EverydayActivityListCreateView, EverydayActivityDeleteView, ToggleBlockCompleteView

urlpatterns = [
    path('generate/', GenerateScheduleView.as_view(), name='generate_schedule'),
    path('delete/', DeleteScheduleView.as_view(), name='delete_schedule'),
    path('', DailyScheduleListView.as_view(), name='schedule_list'),
    path('activities/', EverydayActivityListCreateView.as_view(), name='activity_list_create'),
    path('activities/<uuid:pk>/delete/', EverydayActivityDeleteView.as_view(), name='activity_delete'),
    path('blocks/<uuid:pk>/toggle/', ToggleBlockCompleteView.as_view(), name='toggle_block_complete'),
]
