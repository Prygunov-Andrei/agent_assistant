from rest_framework import serializers
from .models import Person


class PersonSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Person"""
    
    created_by = serializers.ReadOnlyField(
        source='created_by.username',
        help_text="Имя пользователя, создавшего персону"
    )
    
    full_name = serializers.ReadOnlyField(
        help_text="Полное имя персоны (фамилия + имя + отчество)"
    )
    
    short_name = serializers.ReadOnlyField(
        help_text="Краткое имя персоны (Фамилия И.О.)"
    )
    
    projects_count = serializers.IntegerField(
        read_only=True,
        help_text="Количество проектов персоны"
    )
    
    recent_projects = serializers.SerializerMethodField(
        help_text="Последние 5 проектов персоны"
    )
    
    def get_recent_projects(self, obj):
        """Получить последние 5 проектов персоны"""
        # Получаем проекты в зависимости от типа персоны
        if obj.person_type == 'casting_director':
            projects = obj.casting_projects.filter(is_active=True)
        elif obj.person_type == 'director':
            projects = obj.directed_projects.filter(is_active=True)
        elif obj.person_type == 'producer':
            projects = obj.produced_projects.filter(is_active=True)
        else:
            return []
        
        # Сортируем от новых к старым и ограничиваем количество
        projects = projects.order_by('-created_at')[:5]
        
        return [
            {
                'id': p.id,
                'title': p.title,
                'created_at': p.created_at.isoformat() if p.created_at else None
            }
            for p in projects
        ]
    
    class Meta:
        model = Person
        fields = [
            'id',
            'person_type',
            'first_name',
            'last_name',
            'middle_name',
            'full_name',
            'short_name',
            'photo',
            'bio',
            'birth_date',
            'nationality',
            'phone',
            'email',
            'website',
            'telegram_username',
            'kinopoisk_url',
            'social_media',
            'awards',
            'is_active',
            'created_by',
            'created_at',
            'updated_at',
            'projects_count',
            'recent_projects',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'person_type': {
                'help_text': 'Тип персоны (director - режиссер, producer - продюсер)'
            },
            'first_name': {
                'help_text': 'Имя персоны'
            },
            'last_name': {
                'help_text': 'Фамилия персоны'
            },
            'middle_name': {
                'help_text': 'Отчество персоны (необязательное)'
            },
            'photo': {
                'help_text': 'Фотография персоны'
            },
            'bio': {
                'help_text': 'Биография персоны'
            },
            'birth_date': {
                'help_text': 'Дата рождения персоны'
            },
            'nationality': {
                'help_text': 'Национальность персоны'
            },
            'phone': {
                'help_text': 'Номер телефона персоны'
            },
            'email': {
                'help_text': 'Email персоны'
            },
            'website': {
                'help_text': 'Личный сайт персоны'
            },
            'telegram_username': {
                'help_text': 'Имя пользователя в Telegram'
            },
            'kinopoisk_url': {
                'help_text': 'Ссылка на страницу в Кинотеатре'
            },
            'social_media': {
                'help_text': 'Социальные сети в формате JSON'
            },
            'awards': {
                'help_text': 'Награды и достижения персоны'
            },
            'is_active': {
                'help_text': 'Активна ли персона в системе'
            }
        }


class PersonListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка персон"""
    
    created_by = serializers.ReadOnlyField(
        source='created_by.username',
        help_text="Имя пользователя, создавшего персону"
    )
    
    full_name = serializers.ReadOnlyField(
        help_text="Полное имя персоны (фамилия + имя + отчество)"
    )
    
    short_name = serializers.ReadOnlyField(
        help_text="Краткое имя персоны (Фамилия И.О.)"
    )
    
    projects_count = serializers.IntegerField(
        read_only=True,
        help_text="Количество проектов персоны"
    )
    
    recent_projects = serializers.SerializerMethodField(
        help_text="Последние 5 проектов персоны"
    )
    
    def get_recent_projects(self, obj):
        """Получить последние 5 проектов персоны"""
        # Получаем проекты в зависимости от типа персоны
        if obj.person_type == 'casting_director':
            projects = obj.casting_projects.filter(is_active=True)
        elif obj.person_type == 'director':
            projects = obj.directed_projects.filter(is_active=True)
        elif obj.person_type == 'producer':
            projects = obj.produced_projects.filter(is_active=True)
        else:
            return []
        
        # Сортируем от новых к старым и ограничиваем количество
        projects = projects.order_by('-created_at')[:5]
        
        return [
            {
                'id': p.id,
                'title': p.title,
                'created_at': p.created_at.isoformat() if p.created_at else None
            }
            for p in projects
        ]
    
    class Meta:
        model = Person
        fields = [
            'id',
            'person_type',
            'first_name',
            'last_name',
            'full_name',
            'short_name',
            'photo',
            'phone',
            'email',
            'telegram_username',
            'nationality',
            'is_active',
            'created_by',
            'created_at',
            'projects_count',
            'recent_projects',
        ]
        read_only_fields = fields


class PersonMatchSerializer(serializers.Serializer):
    """Сериализатор для результата поиска совпадений персон"""
    
    id = serializers.IntegerField()
    person_type = serializers.CharField()
    person_type_display = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    middle_name = serializers.CharField(allow_null=True)
    full_name = serializers.CharField()
    short_name = serializers.CharField()
    photo = serializers.URLField(allow_null=True)
    email = serializers.EmailField(allow_null=True)
    phone = serializers.CharField(allow_null=True)
    telegram_username = serializers.CharField(allow_null=True)
    score = serializers.FloatField(help_text="Оценка схожести (0-1)")
    confidence = serializers.CharField(help_text="Уровень уверенности (high/medium/low)")


class PersonSearchRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса поиска совпадений персон"""
    
    email = serializers.EmailField(required=False, allow_blank=True, help_text="Email для поиска")
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20, help_text="Телефон для поиска")
    telegram_username = serializers.CharField(required=False, allow_blank=True, max_length=50, help_text="Telegram username для поиска")
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=100, help_text="Имя для поиска")
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=100, help_text="Фамилия для поиска")
    person_type = serializers.ChoiceField(
        choices=Person.PERSON_TYPES,
        required=False,
        allow_blank=True,
        help_text="Тип персоны для фильтрации"
    )
    limit = serializers.IntegerField(default=5, min_value=1, max_value=20, help_text="Максимальное количество результатов")
    
    def validate(self, data):
        """Проверяем, что указан хотя бы один критерий поиска"""
        search_fields = ['email', 'phone', 'telegram_username', 'first_name', 'last_name']
        if not any(data.get(field) for field in search_fields):
            raise serializers.ValidationError("Необходимо указать хотя бы один критерий поиска")
        return data


class PersonNameSearchRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса поиска персон по имени"""
    
    name = serializers.CharField(max_length=200, help_text="Имя для поиска")
    person_type = serializers.ChoiceField(
        choices=Person.PERSON_TYPES,
        required=False,
        allow_blank=True,
        help_text="Тип персоны для фильтрации"
    )
    limit = serializers.IntegerField(default=5, min_value=1, max_value=20, help_text="Максимальное количество результатов")


class PersonTypeSerializer(serializers.Serializer):
    """Сериализатор для типов персон"""
    
    value = serializers.CharField(help_text="Значение типа персоны")
    label = serializers.CharField(help_text="Отображаемое название типа персоны")
