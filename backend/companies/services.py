import yaml
import os
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.db.models import Q
from rapidfuzz import fuzz, process
from .models import Company


class CompanyMatchingService:
    """Сервис для поиска совпадений кинокомпаний"""
    
    def __init__(self):
        self.config = self._load_config()
        self.thresholds = self.config['search']['thresholds']['companies']
        self.field_weights = self.config['search']['field_weights']['companies']
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
        
        # Получаем scorer из конфигурации
        scorer_name = self.fuzzy_config['scorer'].replace('fuzz.', '')
        scorer = getattr(fuzz, scorer_name)
        
        # Вычисляем схожесть
        score = scorer(search_norm, target_norm) / 100.0
        
        # Применяем вес поля
        weight = self.field_weights.get(field_name, 1.0)
        
        return score * weight
    
    def _get_confidence_level(self, score: float) -> str:
        """Определяет уровень уверенности на основе оценки"""
        if score >= 0.9:
            return 'high'
        elif score >= 0.6:
            return 'medium'
        else:
            return 'low'
    
    def search_matches(self, search_data: Dict[str, str], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Ищет совпадения компаний по переданным критериям
        
        Args:
            search_data: Словарь с критериями поиска (name, website, email)
            limit: Максимальное количество результатов
            
        Returns:
            Список найденных совпадений с оценками
        """
        if not any(search_data.values()):
            return []
        
        # Получаем все активные компании
        companies = Company.objects.filter(is_active=True)
        
        matches = []
        
        for company in companies:
            total_score = 0.0
            field_scores = {}
            matched_fields = []
            
            # Проверяем каждое поле поиска
            for field_name, search_value in search_data.items():
                if not search_value:
                    continue
                    
                if field_name == 'name' and company.name:
                    score = self._calculate_field_score('name', search_value, company.name)
                    field_scores['name'] = score
                    if score > 0:
                        matched_fields.append('name')
                    total_score += score
                    
                elif field_name == 'website' and company.website:
                    score = self._calculate_field_score('website', search_value, company.website)
                    field_scores['website'] = score
                    if score > 0:
                        matched_fields.append('website')
                    total_score += score
                    
                elif field_name == 'email' and company.email:
                    score = self._calculate_field_score('email', search_value, company.email)
                    field_scores['email'] = score
                    if score > 0:
                        matched_fields.append('email')
                    total_score += score
            
            # Если есть совпадения и общая оценка выше порога
            threshold = self.thresholds.get(company.company_type, self.thresholds.get('other', 0.5))
            if matched_fields and total_score >= threshold:
                matches.append({
                    'id': company.id,
                    'name': company.name,
                    'company_type': company.company_type,
                    'company_type_display': company.get_company_type_display(),
                    'description': company.description,
                    'website': company.website,
                    'email': company.email,
                    'phone': company.phone,
                    'address': company.address,
                    'founded_year': company.founded_year,
                    'logo': company.logo.url if company.logo else None,
                    'score': round(total_score, 3),
                    'confidence': self._get_confidence_level(total_score),
                    'matched_fields': matched_fields,
                    'field_scores': field_scores
                })
        
        # Сортируем по убыванию оценки и возвращаем топ результатов
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:limit]
    
    def search_by_name(self, name: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Ищет компании по названию
        
        Args:
            name: Название для поиска
            limit: Максимальное количество результатов
            
        Returns:
            Список найденных совпадений
        """
        return self.search_matches({'name': name}, limit)
    
    def get_companies_by_type(self, company_type: str) -> List[Company]:
        """
        Получает компании по типу
        
        Args:
            company_type: Тип компании
            
        Returns:
            Список компаний указанного типа
        """
        return Company.objects.filter(
            company_type=company_type,
            is_active=True
        ).order_by('name')
    
    def get_company_types(self) -> List[Dict[str, str]]:
        """
        Получает список типов компаний
        
        Returns:
            Список типов компаний
        """
        return [
            {'value': choice[0], 'label': choice[1]} 
            for choice in Company.COMPANY_TYPES
        ]


# Создаем экземпляр сервиса
company_matching_service = CompanyMatchingService()
