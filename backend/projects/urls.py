from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectTypeViewSet, GenreViewSet, RoleTypeViewSet,
    ShoeSizeViewSet, NationalityViewSet,
    ProjectViewSet, ProjectRoleViewSet
)

router = DefaultRouter()
router.register(r'project-types', ProjectTypeViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'role-types', RoleTypeViewSet)
router.register(r'shoe-sizes', ShoeSizeViewSet)
router.register(r'nationalities', NationalityViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'project-roles', ProjectRoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Дополнительные endpoints для фронтенда
    path('api/projects/search-matches/', ProjectViewSet.as_view({'post': 'search_matches'}), name='project-search-matches'),
    path('api/projects/search-by-title/', ProjectViewSet.as_view({'post': 'search_by_title'}), name='project-search-by-title'),
    path('api/projects/by-status/', ProjectViewSet.as_view({'get': 'by_status'}), name='projects-by-status'),
    path('api/projects/project-statuses/', ProjectViewSet.as_view({'get': 'project_statuses'}), name='project-statuses'),
           path('api/projects/project-types/', ProjectTypeViewSet.as_view({'get': 'list'}), name='project-types-list'),
           path('api/projects/genres/', GenreViewSet.as_view({'get': 'list'}), name='genres-list'),
           path('api/projects/create-with-roles/', ProjectViewSet.as_view({'post': 'create_with_roles'}), name='project-create-with-roles'),
]
