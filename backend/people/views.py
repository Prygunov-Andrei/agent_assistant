from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
from .models import Person
from .serializers import PersonSerializer, PersonListSerializer


class PersonPermission(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.created_by == request.user


@extend_schema_view(
    list=extend_schema(
        summary="Список персон",
        description="Получить список всех активных персон (режиссеров, продюсеров и кастинг-директоров)",
        tags=["Персоны"]
    ),
    create=extend_schema(
        summary="Создать персону",
        description="Создать новую персону в системе",
        tags=["Персоны"]
    ),
    retrieve=extend_schema(
        summary="Получить персону",
        description="Получить информацию о конкретной персоне",
        tags=["Персоны"]
    ),
    update=extend_schema(
        summary="Обновить персону",
        description="Полностью обновить информацию о персоне",
        tags=["Персоны"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить персону",
        description="Частично обновить информацию о персоне",
        tags=["Персоны"]
    ),
    destroy=extend_schema(
        summary="Удалить персону",
        description="Удалить персону из системы",
        tags=["Персоны"]
    ),
)
class PersonViewSet(viewsets.ModelViewSet):
    """ViewSet для управления персонами (режиссерами и продюсерами)"""
    
    queryset = Person.objects.all()
    permission_classes = [permissions.IsAuthenticated, PersonPermission]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return PersonListSerializer
        return PersonSerializer
    
    def get_queryset(self):
        """Фильтрация queryset для списка активных персон"""
        queryset = super().get_queryset()
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @extend_schema(
        summary="Мои персоны",
        description="Получить список персон, созданных текущим агентом",
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def my_people(self, request):
        """Получить список персон, созданных текущим агентом"""
        people = self.get_queryset().filter(created_by=request.user)
        serializer = self.get_serializer(people, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Поиск персон",
        description="Поиск персон по имени, типу и другим параметрам",
        parameters=[
            OpenApiParameter(
                name='name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Часть имени персоны для поиска'
            ),
            OpenApiParameter(
                name='person_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Тип персоны для фильтрации (director, producer, casting_director)'
            ),
            OpenApiParameter(
                name='nationality',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Национальность для фильтрации'
            ),
        ],
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск персон по различным параметрам"""
        queryset = self.get_queryset()
        
        name = request.query_params.get('name', None)
        person_type = request.query_params.get('person_type', None)
        nationality = request.query_params.get('nationality', None)
        
        if name:
            queryset = queryset.filter(
                Q(first_name__icontains=name) |
                Q(last_name__icontains=name) |
                Q(middle_name__icontains=name)
            )
        if person_type:
            queryset = queryset.filter(person_type=person_type)
        if nationality:
            queryset = queryset.filter(nationality__icontains=nationality)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Режиссеры",
        description="Получить список всех режиссеров",
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def directors(self, request):
        """Получить список всех режиссеров"""
        directors = self.get_queryset().filter(person_type='director')
        serializer = self.get_serializer(directors, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Продюсеры",
        description="Получить список всех продюсеров",
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def producers(self, request):
        """Получить список всех продюсеров"""
        producers = self.get_queryset().filter(person_type='producer')
        serializer = self.get_serializer(producers, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Кастинг-директоры",
        description="Получить список всех кастинг-директоров",
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def casting_directors(self, request):
        """Получить список всех кастинг-директоров"""
        casting_directors = self.get_queryset().filter(person_type='casting_director')
        serializer = self.get_serializer(casting_directors, many=True)
        return Response(serializer.data)