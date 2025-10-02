"""
Миксины для устранения дублирования кода в сериализаторах и представлениях
"""

from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class TimestampMixin:
    """Миксин для добавления временных меток в сериализаторы"""
    
    created_at = serializers.DateTimeField(read_only=True, help_text="Дата создания")
    updated_at = serializers.DateTimeField(read_only=True, help_text="Дата обновления")


class CreatorMixin:
    """Миксин для добавления информации о создателе"""
    
    created_by = serializers.ReadOnlyField(
        source='created_by.username',
        help_text="Имя пользователя, создавшего объект"
    )


class ActivityMixin:
    """Миксин для добавления флага активности"""
    
    is_active = serializers.BooleanField(
        help_text="Активен ли объект в системе"
    )


class BaseSerializerMixin(TimestampMixin, CreatorMixin, ActivityMixin):
    """Базовый миксин, объединяющий все общие поля"""
    pass


class ErrorHandlingMixin:
    """Миксин для унифицированной обработки ошибок в ViewSets"""
    
    def handle_validation_error(self, serializer, context=None):
        """Унифицированная обработка ошибок валидации"""
        logger.warning(f"Validation error in {self.__class__.__name__}: {serializer.errors}")
        return Response(
            {
                'error': 'Ошибка валидации данных',
                'details': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def handle_not_found_error(self, resource_name="Объект"):
        """Унифицированная обработка ошибок 404"""
        logger.warning(f"{resource_name} не найден в {self.__class__.__name__}")
        return Response(
            {
                'error': f'{resource_name} не найден',
                'details': 'Запрашиваемый объект не существует'
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    def handle_server_error(self, error, context=None):
        """Унифицированная обработка серверных ошибок"""
        logger.error(f"Server error in {self.__class__.__name__}: {str(error)}")
        return Response(
            {
                'error': 'Внутренняя ошибка сервера',
                'details': 'Произошла неожиданная ошибка. Попробуйте позже.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class LoggingMixin:
    """Миксин для унифицированного логирования"""
    
    def log_action(self, action, user=None, object_id=None, details=None):
        """Логирование действий пользователя"""
        log_data = {
            'action': action,
            'view': self.__class__.__name__,
            'user': user.username if user else 'anonymous',
            'object_id': object_id,
            'details': details
        }
        logger.info(f"User action: {log_data}")
    
    def log_error(self, error, context=None):
        """Логирование ошибок"""
        log_data = {
            'error': str(error),
            'view': self.__class__.__name__,
            'context': context
        }
        logger.error(f"View error: {log_data}")
