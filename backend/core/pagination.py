"""
Оптимизированная пагинация для улучшения производительности
"""

from typing import List, Dict, Any, Optional
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import QuerySet
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.settings import api_settings


class OptimizedPageNumberPagination(PageNumberPagination):
    """Оптимизированная пагинация с улучшенной производительностью"""
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Возвращает оптимизированный ответ с пагинацией"""
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.get_page_size(self.request),
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })


class FastPageNumberPagination(PageNumberPagination):
    """Быстрая пагинация для больших списков"""
    
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
    
    def paginate_queryset(self, queryset, request, view=None):
        """Оптимизированная пагинация с использованием only()"""
        page_size = self.get_page_size(request)
        
        # Используем only() для загрузки только ID при подсчете
        count_queryset = queryset.only('id')
        
        paginator = self.django_paginator_class(count_queryset, page_size)
        page_number = request.query_params.get(self.page_query_param, 1)
        
        if page_number in self.last_page_strings:
            page_number = paginator.num_pages
        
        try:
            self.page = paginator.page(page_number)
        except (PageNotAnInteger, EmptyPage):
            self.page = paginator.page(1)
        
        # Теперь получаем полные данные только для текущей страницы
        if self.page.has_other_pages():
            self.page_ids = list(self.page.object_list.values_list('id', flat=True))
            self.page_objects = queryset.filter(id__in=self.page_ids)
        else:
            self.page_objects = queryset
        
        return list(self.page_objects)
    
    def get_paginated_response(self, data):
        """Возвращает ответ с оптимизированной пагинацией"""
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.get_page_size(self.request),
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'has_next': self.page.has_next(),
            'has_previous': self.page.has_previous(),
            'results': data
        })


class CursorPagination(PageNumberPagination):
    """Пагинация с курсором для очень больших списков"""
    
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 500
    cursor_query_param = 'cursor'
    
    def paginate_queryset(self, queryset, request, view=None):
        """Пагинация с использованием курсора"""
        page_size = self.get_page_size(request)
        cursor = request.query_params.get(self.cursor_query_param)
        
        if cursor:
            # Фильтруем по курсору (предполагаем, что есть поле created_at)
            queryset = queryset.filter(created_at__lt=cursor)
        
        # Ограничиваем количество результатов
        queryset = queryset[:page_size + 1]
        
        self.has_next = len(queryset) > page_size
        if self.has_next:
            queryset = queryset[:page_size]
        
        return list(queryset)
    
    def get_paginated_response(self, data):
        """Возвращает ответ с курсорной пагинацией"""
        next_cursor = None
        if self.has_next and data:
            next_cursor = data[-1]['created_at']
        
        return Response({
            'count': len(data),
            'next_cursor': next_cursor,
            'has_next': self.has_next,
            'page_size': self.get_page_size(self.request),
            'results': data
        })


class PaginationService:
    """Сервис для работы с пагинацией"""
    
    @staticmethod
    def get_optimal_page_size(request, default_size: int = 20) -> int:
        """Определение оптимального размера страницы"""
        page_size = request.query_params.get('page_size', default_size)
        
        try:
            page_size = int(page_size)
            # Ограничиваем размер страницы для производительности
            return min(max(page_size, 1), 100)
        except (ValueError, TypeError):
            return default_size
    
    @staticmethod
    def paginate_queryset(queryset: QuerySet, page: int, page_size: int) -> Dict[str, Any]:
        """Пагинация queryset с возвратом метаданных"""
        paginator = Paginator(queryset, page_size)
        
        try:
            page_obj = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            page_obj = paginator.page(1)
        
        return {
            'objects': page_obj.object_list,
            'page': page_obj,
            'paginator': paginator,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next_page_number': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous_page_number': page_obj.previous_page_number() if page_obj.has_previous() else None,
        }
    
    @staticmethod
    def get_pagination_links(request, page_obj) -> Dict[str, Optional[str]]:
        """Генерация ссылок для пагинации"""
        base_url = request.build_absolute_uri().split('?')[0]
        query_params = request.query_params.copy()
        
        links = {
            'next': None,
            'previous': None,
        }
        
        if page_obj.has_next():
            query_params['page'] = page_obj.next_page_number()
            links['next'] = f"{base_url}?{query_params.urlencode()}"
        
        if page_obj.has_previous():
            query_params['page'] = page_obj.previous_page_number()
            links['previous'] = f"{base_url}?{query_params.urlencode()}"
        
        return links


class SearchPagination:
    """Пагинация для поисковых результатов"""
    
    @staticmethod
    def paginate_search_results(results: List[Dict], page: int, page_size: int) -> Dict[str, Any]:
        """Пагинация результатов поиска"""
        total = len(results)
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_results = results[start:end]
        
        return {
            'results': paginated_results,
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'has_next': end < total,
            'has_previous': page > 1,
        }


class InfiniteScrollPagination:
    """Пагинация для бесконечной прокрутки"""
    
    @staticmethod
    def get_infinite_scroll_data(queryset: QuerySet, last_id: Optional[int], page_size: int) -> Dict[str, Any]:
        """Получение данных для бесконечной прокрутки"""
        if last_id:
            queryset = queryset.filter(id__gt=last_id)
        
        # Получаем на один элемент больше для проверки наличия следующей страницы
        results = list(queryset[:page_size + 1])
        
        has_next = len(results) > page_size
        if has_next:
            results = results[:page_size]
        
        next_last_id = results[-1]['id'] if results else None
        
        return {
            'results': results,
            'has_next': has_next,
            'next_last_id': next_last_id,
            'page_size': page_size,
        }


class PaginationConfig:
    """Конфигурация пагинации для разных типов данных"""
    
    PAGE_SIZES = {
        'requests': 20,
        'artists': 25,
        'projects': 15,
        'project_roles': 30,
        'companies': 20,
        'people': 20,
        'search_results': 10,
    }
    
    MAX_PAGE_SIZES = {
        'requests': 100,
        'artists': 100,
        'projects': 100,
        'project_roles': 100,
        'companies': 100,
        'people': 100,
        'search_results': 50,
    }
    
    @classmethod
    def get_page_size(cls, data_type: str, requested_size: Optional[int] = None) -> int:
        """Получение размера страницы для типа данных"""
        default_size = cls.PAGE_SIZES.get(data_type, 20)
        max_size = cls.MAX_PAGE_SIZES.get(data_type, 100)
        
        if requested_size is None:
            return default_size
        
        return min(max(requested_size, 1), max_size)
    
    @classmethod
    def get_pagination_class(cls, data_type: str, total_count: int) -> type:
        """Выбор класса пагинации в зависимости от типа данных и количества"""
        if total_count > 10000:
            return CursorPagination
        elif total_count > 1000:
            return FastPageNumberPagination
        else:
            return OptimizedPageNumberPagination
