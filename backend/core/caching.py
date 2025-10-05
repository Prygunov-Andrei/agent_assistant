"""
Сервисы кэширования для оптимизации производительности
"""
from django.core.cache import cache
from django.core.cache.utils import make_template_fragment_key
from typing import Any, Optional, List
import hashlib
import json


class QuerySetCache:
    """Кэширование QuerySet'ов"""
    
    @staticmethod
    def get_cache_key(model_name: str, filters: dict, ordering: List[str] = None) -> str:
        """Генерация ключа кэша для QuerySet"""
        cache_data = {
            'model': model_name,
            'filters': filters,
            'ordering': ordering or []
        }
        cache_string = json.dumps(cache_data, sort_keys=True)
        return f"queryset:{hashlib.md5(cache_string.encode()).hexdigest()}"
    
    @staticmethod
    def cache_queryset(model_name: str, filters: dict, queryset, timeout: int = 300, ordering: List[str] = None):
        """Кэширование QuerySet"""
        cache_key = QuerySetCache.get_cache_key(model_name, filters, ordering)
        # Конвертируем QuerySet в список для кэширования
        data = list(queryset.values())
        cache.set(cache_key, data, timeout)
        return cache_key
    
    @staticmethod
    def get_cached_queryset(model_name: str, filters: dict, ordering: List[str] = None):
        """Получение кэшированного QuerySet"""
        cache_key = QuerySetCache.get_cache_key(model_name, filters, ordering)
        return cache.get(cache_key)


class UserDataCache:
    """Кэширование пользовательских данных"""
    
    @staticmethod
    def get_user_cache_key(user_id: int, data_type: str) -> str:
        """Генерация ключа кэша для пользователя"""
        return f"user:{user_id}:{data_type}"
    
    @staticmethod
    def cache_user_data(user_id: int, data_type: str, data: Any, timeout: int = 600):
        """Кэширование пользовательских данных"""
        cache_key = UserDataCache.get_user_cache_key(user_id, data_type)
        cache.set(cache_key, data, timeout)
    
    @staticmethod
    def get_user_data(user_id: int, data_type: str):
        """Получение кэшированных пользовательских данных"""
        cache_key = UserDataCache.get_user_cache_key(user_id, data_type)
        return cache.get(cache_key)
    
    @staticmethod
    def invalidate_user_cache(user_id: int, data_types: List[str] = None):
        """Инвалидация кэша пользователя"""
        if data_types is None:
            # Инвалидируем все данные пользователя
            cache.delete_pattern(f"user:{user_id}:*")
        else:
            for data_type in data_types:
                cache_key = UserDataCache.get_user_cache_key(user_id, data_type)
                cache.delete(cache_key)


class CacheInvalidationService:
    """Сервис инвалидации кэша"""
    
    @staticmethod
    def invalidate_model_cache(model_name: str):
        """Инвалидация кэша для модели"""
        cache.delete_pattern(f"queryset:{model_name}:*")
    
    @staticmethod
    def invalidate_related_cache(model_name: str, instance_id: int):
        """Инвалидация кэша связанных объектов"""
        # Инвалидируем кэш для всех связанных моделей
        related_patterns = [
            f"queryset:{model_name}:*",
            f"user:*:{model_name}",
            f"user:*:{model_name}:*"
        ]
        
        for pattern in related_patterns:
            cache.delete_pattern(pattern)
    
    @staticmethod
    def clear_all_cache():
        """Очистка всего кэша"""
        cache.clear()


class OptimizedQuerySets:
    """Оптимизированные QuerySet'ы с кэшированием"""
    
    @staticmethod
    def get_or_cache(model_class, filters: dict, timeout: int = 300, ordering: List[str] = None):
        """Получение или кэширование QuerySet"""
        model_name = model_class._meta.label_lower
        
        # Проверяем кэш
        cached_data = QuerySetCache.get_cached_queryset(model_name, filters, ordering)
        if cached_data is not None:
            return cached_data
        
        # Если нет в кэше, получаем из БД
        queryset = model_class.objects.filter(**filters)
        if ordering:
            queryset = queryset.order_by(*ordering)
        
        # Кэшируем результат
        QuerySetCache.cache_queryset(model_name, filters, queryset, timeout, ordering)
        return queryset