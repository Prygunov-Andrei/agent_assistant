from rest_framework import serializers
from .models import ProjectType, Genre, RoleType, ShoeSize, Nationality, Project, ProjectRole
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


class ShoeSizeSerializer(BaseReferenceSerializer):
    """
    Сериализатор для размера обуви.
    
    Наследует от BaseReferenceSerializer все стандартные поля справочника.
    """
    
    class Meta(BaseReferenceSerializer.Meta):
        model = ShoeSize


class NationalitySerializer(BaseReferenceSerializer):
    """
    Сериализатор для национальности.
    
    Наследует от BaseReferenceSerializer все стандартные поля справочника.
    """
    
    class Meta(BaseReferenceSerializer.Meta):
        model = Nationality


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
        allow_null=True,
        help_text="Требуемые навыки (JSON массив)"
    )
    
    # Явно переопределяем IntegerField для поддержки null
    age_min = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        max_value=100,
        help_text="Минимальный возраст для роли"
    )
    
    age_max = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
        max_value=100,
        help_text="Максимальный возраст для роли"
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
            'gender',
            'age_min',
            'age_max',
            'media_presence',
            'clothing_size',
            'hairstyle',
            'hair_color',
            'eye_color',
            'height',
            'body_type',
            'shoe_size',
            'nationality',
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
            'role_type': {'help_text': 'ID типа роли', 'required': False, 'allow_null': True},
            'description': {'help_text': 'Описание роли'},
            'gender': {'required': False, 'allow_null': True},
            'age_min': {'required': False, 'allow_null': True, 'help_text': 'Минимальный возраст'},
            'age_max': {'required': False, 'allow_null': True, 'help_text': 'Максимальный возраст'},
            'media_presence': {'help_text': 'Медийность (да/нет/неважно)', 'required': False, 'allow_null': True},
            'clothing_size': {'help_text': 'Размер одежды', 'required': False, 'allow_null': True},
            'hairstyle': {'help_text': 'Прическа', 'required': False, 'allow_null': True},
            'hair_color': {'help_text': 'Цвет волос', 'required': False, 'allow_null': True},
            'eye_color': {'help_text': 'Цвет глаз', 'required': False, 'allow_null': True},
            'height': {'help_text': 'Рост', 'required': False, 'allow_null': True},
            'body_type': {'help_text': 'Телосложение', 'required': False, 'allow_null': True},
            'shoe_size': {'required': False, 'allow_null': True},
            'nationality': {'required': False, 'allow_null': True},
            'reference_photo': {'help_text': 'Фото референс', 'required': False, 'allow_null': True},
            'reference_text': {'help_text': 'Текстовый референс', 'required': False, 'allow_null': True},
            'special_conditions': {'help_text': 'Особые условия', 'required': False, 'allow_null': True},
            'audition_requirements': {'help_text': 'Требования к пробам', 'required': False, 'allow_null': True},
            'audition_text': {'help_text': 'Текст проб текстом', 'required': False, 'allow_null': True},
            'audition_files': {'help_text': 'Файлы проб', 'required': False, 'allow_null': True},
            'rate_per_shift': {'help_text': 'Ставка за смену', 'required': False, 'allow_null': True},
            'rate_conditions': {'help_text': 'Условия по ставке', 'required': False, 'allow_null': True},
            'shooting_dates': {'help_text': 'Даты смен', 'required': False, 'allow_null': True},
            'shooting_location': {'help_text': 'Место съемки', 'required': False, 'allow_null': True},
            'notes': {'help_text': 'Заметки', 'required': False, 'allow_null': True},
            'suggested_artists': {'help_text': 'ID артистов, предложенных для роли', 'required': False},
            'skills_required': {'help_text': 'Требуемые навыки (JSON массив)', 'required': False, 'allow_null': True}
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
    
    casting_director_name = serializers.ReadOnlyField(
        source='casting_director.full_name',
        help_text="Полное имя кастинг-директора"
    )
    
    director_name = serializers.ReadOnlyField(
        source='director.full_name',
        help_text="Полное имя режиссера"
    )
    
    created_by_id = serializers.ReadOnlyField(
        source='created_by.id',
        help_text="ID пользователя, создавшего проект"
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
    
    request_text = serializers.ReadOnlyField(
        source='request.text',
        help_text="Текст запроса"
    )
    
    request_author = serializers.ReadOnlyField(
        source='request.author_username',
        help_text="Автор запроса"
    )
    
    request_created_at = serializers.ReadOnlyField(
        source='request.created_at',
        help_text="Дата создания запроса"
    )
    
    request_images = serializers.SerializerMethodField(
        help_text="Изображения запроса"
    )
    
    request_files = serializers.SerializerMethodField(
        help_text="Файлы запроса"
    )
    
    def get_request_images(self, obj):
        """Возвращает изображения запроса"""
        if not obj.request:
            return []
        from telegram_requests.serializers import RequestImageSerializer
        images = obj.request.images.all()
        return RequestImageSerializer(images, many=True).data
    
    def get_request_files(self, obj):
        """Возвращает файлы запроса"""
        if not obj.request:
            return []
        from telegram_requests.serializers import RequestFileSerializer
        files = obj.request.files.all()
        return RequestFileSerializer(files, many=True).data
    
    # Используем ProjectRoleSerializer для полных данных ролей
    # (Не ProjectRoleListSerializer чтобы получить ВСЕ поля роли)
    roles = serializers.SerializerMethodField()
    
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
    
    def get_roles(self, obj):
        """Возвращает полные данные ролей через ProjectRoleSerializer"""
        roles = obj.roles.filter(is_active=True).order_by('id')
        return ProjectRoleSerializer(roles, many=True).data
    
    def update(self, instance, validated_data):
        """
        Обновление проекта.
        Если обновляется поле request, автоматически отвязываем его от старого проекта.
        """
        request_obj = validated_data.get('request')
        
        # Если обновляется request и он уже связан с другим проектом
        if request_obj and request_obj != instance.request:
            # Находим старый проект с этим request и отвязываем
            old_project = Project.objects.filter(request=request_obj).exclude(id=instance.id).first()
            if old_project:
                old_project.request = None
                old_project.save(update_fields=['request'])
        
        return super().update(instance, validated_data)
    
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
            'casting_director',
            'casting_director_name',
            'director',
            'director_name',
            'producers',
            'producers_names',
            'production_company',
            'production_company_name',
            'created_by_id',
            'request',
            'request_text',
            'request_author',
            'request_created_at',
            'request_images',
            'request_files',
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
            'casting_director': {'help_text': 'ID кастинг-директора проекта'},
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
    Возвращает expanded объекты для удобного отображения на frontend.
    """
    
    # Expanded поля - возвращаем объекты вместо ID
    project_type = serializers.SerializerMethodField(
        help_text="Тип проекта (expanded объект)"
    )
    
    genre = serializers.SerializerMethodField(
        help_text="Жанр (expanded объект)"
    )
    
    casting_director = serializers.SerializerMethodField(
        help_text="Кастинг-директор (expanded объект)"
    )
    
    director = serializers.SerializerMethodField(
        help_text="Режиссер (expanded объект)"
    )
    
    production_company = serializers.SerializerMethodField(
        help_text="Кинокомпания (expanded объект)"
    )
    
    roles = serializers.SerializerMethodField(
        help_text="Роли проекта (expanded объекты)"
    )
    
    def get_project_type(self, obj):
        """Возвращает expanded объект типа проекта"""
        if obj.project_type:
            return {
                'id': obj.project_type.id,
                'name': obj.project_type.name
            }
        return None
    
    def get_genre(self, obj):
        """Возвращает expanded объект жанра"""
        if obj.genre:
            return {
                'id': obj.genre.id,
                'name': obj.genre.name
            }
        return None
    
    def get_casting_director(self, obj):
        """Возвращает expanded объект кастинг-директора"""
        if obj.casting_director:
            return {
                'id': obj.casting_director.id,
                'name': obj.casting_director.full_name
            }
        return None
    
    def get_director(self, obj):
        """Возвращает expanded объект режиссера"""
        if obj.director:
            return {
                'id': obj.director.id,
                'name': obj.director.full_name
            }
        return None
    
    def get_production_company(self, obj):
        """Возвращает expanded объект кинокомпании"""
        if obj.production_company:
            return {
                'id': obj.production_company.id,
                'name': obj.production_company.name
            }
        return None
    
    def get_roles(self, obj):
        """Возвращает список expanded объектов ролей"""
        roles = obj.roles.filter(is_active=True).order_by('id')
        return [
            {
                'id': role.id,
                'name': role.name,
                'description': role.description
            }
            for role in roles
        ]
    
    class Meta(BaseListSerializer.Meta):
        model = Project
        fields = BaseListSerializer.Meta.fields + [
            'title',
            'project_type',
            'status',
            'genre',
            'casting_director',
            'director',
            'production_company',
            'roles'
        ]


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