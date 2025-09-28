from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
from .models import ProjectType, Genre, RoleType, Project, ProjectRole
from .serializers import (
    ProjectTypeSerializer, GenreSerializer, RoleTypeSerializer,
    ProjectSerializer, ProjectListSerializer,
    ProjectRoleSerializer, ProjectRoleListSerializer
)
from core.views import BaseReferenceViewSet, BaseModelViewSet
from core.permissions import ProjectRolePermission


class ProjectTypeViewSet(BaseReferenceViewSet):
    """
    ViewSet для управления типами проектов.
    
    Наследует от BaseReferenceViewSet все стандартные методы CRUD
    и настройки для справочных моделей.
    """
    
    queryset = ProjectType.objects.all()
    serializer_class = ProjectTypeSerializer


class GenreViewSet(BaseReferenceViewSet):
    """
    ViewSet для управления жанрами проектов.
    
    Наследует от BaseReferenceViewSet все стандартные методы CRUD
    и настройки для справочных моделей.
    """
    
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer


class RoleTypeViewSet(BaseReferenceViewSet):
    """
    ViewSet для управления типами ролей.
    
    Наследует от BaseReferenceViewSet все стандартные методы CRUD
    и настройки для справочных моделей.
    """
    
    queryset = RoleType.objects.all()
    serializer_class = RoleTypeSerializer


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
        description="Удалить проект",
        tags=["Проекты"]
    ),
)
class ProjectViewSet(BaseModelViewSet):
    """
    ViewSet для управления проектами.
    
    Наследует от BaseModelViewSet базовые методы и добавляет специфичные
    для проектов методы поиска и фильтрации.
    """
    
    queryset = Project.objects.all()
    
    def get_serializer_class(self):
        """
        Возвращает соответствующий сериализатор в зависимости от действия.
        
        Returns:
            Serializer: сериализатор для списка или детального представления
        """
        if self.action in ['list', 'my_items', 'search']:
            return ProjectListSerializer
        return ProjectSerializer
    
    def _apply_search_filter(self, queryset, search_query):
        """
        Применяет поисковый фильтр для проектов.
        
        Ищет по названию проекта и описанию.
        
        Args:
            queryset: исходный queryset
            search_query: поисковый запрос
            
        Returns:
            QuerySet: отфильтрованный queryset
        """
        return queryset.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    @extend_schema(
        summary="Мои проекты",
        description="Получить список проектов, созданных текущим агентом",
        tags=["Проекты"]
    )
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """
        Получение списка проектов текущего пользователя.
        
        Переопределяет базовый метод my_items для соответствия API.
        
        Returns:
            Response: список проектов пользователя
        """
        return self.my_items(request)
    
    @extend_schema(
        summary="Поиск проектов",
        description="Поиск проектов по названию, статусу, типу или жанру",
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Поиск по названию или описанию проекта'
            ),
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Статус проекта для фильтрации (in_production, cancelled, completed)'
            ),
            OpenApiParameter(
                name='project_type_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID типа проекта для фильтрации'
            ),
            OpenApiParameter(
                name='genre_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID жанра проекта для фильтрации'
            ),
        ],
        tags=["Проекты"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Поиск проектов по различным параметрам.
        
        Поддерживает поиск по:
        - Названию и описанию проекта
        - Статусу проекта
        - Типу проекта
        - Жанру проекта
        
        Returns:
            Response: список найденных проектов
        """
        queryset = self.get_queryset()
        
        # Поиск по тексту (использует базовый метод)
        search_query = request.query_params.get('search', None)
        if search_query:
            queryset = self._apply_search_filter(queryset, search_query)
        
        # Дополнительные фильтры для проектов
        status = request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        project_type_id = request.query_params.get('project_type_id', None)
        if project_type_id:
            queryset = queryset.filter(project_type_id=project_type_id)
        
        genre_id = request.query_params.get('genre_id', None)
        if genre_id:
            queryset = queryset.filter(genre_id=genre_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Список ролей в проектах",
        description="Получить список всех ролей в проектах",
        tags=["Роли в проектах"]
    ),
    create=extend_schema(
        summary="Создать роль в проекте",
        description="Создать новую роль для проекта",
        tags=["Роли в проектах"]
    ),
    retrieve=extend_schema(
        summary="Получить роль в проекте",
        description="Получить информацию о конкретной роли",
        tags=["Роли в проектах"]
    ),
    update=extend_schema(
        summary="Обновить роль в проекте",
        description="Полностью обновить информацию о роли",
        tags=["Роли в проектах"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить роль в проекте",
        description="Частично обновить информацию о роли",
        tags=["Роли в проектах"]
    ),
    destroy=extend_schema(
        summary="Удалить роль в проекте",
        description="Удалить роль в проекте",
        tags=["Роли в проектах"]
    ),
)
class ProjectRoleViewSet(BaseModelViewSet):
    """
    ViewSet для управления ролями в проектах.
    
    Наследует от BaseModelViewSet базовые методы и добавляет специфичные
    для ролей методы поиска и фильтрации по проектам.
    """
    
    queryset = ProjectRole.objects.all()
    permission_classes = [permissions.IsAuthenticated, ProjectRolePermission]
    
    def get_serializer_class(self):
        """
        Возвращает соответствующий сериализатор в зависимости от действия.
        
        Returns:
            Serializer: сериализатор для списка или детального представления
        """
        if self.action in ['list', 'by_project', 'search']:
            return ProjectRoleListSerializer
        return ProjectRoleSerializer
    
    def _apply_search_filter(self, queryset, search_query):
        """
        Применяет поисковый фильтр для ролей в проектах.
        
        Ищет по названию роли и описанию.
        
        Args:
            queryset: исходный queryset
            search_query: поисковый запрос
            
        Returns:
            QuerySet: отфильтрованный queryset
        """
        return queryset.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    @extend_schema(
        summary="Роли по проекту",
        description="Получить список ролей для конкретного проекта",
        parameters=[
            OpenApiParameter(
                name='project_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID проекта для фильтрации ролей',
                required=True
            ),
        ],
        tags=["Роли в проектах"]
    )
    @action(detail=False, methods=['get'])
    def by_project(self, request):
        """
        Получение ролей для конкретного проекта.
        
        Проверяет права доступа к проекту перед возвратом ролей.
        
        Returns:
            Response: список ролей проекта
        """
        project_id = request.query_params.get('project_id', None)
        if not project_id:
            return Response(
                {"detail": "Параметр project_id обязателен."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, что проект существует и текущий пользователь имеет к нему доступ
        try:
            project = Project.objects.get(id=project_id)
            # Используем ProjectPermission для проверки доступа к родительскому проекту
            self.check_object_permissions(request, project) 
        except Project.DoesNotExist:
            return Response(
                {"detail": "Проект не найден."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except permissions.PermissionDenied:
            return Response(
                {"detail": "У вас нет разрешения на просмотр ролей в этом проекте."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        roles = self.get_queryset().filter(project=project)
        serializer = self.get_serializer(roles, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Поиск ролей в проектах",
        description="Поиск ролей по названию, типу, медийности и другим параметрам",
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Поиск по названию или описанию роли'
            ),
            OpenApiParameter(
                name='role_type_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID типа роли для фильтрации'
            ),
            OpenApiParameter(
                name='media_presence',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Медийность (yes, no, doesnt_matter)'
            ),
        ],
        tags=["Роли в проектах"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Поиск ролей по различным параметрам.
        
        Поддерживает поиск по:
        - Названию и описанию роли
        - Типу роли
        - Медийности
        
        Returns:
            Response: список найденных ролей
        """
        queryset = self.get_queryset()
        
        # Поиск по тексту (использует базовый метод)
        search_query = request.query_params.get('search', None)
        if search_query:
            queryset = self._apply_search_filter(queryset, search_query)
        
        # Дополнительные фильтры для ролей
        role_type_id = request.query_params.get('role_type_id', None)
        if role_type_id:
            queryset = queryset.filter(role_type_id=role_type_id)
        
        media_presence = request.query_params.get('media_presence', None)
        if media_presence:
            queryset = queryset.filter(media_presence=media_presence)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)