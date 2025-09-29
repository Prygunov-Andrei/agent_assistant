"""
Конфигурация для обнаружения дубликатов запросов
"""
from django.conf import settings


class DuplicateDetectionConfig:
    """Конфигурация для обнаружения дубликатов"""
    
    # Основные настройки
    SIMILARITY_THRESHOLD = getattr(settings, 'DUPLICATE_SIMILARITY_THRESHOLD', 0.9)  # 90%
    TIME_WINDOW_DAYS = getattr(settings, 'DUPLICATE_TIME_WINDOW_DAYS', 30)  # 30 дней
    
    # Методы сравнения
    COMPARISON_METHOD = getattr(settings, 'DUPLICATE_COMPARISON_METHOD', 'token_sort_ratio')
    
    # Настройки нормализации текста
    NORMALIZE_CASE = getattr(settings, 'DUPLICATE_NORMALIZE_CASE', True)
    NORMALIZE_WHITESPACE = getattr(settings, 'DUPLICATE_NORMALIZE_WHITESPACE', True)
    REMOVE_PUNCTUATION = getattr(settings, 'DUPLICATE_REMOVE_PUNCTUATION', False)
    
    # Минимальная длина текста для сравнения
    MIN_TEXT_LENGTH = getattr(settings, 'DUPLICATE_MIN_TEXT_LENGTH', 10)
    
    # Исключения (тексты, которые не проверяются на дубликаты)
    EXCLUDE_PATTERNS = getattr(settings, 'DUPLICATE_EXCLUDE_PATTERNS', [
        '[Сообщение без текста]',
        '[Прикреплено',
        'Переслано из',
    ])
    
    # Логирование
    ENABLE_DEBUG_LOGGING = getattr(settings, 'DUPLICATE_DEBUG_LOGGING', False)
    
    @classmethod
    def get_comparison_methods(cls):
        """Возвращает доступные методы сравнения"""
        return {
            'ratio': 'Простое сравнение строк',
            'partial_ratio': 'Частичное сравнение (лучше для коротких текстов)',
            'token_sort_ratio': 'Сравнение с сортировкой токенов (лучше для разного порядка слов)',
            'token_set_ratio': 'Сравнение множеств токенов (игнорирует повторения)',
        }
    
    @classmethod
    def get_recommended_settings(cls):
        """Возвращает рекомендуемые настройки для разных сценариев"""
        return {
            'strict': {
                'similarity_threshold': 0.95,
                'time_window_days': 7,
                'comparison_method': 'token_sort_ratio',
                'description': 'Строгий режим - только очень похожие запросы за неделю'
            },
            'balanced': {
                'similarity_threshold': 0.9,
                'time_window_days': 30,
                'comparison_method': 'token_sort_ratio',
                'description': 'Сбалансированный режим - рекомендуемый'
            },
            'loose': {
                'similarity_threshold': 0.8,
                'time_window_days': 60,
                'comparison_method': 'token_set_ratio',
                'description': 'Мягкий режим - больше дубликатов, но больше ложных срабатываний'
            }
        }


# Создаем глобальный экземпляр конфигурации
config = DuplicateDetectionConfig()
