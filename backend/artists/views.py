from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiTypes

from .models import (
    SkillGroup, Skill, Education, Artist, ArtistSkill, 
    ArtistEducation, ArtistLink, ArtistPhoto
)
from .serializers import (
    SkillGroupSerializer, SkillSerializer, EducationSerializer,
    ArtistSerializer, ArtistListSerializer, ArtistSkillSerializer,
    ArtistEducationSerializer, ArtistLinkSerializer, ArtistPhotoSerializer
)
from core.views import BaseReferenceViewSet, BaseModelViewSet
from core.permissions import OwnerPermission


class SkillGroupViewSet(BaseReferenceViewSet):
    """ViewSet для модели SkillGroup."""
    
    queryset = SkillGroup.objects.all()
    serializer_class = SkillGroupSerializer


class SkillViewSet(BaseReferenceViewSet):
    """ViewSet для модели Skill."""
    
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    
    @action(detail=False, methods=['get'], url_path='by-group/(?P<skill_group_id>[^/.]+)')
    @extend_schema(
        summary="Навыки по группе",
        description="Получить список навыков для конкретной группы навыков.",
        parameters=[
            OpenApiParameter(
                name='skill_group_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='ID группы навыков'
            ),
        ],
        tags=["Навыки"]
    )
    def by_group(self, request, skill_group_id=None):
        """Возвращает список навыков для указанной группы навыков."""
        skills = self.get_queryset().filter(skill_group__id=skill_group_id)
        serializer = self.get_serializer(skills, many=True)
        return Response(serializer.data)


class EducationViewSet(BaseReferenceViewSet):
    """ViewSet для модели Education."""
    
    queryset = Education.objects.all()
    serializer_class = EducationSerializer


class ArtistSkillViewSet(viewsets.ModelViewSet):
    """ViewSet для модели ArtistSkill."""
    
    queryset = ArtistSkill.objects.all()
    serializer_class = ArtistSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    @extend_schema(
        summary="Навыки артиста",
        description="Получить список навыков для конкретного артиста.",
        parameters=[
            OpenApiParameter(
                name='artist_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID артиста'
            ),
        ],
        tags=["Навыки артистов"]
    )
    def by_artist(self, request):
        """Возвращает список навыков для указанного артиста."""
        artist_id = request.query_params.get('artist_id')
        if not artist_id:
            return Response({'error': 'artist_id parameter is required'}, status=400)
        
        skills = self.get_queryset().filter(artist__id=artist_id)
        serializer = self.get_serializer(skills, many=True)
        return Response(serializer.data)


class ArtistEducationViewSet(viewsets.ModelViewSet):
    """ViewSet для модели ArtistEducation."""
    
    queryset = ArtistEducation.objects.all()
    serializer_class = ArtistEducationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    @extend_schema(
        summary="Образование артиста",
        description="Получить список образования для конкретного артиста.",
        parameters=[
            OpenApiParameter(
                name='artist_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID артиста'
            ),
        ],
        tags=["Образование артистов"]
    )
    def by_artist(self, request):
        """Возвращает список образования для указанного артиста."""
        artist_id = request.query_params.get('artist_id')
        if not artist_id:
            return Response({'error': 'artist_id parameter is required'}, status=400)
        
        education = self.get_queryset().filter(artist__id=artist_id)
        serializer = self.get_serializer(education, many=True)
        return Response(serializer.data)


class ArtistLinkViewSet(viewsets.ModelViewSet):
    """ViewSet для модели ArtistLink."""
    
    queryset = ArtistLink.objects.all()
    serializer_class = ArtistLinkSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    @extend_schema(
        summary="Ссылки артиста",
        description="Получить список ссылок для конкретного артиста.",
        parameters=[
            OpenApiParameter(
                name='artist_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID артиста'
            ),
        ],
        tags=["Ссылки артистов"]
    )
    def by_artist(self, request):
        """Возвращает список ссылок для указанного артиста."""
        artist_id = request.query_params.get('artist_id')
        if not artist_id:
            return Response({'error': 'artist_id parameter is required'}, status=400)
        
        links = self.get_queryset().filter(artist__id=artist_id)
        serializer = self.get_serializer(links, many=True)
        return Response(serializer.data)


