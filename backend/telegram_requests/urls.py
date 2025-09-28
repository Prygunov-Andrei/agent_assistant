from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequestViewSet, RequestImageViewSet, RequestFileViewSet, TelegramWebhookViewSet

router = DefaultRouter()
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'request-images', RequestImageViewSet, basename='request-image')
router.register(r'request-files', RequestFileViewSet, basename='request-file')

# Отдельный роутер для webhook
webhook_router = DefaultRouter()
webhook_router.register(r'telegram', TelegramWebhookViewSet, basename='telegram-webhook')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/', include(webhook_router.urls)),
]
