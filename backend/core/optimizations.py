"""
Оптимизации для улучшения производительности запросов к базе данных
"""

from django.db import models
from django.db.models import Prefetch, Q, F


class OptimizedQuerySets:
    """Класс с оптимизированными querysets для различных моделей"""
    
    @staticmethod
    def get_optimized_requests_queryset():
        """Оптимизированный queryset для запросов с prefetch_related"""
        return models.QuerySet().select_related(
            'agent',
            'created_project'
        ).prefetch_related(
            'images',
            'files',
            Prefetch('created_project', queryset=models.QuerySet().select_related('project_type', 'genre'))
        )
    
    @staticmethod
    def get_optimized_artists_queryset():
        """Оптимизированный queryset для артистов с prefetch_related"""
        return models.QuerySet().select_related(
            'created_by'
        ).prefetch_related(
            'skills__skill__skill_group',
            'education__education',
            'links',
            'photos',
            'projectroles__project'
        )
    
    @staticmethod
    def get_optimized_projects_queryset():
        """Оптимизированный queryset для проектов с prefetch_related"""
        return models.QuerySet().select_related(
            'project_type',
            'genre',
            'created_by',
            'request'
        ).prefetch_related(
            'roles__role_type',
            'roles__suggested_artists'
        )
    
    @staticmethod
    def get_optimized_project_roles_queryset():
        """Оптимизированный queryset для ролей проекта с prefetch_related"""
        return models.QuerySet().select_related(
            'project__project_type',
            'project__genre',
            'project__created_by',
            'role_type'
        ).prefetch_related(
            'suggested_artists__skills__skill__skill_group'
        )
    
    @staticmethod
    def get_optimized_companies_queryset():
        """Оптимизированный queryset для компаний с prefetch_related"""
        return models.QuerySet().select_related(
            'company_type',
            'created_by'
        ).prefetch_related(
            'projects'
        )
    
    @staticmethod
    def get_optimized_people_queryset():
        """Оптимизированный queryset для персон с prefetch_related"""
        return models.QuerySet().select_related(
            'person_type',
            'created_by'
        ).prefetch_related(
            'projects'
        )


class QueryOptimizer:
    """Класс для оптимизации запросов"""
    
    @staticmethod
    def optimize_list_queryset(queryset, prefetch_fields=None, select_related_fields=None):
        """Универсальный метод для оптимизации queryset"""
        if select_related_fields:
            queryset = queryset.select_related(*select_related_fields)
        
        if prefetch_fields:
            queryset = queryset.prefetch_related(*prefetch_fields)
        
        return queryset
    
    @staticmethod
    def optimize_search_queryset(queryset, search_fields, search_term):
        """Оптимизация queryset для поиска"""
        if not search_term:
            return queryset
        
        # Создаем Q объект для поиска по нескольким полям
        search_q = Q()
        for field in search_fields:
            search_q |= Q(**{f"{field}__icontains": search_term})
        
        return queryset.filter(search_q)
    
    @staticmethod
    def optimize_count_queryset(queryset):
        """Оптимизация queryset для подсчета записей"""
        # Используем только() для загрузки только первичного ключа при подсчете
        return queryset.only('id')


class DatabaseIndexOptimizer:
    """Класс для рекомендаций по индексам базы данных"""
    
    @staticmethod
    def get_recommended_indexes():
        """Возвращает список рекомендуемых индексов"""
        return {
            'telegram_requests_request': [
                'agent_id',
                'status',
                'created_at',
                'original_created_at',
                'media_group_id',
                ('agent_id', 'status'),
                ('created_at', 'status'),
            ],
            'artists_artist': [
                'created_by_id',
                'is_active',
                'gender',
                'availability_status',
                'city',
                'age',
                'height',
                ('created_by_id', 'is_active'),
                ('gender', 'availability_status'),
                ('city', 'is_active'),
            ],
            'projects_project': [
                'created_by_id',
                'is_active',
                'status',
                'project_type_id',
                'genre_id',
                ('created_by_id', 'is_active'),
                ('status', 'is_active'),
                ('project_type_id', 'is_active'),
            ],
            'projects_projectrole': [
                'project_id',
                'is_active',
                'role_type_id',
                ('project_id', 'is_active'),
            ],
            'companies_company': [
                'created_by_id',
                'is_active',
                'company_type_id',
                ('created_by_id', 'is_active'),
            ],
            'people_person': [
                'created_by_id',
                'is_active',
                'person_type_id',
                ('created_by_id', 'is_active'),
            ],
        }


class CacheOptimizer:
    """Класс для оптимизации кэширования"""
    
    @staticmethod
    def get_cache_keys():
        """Возвращает ключи для кэширования часто используемых данных"""
        return {
            'reference_data': [
                'project_types',
                'genres',
                'role_types',
                'company_types',
                'person_types',
                'skill_groups',
                'skills',
                'education',
            ],
            'user_data': [
                'user_artists_count',
                'user_projects_count',
                'user_requests_count',
            ],
            'statistics': [
                'total_artists',
                'total_projects',
                'total_requests',
                'active_agents',
            ]
        }
    
    @staticmethod
    def get_cache_ttl():
        """Возвращает время жизни кэша для различных типов данных"""
        return {
            'reference_data': 3600,  # 1 час
            'user_data': 300,        # 5 минут
            'statistics': 600,       # 10 минут
            'search_results': 180,   # 3 минуты
        }


class PaginationOptimizer:
    """Класс для оптимизации пагинации"""
    
    @staticmethod
    def get_optimal_page_sizes():
        """Возвращает оптимальные размеры страниц для разных типов данных"""
        return {
            'requests': 20,
            'artists': 25,
            'projects': 15,
            'project_roles': 30,
            'companies': 20,
            'people': 20,
        }
    
    @staticmethod
    def optimize_pagination_queryset(queryset, page_size, offset):
        """Оптимизация queryset для пагинации"""
        # Используем only() для загрузки только необходимых полей при пагинации
        return queryset.only('id').values_list('id', flat=True)[offset:offset + page_size]


class SearchOptimizer:
    """Класс для оптимизации поиска"""
    
    @staticmethod
    def optimize_fuzzy_search(field_name, search_term, threshold=0.7):
        """Оптимизация fuzzy search с использованием индексов"""
        # Используем __icontains для начала, затем применяем fuzzy matching в Python
        return Q(**{f"{field_name}__icontains": search_term})
    
    @staticmethod
    def optimize_multi_field_search(search_fields, search_term):
        """Оптимизация поиска по нескольким полям"""
        if not search_term:
            return Q()
        
        # Разбиваем поисковый термин на слова
        search_words = search_term.split()
        
        # Создаем Q объект для каждого слова
        word_queries = []
        for word in search_words:
            word_q = Q()
            for field in search_fields:
                word_q |= Q(**{f"{field}__icontains": word})
            word_queries.append(word_q)
        
        # Объединяем все условия И
        final_query = word_queries[0] if word_queries else Q()
        for query in word_queries[1:]:
            final_query &= query
        
        return final_query
