from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PersonViewSet,
    bulk_import_upload,
    bulk_import_confirm,
    bulk_import_template
)

router = DefaultRouter()
router.register(r'', PersonViewSet, basename='person')

urlpatterns = [
    # ViewSet endpoints для CRUD операций с персонами
    path('people/', include(router.urls)),
    
    # Endpoints для массового импорта персон
    path('people/bulk-import/upload/', bulk_import_upload, name='bulk-import-upload'),
    path('people/bulk-import/confirm/', bulk_import_confirm, name='bulk-import-confirm'),
    path('people/bulk-import/template/', bulk_import_template, name='bulk-import-template'),
]
