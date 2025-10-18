from rest_framework import serializers
from .mixins import BaseSerializerMixin
from .models import BackupRecord


class BaseReferenceSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    """
    Базовый сериализатор для справочных моделей.
    
    Предоставляет стандартные поля для всех справочников:
    - id: уникальный идентификатор
    - name: название элемента справочника
    - description: описание
    - is_active: флаг активности
    - created_at/updated_at: временные метки
    """
    
    class Meta:
        fields = [
            'id', 
            'name', 
            'description', 
            'is_active', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = [
            'id', 
            'created_at', 
            'updated_at'
        ]
        extra_kwargs = {
            'name': {
                'help_text': 'Уникальное название элемента справочника'
            },
            'description': {
                'help_text': 'Подробное описание элемента справочника'
            },
            'is_active': {
                'help_text': 'Активен ли элемент справочника'
            }
        }


class BaseModelSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    """
    Базовый сериализатор для основных моделей.
    
    Предоставляет стандартные поля для всех основных сущностей:
    - id: уникальный идентификатор
    - is_active: флаг активности
    - created_by: имя пользователя, создавшего объект
    - created_at/updated_at: временные метки
    """
    
    # Переопределяем поле created_by чтобы оно возвращало username
    created_by = serializers.ReadOnlyField(
        source='created_by.username',
        help_text="Имя пользователя, создавшего объект"
    )
    
    class Meta:
        fields = [
            'id',
            'is_active',
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at'
        ]
        extra_kwargs = {
            'is_active': {
                'help_text': 'Активен ли объект в системе'
            },
            'created_by': {
                'help_text': 'Имя пользователя, создавшего объект'
            }
        }


class BaseListSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    """
    Базовый упрощенный сериализатор для списков.
    
    Используется для отображения списков объектов с минимальным набором полей
    для улучшения производительности API.
    """
    
    class Meta:
        fields = [
            'id',
            'is_active',
            'created_by',
            'created_at'
        ]
        read_only_fields = fields


class BackupRecordSerializer(BaseSerializerMixin, serializers.ModelSerializer):
    """
    Сериализатор для записей о резервных копиях.
    
    Предоставляет полную информацию о бэкапах включая метаданные,
    статус и ссылки на файлы в Google Drive.
    """
    
    # Переопределяем поле created_by чтобы оно возвращало username
    created_by = serializers.ReadOnlyField(
        source='created_by.username',
        help_text="Имя пользователя, создавшего бэкап"
    )
    
    # Добавляем вычисляемые поля
    file_size_mb = serializers.ReadOnlyField(
        help_text="Размер файла в мегабайтах"
    )
    
    duration = serializers.ReadOnlyField(
        help_text="Время создания бэкапа в секундах"
    )
    
    status_display = serializers.ReadOnlyField(
        source='get_status_display',
        help_text="Человекочитаемое название статуса"
    )
    
    class Meta:
        model = BackupRecord
        fields = [
            'id',
            'filename',
            'file_size',
            'file_size_mb',
            'status',
            'status_display',
            'google_drive_file_id',
            'google_drive_url',
            'created_by',
            'created_at',
            'completed_at',
            'duration',
            'error_message'
        ]
        read_only_fields = [
            'id',
            'file_size',
            'file_size_mb',
            'status',
            'status_display',
            'google_drive_file_id',
            'google_drive_url',
            'created_by',
            'created_at',
            'completed_at',
            'duration',
            'error_message'
        ]
        extra_kwargs = {
            'filename': {
                'help_text': 'Имя файла бэкапа'
            },
            'file_size': {
                'help_text': 'Размер файла в байтах'
            },
            'status': {
                'help_text': 'Текущий статус бэкапа'
            },
            'google_drive_file_id': {
                'help_text': 'Идентификатор файла в Google Drive'
            },
            'google_drive_url': {
                'help_text': 'Прямая ссылка на файл в Google Drive'
            },
            'created_by': {
                'help_text': 'Имя пользователя, создавшего бэкап'
            },
            'created_at': {
                'help_text': 'Дата и время создания бэкапа'
            },
            'completed_at': {
                'help_text': 'Дата и время завершения создания бэкапа'
            },
            'error_message': {
                'help_text': 'Текст ошибки, если бэкап не удался'
            }
        }


class BackupStatisticsSerializer(BaseSerializerMixin, serializers.Serializer):
    """
    Сериализатор для статистики бэкапов.
    
    Предоставляет сводную информацию о состоянии системы бэкапов.
    """
    
    last_backup = serializers.DictField(
        help_text="Информация о последнем бэкапе"
    )
    
    statistics = serializers.DictField(
        help_text="Общая статистика бэкапов"
    )
    
    local_storage = serializers.DictField(
        help_text="Информация о локальном хранилище"
    )
    
    class Meta:
        fields = [
            'last_backup',
            'statistics',
            'local_storage'
        ]
        read_only_fields = fields


class BackupCreateSerializer(BaseSerializerMixin, serializers.Serializer):
    """
    Сериализатор для создания нового бэкапа.
    
    Используется для валидации запросов на создание бэкапов.
    """
    
    # Пока нет дополнительных полей, но сериализатор готов для расширения
    pass
    
    class Meta:
        fields = []
        read_only_fields = fields
