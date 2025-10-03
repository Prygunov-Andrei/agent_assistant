from rest_framework import serializers
from .models import ProjectType, Genre, RoleType, Project, ProjectRole
from core.serializers import BaseReferenceSerializer, BaseModelSerializer, BaseListSerializer
from artists.models import Artist


class ProjectTypeSerializer(BaseReferenceSerializer):
    """
    Сериализатор для типа проекта.
    
    Наследует от BaseReferenceSerializer все стандартные поля справочника.
    """
    
    class Meta(BaseReferenceSerializer.Meta):
        model = ProjectType


class GenreSerializer(BaseReferenceSerializer):
    """
    Сериализатор для жанра.
    
    Наследует от BaseReferenceSerializer все стандартные поля справочника.
    """
    
    class Meta(BaseReferenceSerializer.Meta):
        model = Genre


class RoleTypeSerializer(BaseReferenceSerializer):
    """
    Сериализатор для типа роли.
    
    Наследует от BaseReferenceSerializer все стандартные поля справочника.
    """
    
    class Meta(BaseReferenceSerializer.Meta):
        model = RoleType


class ProjectRoleSerializer(BaseModelSerializer):
    """
    Сериализатор для роли в проекте.
    
    Наследует от BaseModelSerializer базовые поля и добавляет специфичные для роли.
    """
    
    project_title = serializers.ReadOnlyField(
        source='project.title', 
        help_text="Название проекта"
    )
    
    suggested_artists = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Artist.objects.none(),  # Будет установлен в __init__
        required=False,
        help_text="ID артистов, предложенных для роли"
    )
    
    skills_required = serializers.JSONField(
        required=False,
        help_text="Требуемые навыки (JSON массив)"
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Устанавливаем queryset для suggested_artists
        if 'suggested_artists' in self.fields:
            from artists.models import Artist
            self.fields['suggested_artists'].queryset = Artist.objects.filter(is_active=True)
    
    class Meta(BaseModelSerializer.Meta):
        model = ProjectRole
        fields = BaseModelSerializer.Meta.fields + [
            'project',
            'project_title',
            'name',
            'role_type',
            'description',
            'media_presence',
            'clothing_size',
            'hairstyle',
            'hair_color',
            'eye_color',
            'height',
            'body_type',
            'reference_photo',
            'reference_text',
            'special_conditions',
            'audition_requirements',
            'audition_text',
            'audition_files',
            'rate_per_shift',
            'rate_conditions',
            'shooting_dates',
            'shooting_location',
            'notes',
            'suggested_artists',
            'skills_required'
        ]
        extra_kwargs = {
            **BaseModelSerializer.Meta.extra_kwargs,
            'project': {'help_text': 'ID проекта, к которому относится роль'},
            'name': {'help_text': 'Название роли'},
            'role_type': {'help_text': 'ID типа роли'},
            'description': {'help_text': 'Описание роли'},
            'media_presence': {'help_text': 'Медийность (да/нет/неважно)'},
            'clothing_size': {'help_text': 'Размер одежды'},
            'hairstyle': {'help_text': 'Прическа'},
            'hair_color': {'help_text': 'Цвет волос'},
            'eye_color': {'help_text': 'Цвет глаз'},
            'height': {'help_text': 'Рост'},
            'body_type': {'help_text': 'Телосложение'},
            'reference_photo': {'help_text': 'Фото референс'},
            'reference_text': {'help_text': 'Текстовый референс'},
            'special_conditions': {'help_text': 'Особые условия'},
            'audition_requirements': {'help_text': 'Требования к пробам'},
            'audition_text': {'help_text': 'Текст проб текстом'},
            'audition_files': {'help_text': 'Файлы проб'},
            'rate_per_shift': {'help_text': 'Ставка за смену'},
            'rate_conditions': {'help_text': 'Условия по ставке'},
            'shooting_dates': {'help_text': 'Даты смен'},
            'shooting_location': {'help_text': 'Место съемки'},
            'notes': {'help_text': 'Заметки'},
            'suggested_artists': {'help_text': 'ID артистов, предложенных для роли'},
            'skills_required': {'help_text': 'Требуемые навыки (JSON массив)'}
        }


class ProjectRoleListSerializer(BaseListSerializer):
    """
    Упрощенный сериализатор для списка ролей в проектах.
    
    Наследует от BaseListSerializer и добавляет специфичные поля для ролей.
    """
    
    project_title = serializers.ReadOnlyField(
        source='project.title',
        help_text="Название проекта"
    )
    role_type_name = serializers.ReadOnlyField(
        source='role_type.name',
        help_text="Название типа роли"
    )
    suggested_artists_count = serializers.SerializerMethodField(
        help_text="Количество предложенных артистов"
    )
    
    class Meta(BaseListSerializer.Meta):
        model = ProjectRole
        fields = BaseListSerializer.Meta.fields + [
            'project',
            'project_title',
            'name',
            'role_type',
            'role_type_name',
            'media_presence',
            'suggested_artists_count'
        ]
    
    def get_suggested_artists_count(self, obj):
        """Возвращает количество предложенных артистов для роли"""
        return obj.suggested_artists.count()


class ProjectSerializer(BaseModelSerializer):
    """
    Сериализатор для проекта.
    
    Наследует от BaseModelSerializer базовые поля и добавляет специфичные для проекта.
    """
    
    director_name = serializers.ReadOnlyField(
        source='director.full_name',
        help_text="Полное имя режиссера"
    )
    
    production_company_name = serializers.ReadOnlyField(
        source='production_company.name',
        help_text="Название продюсерской компании"
    )
    
    project_type_name = serializers.ReadOnlyField(
        source='project_type.name',
        help_text="Название типа проекта"
    )
    
    genre_name = serializers.ReadOnlyField(
        source='genre.name',
        help_text="Название жанра"
    )
    
    producers_names = serializers.StringRelatedField(
        source='producers',
        many=True,
        read_only=True,
        help_text="Список имен продюсеров"
    )
    
    roles = ProjectRoleListSerializer(many=True, read_only=True)
    
    # Поле для создания проекта из запроса
    request_id = serializers.IntegerField(
        write_only=True,
        required=False,
        help_text="ID запроса для создания проекта из LLM анализа"
    )
    
    def validate_request_id(self, value):
        """Валидация request_id"""
        if value is not None:
            try:
                from telegram_requests.models import Request
                Request.objects.get(id=value)
            except Request.DoesNotExist:
                raise serializers.ValidationError(f"Запрос с ID {value} не найден")
        return value
    
    class Meta(BaseModelSerializer.Meta):
        model = Project
        fields = BaseModelSerializer.Meta.fields + [
            'title',
            'project_type',
            'project_type_name',
            'status',
            'description',
            'genre',
            'genre_name',
            'premiere_date',
            'director',
            'director_name',
            'producers',
            'producers_names',
            'production_company',
            'production_company_name',
            'request',
            'request_id',
            'project_type_raw',
            'roles'
        ]
        extra_kwargs = {
            **BaseModelSerializer.Meta.extra_kwargs,
            'title': {'help_text': 'Название проекта'},
            'project_type': {'help_text': 'ID типа проекта'},
            'status': {'help_text': 'Статус проекта (in_production, cancelled, completed)'},
            'description': {'help_text': 'Описание проекта'},
            'genre': {'help_text': 'ID жанра проекта'},
            'premiere_date': {'help_text': 'Дата премьеры'},
            'director': {'help_text': 'ID режиссера проекта'},
            'producers': {'help_text': 'Список ID продюсеров проекта'},
            'production_company': {'help_text': 'ID кинокомпании проекта'},
            'request': {'help_text': 'ID исходного запроса (только для чтения)'},
            'project_type_raw': {'help_text': 'Сырой тип проекта от LLM'}
        }


class ProjectListSerializer(BaseListSerializer):
    """
    Упрощенный сериализатор для списка проектов.
    
    Наследует от BaseListSerializer и добавляет специфичные поля для проектов.
    """
    
    director_name = serializers.ReadOnlyField(
        source='director.full_name',
        help_text="Полное имя режиссера"
    )
    
    production_company_name = serializers.ReadOnlyField(
        source='production_company.name',
        help_text="Название продюсерской компании"
    )
    
    project_type_name = serializers.ReadOnlyField(
        source='project_type.name',
        help_text="Название типа проекта"
    )
    
    genre_name = serializers.ReadOnlyField(
        source='genre.name',
        help_text="Название жанра"
    )
    
    roles_count = serializers.SerializerMethodField(
        help_text="Количество ролей в проекте"
    )
    
    class Meta(BaseListSerializer.Meta):
        model = Project
        fields = BaseListSerializer.Meta.fields + [
            'title',
            'project_type',
            'project_type_name',
            'status',
            'genre',
            'genre_name',
            'director',
            'director_name',
            'production_company',
            'production_company_name',
            'roles_count'
        ]
    
    def get_roles_count(self, obj):
        """
        Возвращает количество активных ролей в проекте.
        
        Args:
            obj: объект проекта
            
        Returns:
            int: количество активных ролей
        """
        return obj.roles.filter(is_active=True).count()


class ProjectMatchSerializer(serializers.Serializer):
    """Сериализатор для результатов поиска совпадений проектов"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    project_type = serializers.CharField(allow_null=True)
    status = serializers.CharField(allow_null=True)
    status_display = serializers.CharField(allow_null=True)
    description = serializers.CharField(allow_null=True)
    genre = serializers.CharField(allow_null=True)
    premiere_date = serializers.CharField(allow_null=True)
    director = serializers.DictField(allow_null=True)
    production_company = serializers.DictField(allow_null=True)
    created_at = serializers.CharField()
    score = serializers.FloatField(help_text="Оценка схожести (0-1)")
    confidence = serializers.CharField(help_text="Уровень уверенности (high/medium/low)")
    matched_fields = serializers.ListField(
        child=serializers.CharField(),
        help_text="Поля, по которым найдено совпадение"
    )
    field_scores = serializers.DictField(
        help_text="Оценки схожести по каждому полю"
    )


class ProjectSearchRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса поиска совпадений проектов"""
    title = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        help_text="Название проекта для поиска"
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Описание проекта для поиска"
    )
    limit = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Максимальное количество результатов"
    )
    
    def validate(self, data):
        search_fields = ['title', 'description']
        if not any(data.get(field) for field in search_fields):
            raise serializers.ValidationError("Необходимо указать хотя бы один критерий поиска")
        return data


class ProjectNameSearchRequestSerializer(serializers.Serializer):
    """Сериализатор для поиска проектов по названию"""
    title = serializers.CharField(
        max_length=255,
        help_text="Название проекта для поиска"
    )
    limit = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Максимальное количество результатов"
    )


class ProjectStatusSerializer(serializers.Serializer):
    """Сериализатор для статусов проектов"""
    value = serializers.CharField(help_text="Значение статуса проекта")
    label = serializers.CharField(help_text="Отображаемое название статуса проекта")