from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/goals/', include('apps.goals.urls')),
    path('api/v1/tasks/', include('apps.tasks.urls')),
    path('api/v1/schedules/', include('apps.scheduling.urls')),
    path('api/v1/progress/', include('apps.progress.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),
    path('api/v1/admin/', include('apps.admin_panel.urls')),
]
