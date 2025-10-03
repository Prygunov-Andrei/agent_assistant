from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """Сериализатор для модели Company"""
    
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'company_type',
            'description',
            'logo',
            'website',
            'email',
            'phone',
            'address',
            'founded_year',
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
            'name': {
                'help_text': 'Официальное название кинокомпании'
            },
            'company_type': {
                'help_text': 'Основной тип деятельности компании'
            },
            'description': {
                'help_text': 'Подробное описание компании'
            },
            'logo': {
                'help_text': 'Логотип компании'
            },
            'website': {
                'help_text': 'Официальный сайт компании'
            },
            'email': {
                'help_text': 'Контактный email'
            },
            'phone': {
                'help_text': 'Контактный телефон'
            },
            'address': {
                'help_text': 'Физический адрес компании'
            },
            'founded_year': {
                'help_text': 'Год основания компании'
            },
            'is_active': {
                'help_text': 'Активна ли компания'
            }
        }


class CompanyListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка компаний"""
    
    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'company_type',
            'logo',
            'website',
            'is_active',
            'created_at',
        ]
        extra_kwargs = {
            'name': {
                'help_text': 'Название кинокомпании'
            },
            'company_type': {
                'help_text': 'Тип компании'
            },
            'logo': {
                'help_text': 'Логотип компании'
            },
            'website': {
                'help_text': 'Веб-сайт компании'
            },
            'is_active': {
                'help_text': 'Активна ли компания'
            }
        }


class CompanyMatchSerializer(serializers.Serializer):
    """Сериализатор для результатов поиска совпадений компаний"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    company_type = serializers.CharField()
    company_type_display = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    website = serializers.URLField(allow_null=True)
    email = serializers.EmailField(allow_null=True)
    phone = serializers.CharField(allow_null=True)
    address = serializers.CharField(allow_null=True)
    founded_year = serializers.IntegerField(allow_null=True)
    logo = serializers.URLField(allow_null=True)
    score = serializers.FloatField(help_text="Оценка схожести (0-1)")
    confidence = serializers.CharField(help_text="Уровень уверенности (high/medium/low)")
    matched_fields = serializers.ListField(
        child=serializers.CharField(),
        help_text="Поля, по которым найдено совпадение"
    )
    field_scores = serializers.DictField(
        help_text="Оценки схожести по каждому полю"
    )


class CompanySearchRequestSerializer(serializers.Serializer):
    """Сериализатор для запроса поиска совпадений компаний"""
    name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        help_text="Название компании для поиска"
    )
    website = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text="Веб-сайт для поиска"
    )
    email = serializers.EmailField(
        required=False,
        allow_blank=True,
        help_text="Email для поиска"
    )
    limit = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Максимальное количество результатов"
    )
    
    def validate(self, data):
        search_fields = ['name', 'website', 'email']
        if not any(data.get(field) for field in search_fields):
            raise serializers.ValidationError("Необходимо указать хотя бы один критерий поиска")
        return data


class CompanyNameSearchRequestSerializer(serializers.Serializer):
    """Сериализатор для поиска компаний по названию"""
    name = serializers.CharField(
        max_length=200,
        help_text="Название компании для поиска"
    )
    limit = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Максимальное количество результатов"
    )


class CompanyTypeSerializer(serializers.Serializer):
    """Сериализатор для типов компаний"""
    value = serializers.CharField(help_text="Значение типа компании")
    label = serializers.CharField(help_text="Отображаемое название типа компании")
