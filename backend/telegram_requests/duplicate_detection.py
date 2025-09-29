"""
Сервис для обнаружения дубликатов запросов
"""
import logging
import re
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from fuzzywuzzy import fuzz
from django.utils import timezone
from .models import Request
from .duplicate_config import config

logger = logging.getLogger(__name__)


class DuplicateDetectionService:
    """Сервис для обнаружения дубликатов запросов по схожести текста"""
    
    def __init__(self, config_instance=None):
        """
        Инициализация сервиса
        
        Args:
            config_instance: Экземпляр конфигурации (по умолчанию используется глобальная конфигурация)
        """
        self.config = config_instance or config
        self.similarity_threshold = self.config.SIMILARITY_THRESHOLD
        self.time_window_days = self.config.TIME_WINDOW_DAYS
    
    def normalize_text(self, text: str) -> str:
        """
        Нормализация текста для сравнения
        
        Args:
            text: Исходный текст
            
        Returns:
            Нормализованный текст
        """
        if not text:
            return ""
        
        normalized = text
        
        # Приводим к нижнему регистру
        if self.config.NORMALIZE_CASE:
            normalized = normalized.lower()
        
        # Убираем лишние пробелы и переносы строк
        if self.config.NORMALIZE_WHITESPACE:
            normalized = ' '.join(normalized.split())
        
        # Убираем знаки препинания (опционально)
        if self.config.REMOVE_PUNCTUATION:
            normalized = ''.join(c for c in normalized if c.isalnum() or c.isspace())
        
        return normalized.strip()
    
    def should_skip_text(self, text: str) -> bool:
        """
        Проверяет, нужно ли пропустить текст (слишком короткий или в исключениях)
        
        Args:
            text: Текст для проверки
            
        Returns:
            True, если текст нужно пропустить
        """
        if not text or len(text.strip()) < self.config.MIN_TEXT_LENGTH:
            return True
        
        # Проверяем исключения
        for pattern in self.config.EXCLUDE_PATTERNS:
            if pattern in text:
                return True
        
        return False
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Вычисление схожести между двумя текстами
        
        Args:
            text1: Первый текст
            text2: Второй текст
            
        Returns:
            Коэффициент схожести от 0.0 до 1.0
        """
        if not text1 or not text2:
            return 0.0
        
        # Нормализуем тексты
        norm_text1 = self.normalize_text(text1)
        norm_text2 = self.normalize_text(text2)
        
        if not norm_text1 or not norm_text2:
            return 0.0
        
        # Выбираем метод сравнения на основе конфигурации
        method = getattr(fuzz, self.config.COMPARISON_METHOD, fuzz.token_sort_ratio)
        similarity = method(norm_text1, norm_text2) / 100.0
        
        if self.config.ENABLE_DEBUG_LOGGING:
            logger.debug(f"Сравнение текстов:")
            logger.debug(f"  Текст 1: '{norm_text1[:100]}...'")
            logger.debug(f"  Текст 2: '{norm_text2[:100]}...'")
            logger.debug(f"  Метод: {self.config.COMPARISON_METHOD}")
            logger.debug(f"  Схожесть: {similarity:.2%}")
        
        return similarity
    
    def find_duplicates(self, text: str, exclude_request_id: Optional[int] = None) -> List[Tuple[Request, float]]:
        """
        Поиск дубликатов для заданного текста
        
        Args:
            text: Текст для поиска дубликатов
            exclude_request_id: ID запроса, который исключить из поиска (для обновлений)
            
        Returns:
            Список кортежей (запрос, коэффициент_схожести) отсортированный по убыванию схожести
        """
        if not text or self.should_skip_text(text):
            return []
        
        # Определяем временное окно
        time_threshold = timezone.now() - timedelta(days=self.time_window_days)
        
        # Получаем все запросы за указанный период
        queryset = Request.objects.filter(
            created_at__gte=time_threshold
        ).exclude(
            text__isnull=True
        ).exclude(
            text__exact=''
        )
        
        # Исключаем конкретный запрос, если указан
        if exclude_request_id:
            queryset = queryset.exclude(id=exclude_request_id)
        
        # Получаем все запросы
        requests = list(queryset)
        
        logger.info(f"Поиск дубликатов среди {len(requests)} запросов за последние {self.time_window_days} дней")
        
        # Ищем дубликаты
        duplicates = []
        for request in requests:
            # Пропускаем короткие тексты и исключения
            if self.should_skip_text(request.text):
                continue
                
            similarity = self.calculate_similarity(text, request.text)
            if similarity >= self.similarity_threshold:
                duplicates.append((request, similarity))
                logger.info(f"Найден дубликат: запрос ID {request.id}, схожесть {similarity:.2%}")
        
        # Сортируем по убыванию схожести
        duplicates.sort(key=lambda x: x[1], reverse=True)
        
        return duplicates
    
    def is_duplicate(self, text: str, exclude_request_id: Optional[int] = None) -> bool:
        """
        Проверка, является ли текст дубликатом
        
        Args:
            text: Текст для проверки
            exclude_request_id: ID запроса, который исключить из поиска
            
        Returns:
            True, если найден дубликат, иначе False
        """
        duplicates = self.find_duplicates(text, exclude_request_id)
        return len(duplicates) > 0
    
    def get_duplicate_info(self, text: str, exclude_request_id: Optional[int] = None) -> Optional[dict]:
        """
        Получение информации о найденном дубликате
        
        Args:
            text: Текст для проверки
            exclude_request_id: ID запроса, который исключить из поиска
            
        Returns:
            Словарь с информацией о дубликате или None, если дубликат не найден
        """
        duplicates = self.find_duplicates(text, exclude_request_id)
        
        if not duplicates:
            return None
        
        # Берем наиболее похожий запрос
        most_similar_request, similarity = duplicates[0]
        
        return {
            'duplicate_request': most_similar_request,
            'similarity': similarity,
            'total_duplicates': len(duplicates),
            'duplicate_id': most_similar_request.id,
            'duplicate_author': most_similar_request.author_name,
            'duplicate_created_at': most_similar_request.created_at,
            'duplicate_text_preview': most_similar_request.text[:100] + '...' if len(most_similar_request.text) > 100 else most_similar_request.text
        }


# Создаем глобальный экземпляр сервиса
duplicate_detector = DuplicateDetectionService()
