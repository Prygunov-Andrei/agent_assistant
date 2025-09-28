from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectTypeViewSet, GenreViewSet, RoleTypeViewSet,
    ProjectViewSet, ProjectRoleViewSet
)

router = DefaultRouter()
router.register(r'project-types', ProjectTypeViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'role-types', RoleTypeViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-roles', ProjectRoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
