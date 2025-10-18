"""
URL-маршруты для приложения core.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BackupViewSet

# Создаем роутер для API endpoints
router = DefaultRouter()
router.register(r'backups', BackupViewSet, basename='backup')

urlpatterns = [
    path('core/', include(router.urls)),
]
