from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
from .models import ProjectType, Genre, RoleType, Project, ProjectRole
from .serializers import (
    ProjectTypeSerializer, GenreSerializer, RoleTypeSerializer,
    ProjectSerializer, ProjectListSerializer, ProjectRoleSerializer, ProjectRoleListSerializer
)


class ProjectPermission(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.created_by == request.user


class ProjectRolePermission(permissions.BasePermission):
    """
    Custom permission to only allow owners of the project to edit or delete roles.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the project.
        return obj.project.created_by == request.user


# Вспомогательные ViewSets для справочников
@extend_schema_view(
    list=extend_schema(
        summary="Список типов проектов",
        description="Получить список всех активных типов проектов",
        tags=["Справочники"]
    ),
    retrieve=extend_schema(
        summary="Получить тип проекта",
        description="Получить информацию о конкретном типе проекта",
        tags=["Справочники"]
    ),
)
class ProjectTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для типов проектов (только чтение)"""
    queryset = ProjectType.objects.filter(is_active=True)
    serializer_class = ProjectTypeSerializer
    permission_classes = [permissions.AllowAny]


@extend_schema_view(
    list=extend_schema(
        summary="Список жанров",
        description="Получить список всех активных жанров",
        tags=["Справочники"]
    ),
    retrieve=extend_schema(
        summary="Получить жанр",
        description="Получить информацию о конкретном жанре",
        tags=["Справочники"]
    ),
)
class GenreViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для жанров (только чтение)"""
    queryset = Genre.objects.filter(is_active=True)
    serializer_class = GenreSerializer
    permission_classes = [permissions.AllowAny]


@extend_schema_view(
    list=extend_schema(
        summary="Список типов ролей",
        description="Получить список всех активных типов ролей",
        tags=["Справочники"]
    ),
    retrieve=extend_schema(
        summary="Получить тип роли",
        description="Получить информацию о конкретном типе роли",
        tags=["Справочники"]
    ),
)
class RoleTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для типов ролей (только чтение)"""
    queryset = RoleType.objects.filter(is_active=True)
    serializer_class = RoleTypeSerializer
    permission_classes = [permissions.AllowAny]


# Основные ViewSets
@extend_schema_view(
    list=extend_schema(
        summary="Список проектов",
        description="Получить список всех активных проектов",
        tags=["Проекты"]
    ),
    create=extend_schema(
        summary="Создать проект",
        description="Создать новый проект в системе",
        tags=["Проекты"]
    ),
    retrieve=extend_schema(
        summary="Получить проект",
        description="Получить информацию о конкретном проекте",
        tags=["Проекты"]
    ),
    update=extend_schema(
        summary="Обновить проект",
        description="Полностью обновить информацию о проекте",
        tags=["Проекты"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить проект",
        description="Частично обновить информацию о проекте",
        tags=["Проекты"]
    ),
    destroy=extend_schema(
        summary="Удалить проект",
        description="Удалить проект из системы",
        tags=["Проекты"]
    ),
)
class ProjectViewSet(viewsets.ModelViewSet):
    """ViewSet для управления проектами"""
    
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated, ProjectPermission]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer
    
    def get_queryset(self):
        """Фильтрация queryset для списка активных проектов"""
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @extend_schema(
        summary="Мои проекты",
        description="Получить список проектов, созданных текущим агентом",
        tags=["Проекты"]
    )
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Получить список проектов, созданных текущим агентом"""
        projects = self.get_queryset().filter(created_by=request.user)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Поиск проектов",
        description="Поиск проектов по названию, типу, жанру и другим параметрам",
        parameters=[
            OpenApiParameter(
                name='title',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Часть названия проекта для поиска'
            ),
            OpenApiParameter(
                name='project_type',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID типа проекта для фильтрации'
            ),
            OpenApiParameter(
                name='genre',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID жанра для фильтрации'
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Статус проекта для фильтрации'
            ),
        ],
        tags=["Проекты"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск проектов по различным параметрам"""
        queryset = self.get_queryset()
        
        title = request.query_params.get('title', None)
        project_type = request.query_params.get('project_type', None)
        genre = request.query_params.get('genre', None)
        status = request.query_params.get('status', None)
        
        if title:
            queryset = queryset.filter(title__icontains=title)
        if project_type:
            queryset = queryset.filter(project_type_id=project_type)
        if genre:
            queryset = queryset.filter(genre_id=genre)
        if status:
            queryset = queryset.filter(status=status)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Список ролей",
        description="Получить список всех активных ролей в проектах",
        tags=["Роли"]
    ),
    create=extend_schema(
        summary="Создать роль",
        description="Создать новую роль в проекте",
        tags=["Роли"]
    ),
    retrieve=extend_schema(
        summary="Получить роль",
        description="Получить информацию о конкретной роли",
        tags=["Роли"]
    ),
    update=extend_schema(
        summary="Обновить роль",
        description="Полностью обновить информацию о роли",
        tags=["Роли"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить роль",
        description="Частично обновить информацию о роли",
        tags=["Роли"]
    ),
    destroy=extend_schema(
        summary="Удалить роль",
        description="Удалить роль из системы",
        tags=["Роли"]
    ),
)
class ProjectRoleViewSet(viewsets.ModelViewSet):
    """ViewSet для управления ролями в проектах"""
    
    queryset = ProjectRole.objects.all()
    permission_classes = [permissions.IsAuthenticated, ProjectRolePermission]
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return ProjectRoleListSerializer
        return ProjectRoleSerializer
    
    def get_queryset(self):
        """Фильтрация queryset для списка активных ролей"""
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @extend_schema(
        summary="Роли проекта",
        description="Получить список ролей конкретного проекта",
        parameters=[
            OpenApiParameter(
                name='project_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID проекта для фильтрации ролей'
            ),
        ],
        tags=["Роли"]
    )
    @action(detail=False, methods=['get'])
    def by_project(self, request):
        """Получить роли конкретного проекта"""
        project_id = request.query_params.get('project_id', None)
        if project_id:
            queryset = self.get_queryset().filter(project_id=project_id)
        else:
            queryset = self.get_queryset()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Поиск ролей",
        description="Поиск ролей по названию, типу и другим параметрам",
        parameters=[
            OpenApiParameter(
                name='name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Часть названия роли для поиска'
            ),
            OpenApiParameter(
                name='role_type',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID типа роли для фильтрации'
            ),
            OpenApiParameter(
                name='media_presence',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Медийность для фильтрации'
            ),
        ],
        tags=["Роли"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск ролей по различным параметрам"""
        queryset = self.get_queryset()
        
        name = request.query_params.get('name', None)
        role_type = request.query_params.get('role_type', None)
        media_presence = request.query_params.get('media_presence', None)
        
        if name:
            queryset = queryset.filter(name__icontains=name)
        if role_type:
            queryset = queryset.filter(role_type_id=role_type)
        if media_presence:
            queryset = queryset.filter(media_presence=media_presence)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)