class ArtistPhotoViewSet(viewsets.ModelViewSet):
    """ViewSet для модели ArtistPhoto."""
    
    queryset = ArtistPhoto.objects.all()
    serializer_class = ArtistPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    @extend_schema(
        summary="Фотографии артиста",
        description="Получить список фотографий для конкретного артиста.",
        parameters=[
            OpenApiParameter(
                name='artist_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='ID артиста'
            ),
        ],
        tags=["Фотографии артистов"]
    )
    def by_artist(self, request):
        """Возвращает список фотографий для указанного артиста."""
        artist_id = request.query_params.get('artist_id')
        if not artist_id:
            return Response({'error': 'artist_id parameter is required'}, status=400)
        
        photos = self.get_queryset().filter(artist__id=artist_id)
        serializer = self.get_serializer(photos, many=True)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="Список артистов",
        description="Получить список всех активных артистов.",
        tags=["Артисты"]
    ),
    create=extend_schema(
        summary="Создать артиста",
        description="Создать нового артиста в системе.",
        tags=["Артисты"]
    ),
    retrieve=extend_schema(
        summary="Получить артиста",
        description="Получить информацию о конкретном артисте.",
        tags=["Артисты"]
    ),
    update=extend_schema(
        summary="Обновить артиста",
        description="Полностью обновить информацию об артисте.",
        tags=["Артисты"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить артиста",
        description="Частично обновить информацию об артисте.",
        tags=["Артисты"]
    ),
    destroy=extend_schema(
        summary="Удалить артиста",
        description="Удалить артиста из системы.",
        tags=["Артисты"]
    ),
    my_items=extend_schema(
        summary="Мои артисты",
        description="Получить список артистов, добавленных текущим агентом.",
        tags=["Артисты"]
    ),
    search=extend_schema(
        summary="Поиск артистов",
        description="Поиск артистов по различным параметрам.",
        parameters=[
            OpenApiParameter(
                name='name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Часть имени артиста для поиска'
            ),
            OpenApiParameter(
                name='gender',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Пол артиста для фильтрации (male, female)'
            ),
            OpenApiParameter(
                name='city',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Город проживания для фильтрации'
            ),
            OpenApiParameter(
                name='availability_status',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Статус доступности для фильтрации'
            ),
            OpenApiParameter(
                name='media_presence',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Медийность для фильтрации'
            ),
            OpenApiParameter(
                name='age_min',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Минимальный возраст для фильтрации'
            ),
            OpenApiParameter(
                name='age_max',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Максимальный возраст для фильтрации'
            ),
        ],
        tags=["Артисты"]
    ),
    by_skills=extend_schema(
        summary="Артисты по навыкам",
        description="Найти артистов, обладающих определенными навыками.",
        parameters=[
            OpenApiParameter(
                name='skill_ids',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Список ID навыков через запятую'
            ),
        ],
        tags=["Артисты"]
    )
)
class ArtistViewSet(BaseModelViewSet):
    """ViewSet для модели Artist."""
    
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    list_serializer_class = ArtistListSerializer
    permission_classes = [permissions.IsAuthenticated, OwnerPermission]
    
    def get_queryset(self):
        """Возвращает только артистов, созданных текущим пользователем."""
        queryset = super().get_queryset()
        # Фильтруем только по артистам, созданным текущим пользователем
        queryset = queryset.filter(created_by=self.request.user)
        return queryset.prefetch_related(
            'skills__skill__skill_group',
            'education__education',
            'links',
            'photos'
        )
    
    def get_serializer_class(self):
        """Возвращает соответствующий сериализатор в зависимости от действия."""
        if self.action == 'list':
            return ArtistListSerializer
        return ArtistSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск артистов по различным параметрам."""
        queryset = self.get_queryset()
        
        name = request.query_params.get('name', None)
        gender = request.query_params.get('gender', None)
        city = request.query_params.get('city', None)
        availability_status = request.query_params.get('availability_status', None)
        media_presence = request.query_params.get('media_presence', None)
        age_min = request.query_params.get('age_min', None)
        age_max = request.query_params.get('age_max', None)
        
        if name:
            queryset = queryset.filter(
                Q(first_name__icontains=name) |
                Q(last_name__icontains=name) |
                Q(stage_name__icontains=name)
            )
        if gender:
            queryset = queryset.filter(gender=gender)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if availability_status is not None:
            queryset = queryset.filter(availability_status=availability_status.lower() == 'true')
        if media_presence is not None:
            queryset = queryset.filter(media_presence=media_presence.lower() == 'true')
        if age_min:
            queryset = queryset.filter(age__gte=age_min)
        if age_max:
            queryset = queryset.filter(age__lte=age_max)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_skills(self, request):
        """Найти артистов, обладающих определенными навыками."""
        skill_ids = request.query_params.get('skill_ids', None)
        if not skill_ids:
            return Response({'error': 'skill_ids parameter is required'}, status=400)
        
        try:
            skill_ids_list = [int(sid.strip()) for sid in skill_ids.split(',')]
        except ValueError:
            return Response({'error': 'Invalid skill_ids format'}, status=400)
        
        # Получаем артистов, которые обладают всеми указанными навыками
        artists = self.get_queryset().filter(
            skills__skill__id__in=skill_ids_list
        ).distinct()
        
        # Дополнительная фильтрация: артист должен обладать всеми указанными навыками
        filtered_artists = []
        for artist in artists:
            artist_skill_ids = set(artist.skills.values_list('skill__id', flat=True))
            if all(skill_id in artist_skill_ids for skill_id in skill_ids_list):
                filtered_artists.append(artist)
        
        serializer = self.get_serializer(filtered_artists, many=True)
        return Response(serializer.data)