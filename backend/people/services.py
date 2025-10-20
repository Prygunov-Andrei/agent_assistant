import yaml
import os
from typing import List, Dict, Any, Optional, Tuple
from django.conf import settings
from django.db.models import Q
from rapidfuzz import fuzz, process
from .models import Person


class PersonMatchingService:
    """Сервис для поиска совпадений персон"""
    
    def __init__(self):
        self.config = self._load_config()
        self.thresholds = self.config['search']['thresholds']['persons']
        self.field_weights = self.config['search']['field_weights']['persons']
        self.fuzzy_config = self.config['search']['fuzzy_matching']['rapidfuzz']
        
    def _load_config(self) -> Dict[str, Any]:
        """Загружает конфигурацию из search_config.yaml"""
        config_path = os.path.join(settings.BASE_DIR, 'search_config.yaml')
        with open(config_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    
    def _normalize_text(self, text: str) -> str:
        """Нормализует текст для поиска"""
        if not text:
            return ""
            
        # Применяем настройки нормализации
        norm_config = self.config['search']['text_normalization']
        
        if norm_config['to_lowercase']:
            text = text.lower()
        
        if norm_config['remove_punctuation']:
            import string
            text = text.translate(str.maketrans('', '', string.punctuation))
        
        if norm_config['remove_extra_spaces']:
            text = ' '.join(text.split())
            
        return text.strip()
    
    def _calculate_field_score(self, field_name: str, search_value: str, target_value: str) -> float:
        """Вычисляет оценку схожести для конкретного поля"""
        if not search_value or not target_value:
            return 0.0
            
        # Нормализуем значения
        search_norm = self._normalize_text(search_value)
        target_norm = self._normalize_text(target_value)
        
        if not search_norm or not target_norm:
            return 0.0
        
        # Используем rapidfuzz для вычисления схожести
        scorer_name = self.fuzzy_config['scorer'].replace('fuzz.', '')
        scorer = getattr(fuzz, scorer_name)
        score = scorer(search_norm, target_norm) / 100.0
        
        # Применяем вес поля
        weight = self.field_weights.get(field_name, 1.0)
        return score * weight
    
    def _calculate_person_score(self, search_data: Dict[str, str], person: Person) -> float:
        """Вычисляет общую оценку схожести персоны"""
        total_score = 0.0
        total_weight = 0.0
        
        # Маппинг старых полей на новые множественные поля
        field_mapping = {
            'phone': 'phones',
            'email': 'emails',
            'telegram_username': 'telegram_usernames'
        }
        
        # Проверяем каждое поле поиска
        for field_name, search_value in search_data.items():
            if not search_value:
                continue
            
            # Проверяем, есть ли маппинг на множественное поле
            target_field = field_mapping.get(field_name, field_name)
            
            # Получаем значение поля из модели
            target_value = getattr(person, target_field, None)
            
            # Если это массив контактов - проверяем каждый элемент
            if isinstance(target_value, list):
                if not target_value:
                    continue
                
                # Находим максимальную оценку среди всех контактов
                max_field_score = 0.0
                for contact in target_value:
                    if contact:
                        score = self._calculate_field_score(field_name, search_value, str(contact))
                        max_field_score = max(max_field_score, score)
                
                field_score = max_field_score
            else:
                # Обычное поле (не массив)
                if not target_value:
                    continue
                field_score = self._calculate_field_score(field_name, search_value, str(target_value))
            
            field_weight = self.field_weights.get(field_name, 1.0)
            total_score += field_score * field_weight
            total_weight += field_weight
        
        # Возвращаем средневзвешенную оценку
        return total_score / total_weight if total_weight > 0 else 0.0
    
    def search_matches(
        self, 
        search_data: Dict[str, str], 
        person_type: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Ищет совпадения персон по заданным критериям
        
        Args:
            search_data: Словарь с полями для поиска (email, phone, telegram_username, first_name, last_name)
            person_type: Тип персоны для фильтрации (опционально)
            limit: Максимальное количество результатов
            
        Returns:
            Список словарей с найденными персонами и их оценками схожести
        """
        # Фильтруем только активных персон
        queryset = Person.objects.filter(is_active=True)
        
        # Фильтруем по типу персоны, если указан
        if person_type:
            queryset = queryset.filter(person_type=person_type)
        
        # Получаем порог схожести для типа персоны
        threshold = self.thresholds.get(person_type, self.thresholds.get('directors', 0.6))
        
        # Ограничиваем количество кандидатов для анализа
        max_candidates = self.config['search']['limits']['max_candidates']
        candidates = list(queryset[:max_candidates])
        
        matches = []
        
        for person in candidates:
            # Вычисляем общую оценку схожести
            score = self._calculate_person_score(search_data, person)
            
            # Добавляем только если оценка выше порога
            if score >= threshold:
                matches.append({
                    'person': person,
                    'score': score,
                    'confidence': self._get_confidence_level(score)
                })
        
        # Сортируем по убыванию оценки
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        # Возвращаем ограниченное количество результатов
        return matches[:limit]
    
    def _get_confidence_level(self, score: float) -> str:
        """Определяет уровень уверенности по оценке"""
        if score >= 0.9:
            return 'high'
        elif score >= 0.7:
            return 'medium'
        else:
            return 'low'
    
    def search_by_name(
        self, 
        name: str, 
        person_type: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Ищет персон по имени с использованием fuzzy matching
        
        Args:
            name: Имя для поиска
            person_type: Тип персоны для фильтрации (опционально)
            limit: Максимальное количество результатов
            
        Returns:
            Список словарей с найденными персонами и их оценками схожести
        """
        # Фильтруем только активных персон
        queryset = Person.objects.filter(is_active=True)
        
        # Фильтруем по типу персоны, если указан
        if person_type:
            queryset = queryset.filter(person_type=person_type)
        
        # Получаем порог схожести для типа персоны
        threshold = self.thresholds.get(person_type, self.thresholds.get('directors', 0.6))
        
        # Получаем всех кандидатов данного типа для fuzzy matching
        # Для персон обычно их немного (до нескольких тысяч), поэтому fuzzy matching работает быстро
        candidates = list(queryset)
        
        # Если после фильтрации ничего не найдено, возвращаем пустой список
        if not candidates:
            return []
        
        # Подготавливаем данные для fuzzy matching
        person_data = []
        for person in candidates:
            # Создаем строку для поиска из полных имен
            search_string = f"{person.full_name} {person.short_name}"
            if person.middle_name:
                search_string += f" {person.first_name} {person.middle_name}"
            
            person_data.append((person, search_string))
        
        # Выполняем fuzzy matching
        scorer_name = self.fuzzy_config['scorer'].replace('fuzz.', '')
        scorer = getattr(fuzz, scorer_name)
        results = process.extract(
            name, 
            [data[1] for data in person_data],
            scorer=scorer,
            limit=limit
        )
        
        matches = []
        for result_string, score, index in results:
            # Нормализуем оценку (0-1)
            normalized_score = score / 100.0
            
            # Проверяем порог схожести
            if normalized_score >= threshold:
                person = person_data[index][0]
                matches.append({
                    'person': person,
                    'score': normalized_score,
                    'confidence': self._get_confidence_level(normalized_score)
                })
        
        return matches
    
    def get_persons_by_type(self, person_type: str) -> List[Person]:
        """
        Получает список персон по типу
        
        Args:
            person_type: Тип персоны
            
        Returns:
            Список персон указанного типа
        """
        return list(Person.objects.filter(
            person_type=person_type,
            is_active=True
        ).order_by('last_name', 'first_name'))
    
    def get_person_types(self) -> List[Dict[str, str]]:
        """
        Получает список доступных типов персон
        
        Returns:
            Список словарей с типами персон
        """
        return [
            {'value': choice[0], 'label': choice[1]}
            for choice in Person.PERSON_TYPES
        ]


# Создаем экземпляр сервиса
person_matching_service = PersonMatchingService()
