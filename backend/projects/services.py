import yaml
import os
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.db.models import Q
from rapidfuzz import fuzz, process
from .models import Project


class ProjectMatchingService:
    """Сервис для поиска совпадений проектов"""
    
    def __init__(self):
        self.config = self._load_config()
        self.thresholds = self.config['search']['thresholds']['projects']
        self.field_weights = self.config['search']['field_weights']['projects']
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
        Ищет совпадения проектов по переданным критериям
        
        Args:
            search_data: Словарь с критериями поиска (title, description)
            limit: Максимальное количество результатов
            
        Returns:
            Список найденных совпадений с оценками
        """
        if not any(search_data.values()):
            return []
        
        # Получаем все активные проекты
        projects = Project.objects.filter(is_active=True).select_related(
            'project_type', 'genre', 'production_company', 'director'
        )
        
        matches = []
        
        for project in projects:
            total_score = 0.0
            field_scores = {}
            matched_fields = []
            
            # Проверяем каждое поле поиска
            for field_name, search_value in search_data.items():
                if not search_value:
                    continue
                    
                if field_name == 'title' and project.title:
                    score = self._calculate_field_score('title', search_value, project.title)
                    field_scores['title'] = score
                    if score > 0:
                        matched_fields.append('title')
                    total_score += score
                    
                elif field_name == 'description' and project.description:
                    score = self._calculate_field_score('description', search_value, project.description)
                    field_scores['description'] = score
                    if score > 0:
                        matched_fields.append('description')
                    total_score += score
            
            # Если есть совпадения и общая оценка выше порога
            threshold = self.thresholds.get(project.status, self.thresholds.get('draft', 0.5))
            if matched_fields and total_score >= threshold:
                matches.append({
                    'id': project.id,
                    'title': project.title,
                    'project_type': project.project_type.name if project.project_type else None,
                    'status': project.status,
                    'status_display': project.get_status_display() if project.status else None,
                    'description': project.description,
                    'genre': project.genre.name if project.genre else None,
                    'premiere_date': project.premiere_date.isoformat() if project.premiere_date else None,
                    'director': {
                        'id': project.director.id,
                        'name': str(project.director)
                    } if project.director else None,
                    'production_company': {
                        'id': project.production_company.id,
                        'name': project.production_company.name
                    } if project.production_company else None,
                    'created_at': project.created_at.isoformat(),
                    'score': round(total_score, 3),
                    'confidence': self._get_confidence_level(total_score),
                    'matched_fields': matched_fields,
                    'field_scores': field_scores
                })
        
        # Сортируем по убыванию оценки и возвращаем топ результатов
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:limit]
    
    def search_by_title(self, title: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Ищет проекты по названию
        
        Args:
            title: Название для поиска
            limit: Максимальное количество результатов
            
        Returns:
            Список найденных совпадений
        """
        return self.search_matches({'title': title}, limit)
    
    def get_projects_by_status(self, status: str) -> List[Project]:
        """
        Получает проекты по статусу
        
        Args:
            status: Статус проекта
            
        Returns:
            Список проектов указанного статуса
        """
        return Project.objects.filter(
            status=status,
            is_active=True
        ).select_related('project_type', 'genre', 'production_company').order_by('-created_at')
    
    def get_project_statuses(self) -> List[Dict[str, str]]:
        """
        Получает список статусов проектов
        
        Returns:
            Список статусов проектов
        """
        return [
            {'value': choice[0], 'label': choice[1]} 
            for choice in Project.STATUS_CHOICES
        ]


# Создаем экземпляр сервиса
project_matching_service = ProjectMatchingService()
