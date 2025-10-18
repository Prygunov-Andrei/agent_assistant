from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
from .permissions import OwnerPermission
from .models import BackupRecord
from .serializers import BackupRecordSerializer, BackupStatisticsSerializer, BackupCreateSerializer
from .backup_manager import BackupManager


class BaseReferenceViewSet(viewsets.ModelViewSet):
    """
    Базовый ViewSet для справочных моделей.
    
    Предоставляет стандартные CRUD операции для справочников:
    - list: получение списка активных элементов
    - create: создание нового элемента (требует аутентификации)
    - retrieve: получение конкретного элемента
    - update/partial_update: обновление элемента (требует аутентификации)
    - destroy: удаление элемента (требует аутентификации)
    """
    
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        Возвращает queryset с фильтрацией по активности.
        
        Для списка возвращает только активные элементы,
        для детального просмотра - все элементы.
        """
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @extend_schema(
        summary="Список элементов справочника",
        description="Получить список всех активных элементов справочника",
        tags=["Справочники"]
    )
    def list(self, request, *args, **kwargs):
        """Получение списка активных элементов справочника."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        summary="Создать элемент справочника",
        description="Создать новый элемент справочника",
        tags=["Справочники"]
    )
    def create(self, request, *args, **kwargs):
        """Создание нового элемента справочника."""
        return super().create(request, *args, **kwargs)
    
    @extend_schema(
        summary="Получить элемент справочника",
        description="Получить информацию о конкретном элементе справочника",
        tags=["Справочники"]
    )
    def retrieve(self, request, *args, **kwargs):
        """Получение конкретного элемента справочника."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="Обновить элемент справочника",
        description="Полностью обновить информацию об элементе справочника",
        tags=["Справочники"]
    )
    def update(self, request, *args, **kwargs):
        """Полное обновление элемента справочника."""
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Частично обновить элемент справочника",
        description="Частично обновить информацию об элементе справочника",
        tags=["Справочники"]
    )
    def partial_update(self, request, *args, **kwargs):
        """Частичное обновление элемента справочника."""
        return super().partial_update(request, *args, **kwargs)
    
    @extend_schema(
        summary="Удалить элемент справочника",
        description="Удалить элемент справочника",
        tags=["Справочники"]
    )
    def destroy(self, request, *args, **kwargs):
        """Удаление элемента справочника."""
        return super().destroy(request, *args, **kwargs)


class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Базовый ViewSet для основных моделей.
    
    Предоставляет стандартные CRUD операции с дополнительными методами:
    - perform_create: автоматически устанавливает created_by
    - get_queryset: фильтрует по активности для списка
    - my_items: получение объектов текущего пользователя
    - search: поиск по различным параметрам
    """
    
    permission_classes = [permissions.IsAuthenticated, OwnerPermission]
    
    def perform_create(self, serializer):
        """
        Автоматически устанавливает создателя объекта при создании.
        
        Args:
            serializer: сериализатор с данными для создания объекта
        """
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        """
        Возвращает queryset с фильтрацией по активности.
        
        Для списка возвращает только активные элементы,
        для детального просмотра - все элементы.
        """
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @extend_schema(
        summary="Мои объекты",
        description="Получить список объектов, созданных текущим пользователем",
        tags=["Основные сущности"]
    )
    @action(detail=False, methods=['get'])
    def my_items(self, request):
        """
        Получение списка объектов, созданных текущим пользователем.
        
        Returns:
            Response: список объектов пользователя
        """
        items = self.get_queryset().filter(created_by=request.user)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Поиск объектов",
        description="Поиск объектов по различным параметрам",
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Поисковый запрос для поиска по названию или описанию'
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Фильтр по активности объекта'
            ),
        ],
        tags=["Основные сущности"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Поиск объектов по различным параметрам.
        
        Поддерживаемые параметры:
        - search: поиск по названию или описанию
        - is_active: фильтр по активности
        
        Returns:
            Response: список найденных объектов
        """
        queryset = self.get_queryset()
        
        # Поиск по тексту (должен быть переопределен в наследниках)
        search_query = request.query_params.get('search', None)
        if search_query:
            queryset = self._apply_search_filter(queryset, search_query)
        
        # Фильтр по активности
        is_active = request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def _apply_search_filter(self, queryset, search_query):
        """
        Применяет поисковый фильтр к queryset.
        
        Должен быть переопределен в наследниках для конкретной логики поиска.
        
        Args:
            queryset: исходный queryset
            search_query: поисковый запрос
            
        Returns:
            QuerySet: отфильтрованный queryset
        """
        # Базовая реализация - поиск по полю 'name' если оно существует
        if hasattr(self.queryset.model, 'name'):
            return queryset.filter(name__icontains=search_query)
        return queryset


class BackupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для управления резервными копиями базы данных.
    
    Предоставляет операции для просмотра истории бэкапов,
    создания новых бэкапов и получения статистики.
    """
    
    queryset = BackupRecord.objects.all()
    serializer_class = BackupRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Возвращает queryset с сортировкой по дате создания"""
        return BackupRecord.objects.all().order_by('-created_at')
    
    @extend_schema(
        summary="Список бэкапов",
        description="Получить список всех резервных копий",
        tags=["Резервные копии"]
    )
    def list(self, request, *args, **kwargs):
        """Получение списка всех бэкапов."""
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        summary="Получить бэкап",
        description="Получить информацию о конкретном бэкапе",
        tags=["Резервные копии"]
    )
    def retrieve(self, request, *args, **kwargs):
        """Получение информации о конкретном бэкапе."""
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="Создать новый бэкап",
        description="Создать новую резервную копию базы данных",
        request=BackupCreateSerializer,
        responses={201: BackupRecordSerializer},
        tags=["Резервные копии"]
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def create_backup(self, request):
        """
        Создание новой резервной копии базы данных.
        
        Требует права администратора (is_staff=True).
        
        Returns:
            Response: информация о созданном бэкапе
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Только администраторы могут создавать бэкапы'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            backup_manager = BackupManager()
            backup_record = backup_manager.create_backup(user=request.user)
            
            serializer = BackupRecordSerializer(backup_record)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка создания бэкапа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Статистика бэкапов",
        description="Получить статистику по резервным копиям",
        responses={200: BackupStatisticsSerializer},
        tags=["Резервные копии"]
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Получение статистики по бэкапам.
        
        Returns:
            Response: статистика бэкапов
        """
        try:
            backup_manager = BackupManager()
            stats = backup_manager.get_backup_statistics()
            
            serializer = BackupStatisticsSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка получения статистики: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="Удалить бэкап",
        description="Удалить резервную копию с Google Drive",
        tags=["Резервные копии"]
    )
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def delete_backup(self, request, pk=None):
        """
        Удаление резервной копии.
        
        Требует права администратора (is_staff=True).
        
        Args:
            pk: ID записи о бэкапе
            
        Returns:
            Response: результат операции
        """
        if not request.user.is_staff:
            return Response(
                {'error': 'Только администраторы могут удалять бэкапы'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            backup_manager = BackupManager()
            success = backup_manager.delete_backup(pk, user=request.user)
            
            if success:
                return Response(
                    {'message': 'Бэкап успешно удален'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Ошибка удаления бэкапа'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Ошибка удаления бэкапа: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )