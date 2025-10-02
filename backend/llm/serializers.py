"""
Сериализаторы для LLM запросов и ответов
"""

from rest_framework import serializers
from typing import Dict, Any, List, Optional
from .validators import validate_llm_response


class LLMAnalysisRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса анализа через LLM"""
    
    request_id = serializers.IntegerField(help_text="ID запроса для анализа")
    use_emulator = serializers.BooleanField(
        default=True, 
        help_text="Использовать ли эмулятор вместо реального LLM"
    )
    
    def validate_request_id(self, value):
        """Валидация ID запроса"""
        if value <= 0:
            raise serializers.ValidationError("ID запроса должен быть положительным числом")
        return value


class ProjectRoleSerializer(serializers.Serializer):
    """Сериализатор для роли в проекте"""
    
    role_type = serializers.CharField(max_length=100, help_text="Тип роли")
    character_name = serializers.CharField(max_length=200, help_text="Имя персонажа")
    description = serializers.CharField(help_text="Описание роли")
    age_range = serializers.CharField(max_length=20, help_text="Возрастной диапазон")
    gender = serializers.ChoiceField(
        choices=[('male', 'Мужской'), ('female', 'Женский'), ('any', 'Любой')],
        help_text="Пол персонажа"
    )
    suggested_artists = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Предложенные артисты (ID)"
    )
    skills_required = serializers.DictField(
        help_text="Требуемые навыки"
    )


class ContactSerializer(serializers.Serializer):
    """Сериализатор для контактной информации"""
    
    name = serializers.CharField(max_length=200, help_text="Имя контакта")
    email = serializers.CharField(max_length=200, required=False, help_text="Email")
    phone = serializers.CharField(max_length=20, required=False, help_text="Телефон")
    telegram = serializers.CharField(max_length=100, required=False, help_text="Telegram")
    confidence = serializers.FloatField(min_value=0.0, max_value=1.0, required=False, help_text="Уверенность в данных")


class ProjectAnalysisSerializer(serializers.Serializer):
    """Сериализатор для анализа проекта"""
    
    project_title = serializers.CharField(max_length=200, help_text="Название проекта")
    project_type = serializers.CharField(max_length=100, help_text="Тип проекта")
    project_type_raw = serializers.CharField(max_length=100, help_text="Исходный тип проекта")
    genre = serializers.CharField(max_length=100, help_text="Жанр")
    description = serializers.CharField(help_text="Описание проекта")
    premiere_date = serializers.CharField(max_length=50, help_text="Дата премьеры")
    roles = ProjectRoleSerializer(many=True, help_text="Роли в проекте")
    casting_director = ContactSerializer(help_text="Кастинг-директор")
    director = ContactSerializer(help_text="Режиссер")
    producer = ContactSerializer(help_text="Продюсер")


class LLMAnalysisResponseSerializer(serializers.Serializer):
    """Сериализатор для ответа анализа LLM"""
    
    project_analysis = ProjectAnalysisSerializer(help_text="Анализ проекта")
    confidence = serializers.FloatField(
        min_value=0.0, 
        max_value=1.0, 
        help_text="Общая уверенность в анализе"
    )
    processing_time = serializers.FloatField(help_text="Время обработки в секундах")
    used_emulator = serializers.BooleanField(help_text="Использовался ли эмулятор")
    errors = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Ошибки при обработке"
    )
    
    def validate(self, data):
        """Валидация всего ответа"""
        # Используем наш валидатор из validators.py
        try:
            validate_llm_response(data)
        except Exception as e:
            raise serializers.ValidationError(f"Ошибка валидации LLM ответа: {str(e)}")
        
        return data


class ArtistForLLMSerializer(serializers.Serializer):
    """Сериализатор для артиста в контексте LLM"""
    
    id = serializers.IntegerField(help_text="ID артиста")
    name = serializers.CharField(max_length=200, help_text="Имя артиста")
    age = serializers.IntegerField(help_text="Возраст")
    gender = serializers.ChoiceField(
        choices=[('male', 'Мужской'), ('female', 'Женский')],
        help_text="Пол"
    )
    height = serializers.IntegerField(help_text="Рост в см")
    weight = serializers.IntegerField(help_text="Вес в кг")
    clothing_size = serializers.CharField(max_length=10, help_text="Размер одежды")
    shoe_size = serializers.CharField(max_length=10, help_text="Размер обуви")
    hair_color = serializers.CharField(max_length=50, help_text="Цвет волос")
    eye_color = serializers.CharField(max_length=50, help_text="Цвет глаз")
    skills = serializers.ListField(
        child=serializers.CharField(),
        help_text="Навыки артиста"
    )
    languages = serializers.ListField(
        child=serializers.CharField(),
        help_text="Языки"
    )
    special_requirements = serializers.ListField(
        child=serializers.CharField(),
        help_text="Особые требования"
    )


class LLMStatusSerializer(serializers.Serializer):
    """Сериализатор для статуса LLM"""
    
    status = serializers.ChoiceField(
        choices=[
            ('idle', 'Ожидание'),
            ('processing', 'Обработка'),
            ('completed', 'Завершено'),
            ('error', 'Ошибка')
        ],
        help_text="Статус LLM"
    )
    last_request_time = serializers.DateTimeField(help_text="Время последнего запроса")
    total_requests = serializers.IntegerField(help_text="Общее количество запросов")
    successful_requests = serializers.IntegerField(help_text="Успешные запросы")
    failed_requests = serializers.IntegerField(help_text="Неудачные запросы")
    emulator_enabled = serializers.BooleanField(help_text="Эмулятор включен")
    current_model = serializers.CharField(help_text="Текущая модель")


class LLMErrorSerializer(serializers.Serializer):
    """Сериализатор для ошибок LLM"""
    
    error_type = serializers.CharField(help_text="Тип ошибки")
    error_message = serializers.CharField(help_text="Сообщение об ошибке")
    request_id = serializers.IntegerField(help_text="ID запроса")
    timestamp = serializers.DateTimeField(help_text="Время ошибки")
    retry_count = serializers.IntegerField(help_text="Количество попыток")
    fallback_used = serializers.BooleanField(help_text="Использован fallback")
