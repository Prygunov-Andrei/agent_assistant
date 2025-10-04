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
    # Дополнительные endpoints для фронтенда
    path('requests/<int:pk>/text/', RequestViewSet.as_view({'get': 'get_request_text'}), name='request-text'),
    path('requests/<int:pk>/media/', RequestViewSet.as_view({'get': 'get_request_media'}), name='request-media'),
    path('requests/<int:pk>/media/clear-cache/', RequestViewSet.as_view({'post': 'clear_media_cache'}), name='request-media-clear-cache'),
]
