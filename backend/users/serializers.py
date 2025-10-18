from rest_framework import serializers
from .models import Agent


class AgentSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Agent"""
    
    full_name = serializers.ReadOnlyField(
        help_text="Полное имя агента (имя + фамилия)"
    )
    
    class Meta:
        model = Agent
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'photo',
            'phone',
            'bio',
            'birth_date',
            'telegram_username',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'is_staff',
            'is_superuser',
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'username': {
                'help_text': 'Уникальное имя пользователя для входа в систему'
            },
            'email': {
                'help_text': 'Электронная почта агента'
            },
            'photo': {
                'help_text': 'Фотография агента'
            },
            'phone': {
                'help_text': 'Номер телефона агента'
            },
            'bio': {
                'help_text': 'Краткая биография агента'
            },
            'birth_date': {
                'help_text': 'Дата рождения агента'
            },
            'telegram_username': {
                'help_text': 'Имя пользователя в Telegram'
            },
            'is_active': {
                'help_text': 'Активен ли агент в системе'
            }
        }


class AgentListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка агентов"""
    
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Agent
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'photo',
            'is_active',
            'created_at',
        ]
