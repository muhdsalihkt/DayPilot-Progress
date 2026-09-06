from django.urls import path
from .views import TaskStatusUpdateView, TaskEditView, DueNotificationsView

urlpatterns = [
    path('<uuid:pk>/status/', TaskStatusUpdateView.as_view(), name='task-status-update'),
    path('<uuid:pk>/edit/', TaskEditView.as_view(), name='task-edit'),
    path('due/', DueNotificationsView.as_view(), name='task-due-notifications'),
]
