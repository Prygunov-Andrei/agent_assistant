from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Case, When, IntegerField
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


class PersonPagination(PageNumberPagination):
    """Пагинация для списка персон"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


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
    pagination_class = PersonPagination
    
    def perform_create(self, serializer):
        # Явно устанавливаем is_active=True при создании
        serializer.save(created_by=self.request.user, is_active=True)
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return PersonListSerializer
        return PersonSerializer
    
    def get_queryset(self):
        """Фильтрация queryset для списка активных персон с аннотацией количества проектов"""
        queryset = super().get_queryset()
        
        # Аннотация количества проектов для каждого типа персоны
        queryset = queryset.annotate(
            projects_count=Case(
                When(person_type='casting_director', then=Count('casting_projects', distinct=True)),
                When(person_type='director', then=Count('directed_projects', distinct=True)),
                When(person_type='producer', then=Count('produced_projects', distinct=True)),
                default=0,
                output_field=IntegerField()
            )
        )
        
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
        description="Расширенный поиск персон по имени, контактам, проектам и другим параметрам",
        parameters=[
            OpenApiParameter(
                name='name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Часть имени персоны для поиска'
            ),
            OpenApiParameter(
                name='phone',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Телефон для поиска'
            ),
            OpenApiParameter(
                name='email',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Email для поиска'
            ),
            OpenApiParameter(
                name='telegram',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Telegram username для поиска'
            ),
            OpenApiParameter(
                name='project',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Название проекта для поиска'
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
            OpenApiParameter(
                name='sort',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Сортировка: created_at, -created_at, full_name, projects_count',
                default='-created_at'
            ),
        ],
        tags=["Персоны"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Расширенный поиск персон по различным параметрам"""
        queryset = self.get_queryset()
        
        # Получаем все параметры поиска
        name = request.query_params.get('name')
        phone = request.query_params.get('phone')
        email = request.query_params.get('email')
        telegram = request.query_params.get('telegram')
        project = request.query_params.get('project')
        
        # Если хотя бы один из параметров поиска есть - строим общий OR запрос
        search_filters = Q()
        has_search = False
        
        if name:
            search_filters |= Q(first_name__icontains=name)
            search_filters |= Q(last_name__icontains=name)
            search_filters |= Q(middle_name__icontains=name)
            has_search = True
        
        if phone:
            # Поиск в массиве телефонов (JSONField)
            search_filters |= Q(phones__icontains=phone)
            # Также поиск в старом поле для обратной совместимости
            search_filters |= Q(phone__icontains=phone)
            has_search = True
        
        if email:
            # Поиск в массиве email (JSONField)
            search_filters |= Q(emails__icontains=email)
            # Также поиск в старом поле для обратной совместимости
            search_filters |= Q(email__icontains=email)
            has_search = True
        
        if telegram:
            # Поиск в массиве Telegram (JSONField)
            search_filters |= Q(telegram_usernames__icontains=telegram)
            # Также поиск в старом поле для обратной совместимости
            search_filters |= Q(telegram_username__icontains=telegram)
            has_search = True
        
        if project:
            search_filters |= Q(casting_projects__title__icontains=project)
            search_filters |= Q(directed_projects__title__icontains=project)
            search_filters |= Q(produced_projects__title__icontains=project)
            has_search = True
        
        # Применяем фильтры если есть поисковый запрос
        if has_search:
            queryset = queryset.filter(search_filters).distinct()
        
        # Всегда фильтруем только активные персоны
        queryset = queryset.filter(is_active=True)
        
        # Фильтр по типу
        person_type = request.query_params.get('person_type')
        if person_type:
            queryset = queryset.filter(person_type=person_type)
        
        # Фильтр по национальности
        nationality = request.query_params.get('nationality')
        if nationality:
            queryset = queryset.filter(nationality__icontains=nationality)
        
        # Сортировка
        sort_by = request.query_params.get('sort', '-created_at')
        if sort_by == 'projects_count':
            queryset = queryset.order_by('projects_count')
        elif sort_by == '-projects_count':
            queryset = queryset.order_by('-projects_count')
        elif sort_by == 'full_name':
            queryset = queryset.order_by('last_name', 'first_name')
        elif sort_by == 'created_at':
            queryset = queryset.order_by('created_at')
        elif sort_by == '-created_at':
            queryset = queryset.order_by('-created_at')
        else:  # по умолчанию сортируем по дате создания
            queryset = queryset.order_by('-created_at')
        
        # Используем пагинацию
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
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
    
    @extend_schema(
        summary="Получить проекты персоны",
        description="Получить список проектов, в которых участвует персона",
        parameters=[
            OpenApiParameter(
                name='limit',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Количество проектов для вывода',
                default=5
            )
        ],
        tags=["Персоны"]
    )
    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        """Получить проекты персоны (последние N)"""
        from projects.serializers import ProjectListSerializer
        
        person = self.get_object()
        limit = int(request.query_params.get('limit', 5))
        
        # Получаем проекты в зависимости от типа персоны
        if person.person_type == 'casting_director':
            projects = person.casting_projects.filter(is_active=True)
        elif person.person_type == 'director':
            projects = person.directed_projects.filter(is_active=True)
        elif person.person_type == 'producer':
            projects = person.produced_projects.filter(is_active=True)
        else:
            projects = person.casting_projects.none()
        
        # Сортируем от новых к старым и ограничиваем количество
        projects = projects.order_by('-created_at')[:limit]
        
        serializer = ProjectListSerializer(projects, many=True)
        return Response(serializer.data)


