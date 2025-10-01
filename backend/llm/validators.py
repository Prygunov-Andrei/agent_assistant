"""
Валидаторы для LLM ответов
"""

import json
import logging
from typing import Dict, List, Any, Optional
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class LLMResponseValidator:
    """
    Валидатор ответов LLM
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.required_fields = self.config.get('validation', {}).get('required_fields', [
            'project_analysis.project_title',
            'project_analysis.project_type',
            'project_analysis.roles'
        ])
        self.strict_validation = self.config.get('validation', {}).get('json_schema_strict', True)
        self.max_retry_attempts = self.config.get('validation', {}).get('max_retry_attempts', 3)
    
    def validate_analysis_result(self, result: Dict[str, Any]) -> bool:
        """
        Валидация результата анализа LLM
        
        Args:
            result: Результат анализа от LLM
            
        Returns:
            True если валидация прошла успешно
            
        Raises:
            ValidationError: Если валидация не прошла
        """
        try:
            # Проверяем общую структуру
            self._validate_structure(result)
            
            # Проверяем обязательные поля
            self._validate_required_fields(result)
            
            # Проверяем project_analysis
            if 'project_analysis' in result:
                self._validate_project_analysis(result['project_analysis'])
            
            # Проверяем роли
            if 'project_analysis' in result and 'roles' in result['project_analysis']:
                self._validate_roles(result['project_analysis']['roles'])
            
            # Проверяем контакты
            if 'project_analysis' in result and 'contacts' in result['project_analysis']:
                self._validate_contacts(result['project_analysis']['contacts'])
            
            logger.info("LLM response validation passed successfully")
            return True
            
        except ValidationError as e:
            logger.error(f"LLM response validation failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during LLM response validation: {e}")
            raise ValidationError(f"Validation error: {e}")
    
    def _validate_structure(self, result: Dict[str, Any]) -> None:
        """Проверка общей структуры ответа"""
        if not isinstance(result, dict):
            raise ValidationError("Response must be a dictionary")
        
        if not result:
            raise ValidationError("Response cannot be empty")
    
    def _validate_required_fields(self, result: Dict[str, Any]) -> None:
        """Проверка обязательных полей"""
        for field_path in self.required_fields:
            if not self._check_nested_field(result, field_path):
                raise ValidationError(f"Required field missing: {field_path}")
    
    def _check_nested_field(self, data: Dict[str, Any], field_path: str) -> bool:
        """Проверка вложенного поля по пути"""
        try:
            parts = field_path.split('.')
            current = data
            
            for part in parts:
                if not isinstance(current, dict) or part not in current:
                    return False
                current = current[part]
            
            # Проверяем, что поле не пустое
            if current is None or current == '' or (isinstance(current, list) and not current):
                return False
            
            return True
        except (KeyError, TypeError, AttributeError):
            return False
    
    def _validate_project_analysis(self, project_analysis: Dict[str, Any]) -> None:
        """Валидация секции project_analysis"""
        required_project_fields = [
            'project_title', 'project_type', 'genre', 'description'
        ]
        
        for field in required_project_fields:
            if field not in project_analysis:
                raise ValidationError(f"Missing required project field: {field}")
            
            if not project_analysis[field] or project_analysis[field] == 'Не определен':
                if self.strict_validation:
                    raise ValidationError(f"Project field '{field}' cannot be empty or 'Не определен'")
        
        # Проверяем типы данных
        if not isinstance(project_analysis.get('project_title', ''), str):
            raise ValidationError("project_title must be a string")
        
        if not isinstance(project_analysis.get('project_type', ''), str):
            raise ValidationError("project_type must be a string")
        
        if not isinstance(project_analysis.get('genre', ''), str):
            raise ValidationError("genre must be a string")
        
        if not isinstance(project_analysis.get('description', ''), str):
            raise ValidationError("description must be a string")
        
        # Проверяем confidence если есть
        if 'confidence' in project_analysis:
            confidence = project_analysis['confidence']
            if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
                raise ValidationError("confidence must be a number between 0.0 and 1.0")
    
    def _validate_roles(self, roles: List[Dict[str, Any]]) -> None:
        """Валидация ролей"""
        if not isinstance(roles, list):
            raise ValidationError("roles must be a list")
        
        if not roles:
            raise ValidationError("At least one role is required")
        
        for i, role in enumerate(roles):
            self._validate_single_role(role, i)
    
    def _validate_single_role(self, role: Dict[str, Any], index: int) -> None:
        """Валидация одной роли"""
        required_role_fields = [
            'role_type', 'character_name', 'description', 'age_range', 'gender'
        ]
        
        for field in required_role_fields:
            if field not in role:
                raise ValidationError(f"Role {index}: Missing required field '{field}'")
            
            if not role[field] or role[field] == 'Не определен':
                if self.strict_validation:
                    raise ValidationError(f"Role {index}: Field '{field}' cannot be empty or 'Не определен'")
        
        # Проверяем suggested_artists
        if 'suggested_artists' in role:
            if not isinstance(role['suggested_artists'], list):
                raise ValidationError(f"Role {index}: suggested_artists must be a list")
            
            for artist_id in role['suggested_artists']:
                if not isinstance(artist_id, int):
                    raise ValidationError(f"Role {index}: Artist ID must be an integer")
        
        # Проверяем skills_required
        if 'skills_required' in role:
            skills = role['skills_required']
            if not isinstance(skills, dict):
                raise ValidationError(f"Role {index}: skills_required must be a dictionary")
            
            required_skill_categories = ['acting_skills', 'physical_skills', 'languages', 'special_requirements']
            for category in required_skill_categories:
                if category in skills and not isinstance(skills[category], list):
                    raise ValidationError(f"Role {index}: {category} must be a list")
        
        # Проверяем confidence если есть
        if 'confidence' in role:
            confidence = role['confidence']
            if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
                raise ValidationError(f"Role {index}: confidence must be a number between 0.0 and 1.0")
    
    def _validate_contacts(self, contacts: Dict[str, Any]) -> None:
        """Валидация контактной информации"""
        if not isinstance(contacts, dict):
            raise ValidationError("contacts must be a dictionary")
        
        # Проверяем обязательные контакты
        required_contacts = ['casting_director', 'director', 'producers', 'production_company']
        
        for contact_type in required_contacts:
            if contact_type not in contacts:
                raise ValidationError(f"Missing required contact type: {contact_type}")
        
        # Валидируем каждый тип контакта
        self._validate_contact_person(contacts['casting_director'], 'casting_director')
        self._validate_contact_person(contacts['director'], 'director')
        self._validate_contact_company(contacts['production_company'])
        
        # Валидируем продюсеров
        if not isinstance(contacts['producers'], list):
            raise ValidationError("producers must be a list")
    
    def _validate_contact_person(self, contact: Dict[str, Any], contact_type: str) -> None:
        """Валидация контакта персоны"""
        required_fields = ['name', 'phone', 'email', 'telegram']
        
        for field in required_fields:
            if field not in contact:
                raise ValidationError(f"{contact_type}: Missing required field '{field}'")
            
            if not isinstance(contact[field], str):
                raise ValidationError(f"{contact_type}: Field '{field}' must be a string")
        
        # Проверяем confidence если есть
        if 'confidence' in contact:
            confidence = contact['confidence']
            if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
                raise ValidationError(f"{contact_type}: confidence must be a number between 0.0 and 1.0")
    
    def _validate_contact_company(self, contact: Dict[str, Any]) -> None:
        """Валидация контакта компании"""
        required_fields = ['name', 'phone', 'email', 'website']
        
        for field in required_fields:
            if field not in contact:
                raise ValidationError(f"production_company: Missing required field '{field}'")
            
            if not isinstance(contact[field], str):
                raise ValidationError(f"production_company: Field '{field}' must be a string")
        
        # Проверяем confidence если есть
        if 'confidence' in contact:
            confidence = contact['confidence']
            if not isinstance(confidence, (int, float)) or not (0.0 <= confidence <= 1.0):
                raise ValidationError("production_company: confidence must be a number between 0.0 and 1.0")


class LLMRetryHandler:
    """
    Обработчик повторных попыток при ошибках валидации
    """
    
    def __init__(self, validator: LLMResponseValidator, max_attempts: int = 3):
        self.validator = validator
        self.max_attempts = max_attempts
    
    def validate_with_retry(self, result: Dict[str, Any], llm_service, request_data: Dict[str, Any], artists_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Валидация с повторными попытками
        
        Args:
            result: Результат от LLM
            llm_service: Сервис LLM для повторных запросов
            request_data: Данные запроса
            artists_data: Данные артистов
            
        Returns:
            Валидный результат
            
        Raises:
            ValidationError: Если все попытки исчерпаны
        """
        attempt = 1
        
        while attempt <= self.max_attempts:
            try:
                self.validator.validate_analysis_result(result)
                logger.info(f"LLM response validation successful on attempt {attempt}")
                return result
                
            except ValidationError as e:
                logger.warning(f"LLM response validation failed on attempt {attempt}: {e}")
                
                if attempt == self.max_attempts:
                    logger.error(f"All {self.max_attempts} validation attempts failed")
                    raise ValidationError(f"Validation failed after {self.max_attempts} attempts: {e}")
                
                # Повторный запрос к LLM
                logger.info(f"Retrying LLM request (attempt {attempt + 1})")
                result = llm_service.analyze_request(request_data, artists_data)
                attempt += 1
        
        raise ValidationError("Unexpected error in retry handler")


def validate_llm_response(result: Dict[str, Any], config: Optional[Dict[str, Any]] = None) -> bool:
    """
    Удобная функция для валидации ответа LLM
    
    Args:
        result: Результат от LLM
        config: Конфигурация валидации
        
    Returns:
        True если валидация прошла успешно
        
    Raises:
        ValidationError: Если валидация не прошла
    """
    validator = LLMResponseValidator(config)
    return validator.validate_analysis_result(result)
