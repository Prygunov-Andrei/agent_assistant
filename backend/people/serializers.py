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
            'nationality',
            'is_active',
            'created_by',
            'created_at',
        ]
        read_only_fields = fields