# Views для массового импорта персон

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from .bulk_import import BulkImportService
from .serializers import ImportSessionSerializer, BulkImportConfirmSerializer
from .models import ImportSession
import os


bulk_import_service = BulkImportService()


@extend_schema(
    summary="Загрузка файла для импорта персон",
    description="Загружает XLSX файл с персонами, парсит его и ищет дубликаты",
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'file': {
                    'type': 'string',
                    'format': 'binary',
                    'description': 'XLSX файл с персонами'
                }
            }
        }
    },
    responses={
        200: ImportSessionSerializer,
        400: {'description': 'Ошибка валидации файла'}
    },
    tags=["Импорт персон"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_upload(request):
    """Загрузка и предварительная обработка файла"""
    if 'file' not in request.FILES:
        return Response(
            {'error': 'Файл не предоставлен'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Валидация файла
    if not file.name.endswith('.xlsx'):
        return Response(
            {'error': 'Неверный формат файла. Требуется XLSX'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Проверка размера (максимум 5MB)
    if file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'Размер файла превышает 5 МБ'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Обработка
    try:
        import_session = bulk_import_service.process_upload(file, request.user)
        serializer = ImportSessionSerializer(import_session)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="Подтверждение и выполнение импорта",
    description="Выполняет импорт персон с учетом решений пользователя по каждой строке",
    request=BulkImportConfirmSerializer,
    responses={
        200: {
            'type': 'object',
            'properties': {
                'status': {'type': 'string'},
                'statistics': {
                    'type': 'object',
                    'properties': {
                        'created': {'type': 'integer'},
                        'updated': {'type': 'integer'},
                        'skipped': {'type': 'integer'},
                        'errors': {'type': 'integer'}
                    }
                },
                'details': {'type': 'array'}
            }
        },
        400: {'description': 'Ошибка валидации данных'},
        404: {'description': 'Сессия импорта не найдена'}
    },
    tags=["Импорт персон"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_confirm(request):
    """Выполнение импорта с учетом решений пользователя"""
    serializer = BulkImportConfirmSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    import_id = serializer.validated_data['import_id']
    decisions = serializer.validated_data['decisions']
    
    # Получить сессию импорта
    try:
        import_session = ImportSession.objects.get(id=import_id, user=request.user)
    except ImportSession.DoesNotExist:
        return Response(
            {'error': 'Сессия импорта не найдена'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Выполнить импорт
    try:
        results = bulk_import_service.execute_import(import_session, decisions)
        return Response(results)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="Скачать шаблон для импорта",
    description="Возвращает XLSX файл-шаблон для заполнения данными персон",
    responses={
        200: {
            'type': 'string',
            'format': 'binary',
            'description': 'XLSX файл шаблона'
        }
    },
    tags=["Импорт персон"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bulk_import_template(request):
    """Скачивание шаблона Excel"""
    from django.conf import settings
    
    template_path = os.path.join(
        settings.BASE_DIR, 
        'people', 
        'templates', 
        'person_import_template.xlsx'
    )
    
    if not os.path.exists(template_path):
        return Response(
            {'error': 'Файл шаблона не найден'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    return FileResponse(
        open(template_path, 'rb'),
        as_attachment=True,
        filename='шаблон_импорта_персон.xlsx',
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )