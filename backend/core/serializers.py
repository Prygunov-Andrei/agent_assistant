from rest_framework import serializers


class BaseReferenceSerializer(serializers.ModelSerializer):
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


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Базовый сериализатор для основных моделей.
    
    Предоставляет стандартные поля для всех основных сущностей:
    - id: уникальный идентификатор
    - is_active: флаг активности
    - created_by: имя пользователя, создавшего объект
    - created_at/updated_at: временные метки
    """
    
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
            }
        }


class BaseListSerializer(serializers.ModelSerializer):
    """
    Базовый упрощенный сериализатор для списков.
    
    Используется для отображения списков объектов с минимальным набором полей
    для улучшения производительности API.
    """
    
    created_by = serializers.ReadOnlyField(
        source='created_by.username',
        help_text="Имя пользователя, создавшего объект"
    )
    
    class Meta:
        fields = [
            'id',
            'is_active',
            'created_by',
            'created_at'
        ]
        read_only_fields = fields
