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
