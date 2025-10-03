from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes
from .models import Person
from .serializers import (
    PersonSerializer, 
    PersonListSerializer, 
    PersonMatchSerializer,
    PersonSearchRequestSerializer,
    PersonNameSearchRequestSerializer,
    PersonTypeSerializer
)
from .services import person_matching_service


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
    
    @extend_schema(
        summary="Поиск совпадений персон",
        description="Поиск персон по email, телефону, telegram и другим критериям с использованием fuzzy matching",
        request=PersonSearchRequestSerializer,
        responses={200: PersonMatchSerializer(many=True)},
        tags=["Персоны"]
    )
    @action(detail=False, methods=['post'])
    def search_matches(self, request):
        """Поиск совпадений персон по различным критериям"""
        serializer = PersonSearchRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        search_data = serializer.validated_data
        person_type = search_data.pop('person_type', None)
        limit = search_data.pop('limit', 5)
        
        # Выполняем поиск совпадений
        matches = person_matching_service.search_matches(
            search_data=search_data,
            person_type=person_type,
            limit=limit
        )
        
        # Сериализуем результаты
        result_data = []
        for match in matches:
            person = match['person']
            person_data = {
                'id': person.id,
                'person_type': person.person_type,
                'person_type_display': person.get_person_type_display(),
                'first_name': person.first_name,
                'last_name': person.last_name,
                'middle_name': person.middle_name,
                'full_name': person.full_name,
                'short_name': person.short_name,
                'photo': person.photo.url if person.photo else None,
                'email': person.email,
                'phone': person.phone,
                'telegram_username': person.telegram_username,
                'score': match['score'],
                'confidence': match['confidence'],
            }
            result_data.append(person_data)
        
        return Response(result_data)
    
    @extend_schema(
        summary="Поиск персон по имени",
        description="Поиск персон по имени с использованием fuzzy matching",
        request=PersonNameSearchRequestSerializer,
        responses={200: PersonMatchSerializer(many=True)},
        tags=["Персоны"]
    )
    @action(detail=False, methods=['post'])
    def search_by_name(self, request):
        """Поиск персон по имени с использованием fuzzy matching"""
        serializer = PersonNameSearchRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        search_data = serializer.validated_data
        name = search_data['name']
        person_type = search_data.get('person_type')
        limit = search_data.get('limit', 5)
        
        # Выполняем поиск по имени
        matches = person_matching_service.search_by_name(
            name=name,
            person_type=person_type,
            limit=limit
        )
        
        # Сериализуем результаты
        result_data = []
        for match in matches:
            person = match['person']
            person_data = {
                'id': person.id,
                'person_type': person.person_type,
                'person_type_display': person.get_person_type_display(),
                'first_name': person.first_name,
                'last_name': person.last_name,
                'middle_name': person.middle_name,
                'full_name': person.full_name,
                'short_name': person.short_name,
                'photo': person.photo.url if person.photo else None,
                'email': person.email,
                'phone': person.phone,
                'telegram_username': person.telegram_username,
                'score': match['score'],
                'confidence': match['confidence'],
            }
            result_data.append(person_data)
        
        return Response(result_data)
    
    @extend_schema(
        summary="Получить персон по типу",
        description="Получить список персон определенного типа",
        parameters=[
            OpenApiParameter(
                name='person_type',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description='Тип персоны (director, producer, casting_director)',
                required=True
            )
        ],
        responses={200: PersonListSerializer(many=True)},
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'], url_path='by-type/(?P<person_type>[^/.]+)')
    def by_type(self, request, person_type=None):
        """Получить список персон по типу"""
        if person_type not in [choice[0] for choice in Person.PERSON_TYPES]:
            return Response(
                {'error': f'Неверный тип персоны. Доступные типы: {[choice[0] for choice in Person.PERSON_TYPES]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        persons = person_matching_service.get_persons_by_type(person_type)
        serializer = PersonListSerializer(persons, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Получить типы персон",
        description="Получить список доступных типов персон",
        responses={200: PersonTypeSerializer(many=True)},
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def person_types(self, request):
        """Получить список доступных типов персон"""
        types = person_matching_service.get_person_types()
        serializer = PersonTypeSerializer(types, many=True)
        return Response(serializer.data)