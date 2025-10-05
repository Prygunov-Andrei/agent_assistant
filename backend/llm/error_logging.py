"""
Система логирования ошибок для LLM интеграции
"""

import logging
import json
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from django.conf import settings
from django.core.exceptions import ValidationError

# Настройка логгера
logger = logging.getLogger('llm_errors')

class ErrorLogger:
    """
    Класс для логирования ошибок LLM интеграции
    """
    
    def __init__(self):
        self.logger = logger
        self.setup_logging()
    
    def setup_logging(self):
        """Настройка логирования"""
        if not self.logger.handlers:
            # Создаем handler для файла
            log_file = getattr(settings, 'LLM_ERROR_LOG_FILE', 'logs/llm_errors.log')
            
            # Создаем папку для логов если её нет
            import os
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            
            # Формат логов
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(formatter)
            
            # Добавляем handler
            self.logger.addHandler(file_handler)
            self.logger.setLevel(logging.ERROR)
    
    def log_validation_error(self, error: ValidationError, context: Dict[str, Any] = None):
        """Логирование ошибки валидации"""
        error_data = {
            'type': 'validation_error',
            'message': str(error),
            'context': context or {},
            'timestamp': datetime.now().isoformat(),
            'traceback': traceback.format_exc()
        }
        
        self.logger.error(f"LLM Validation Error: {json.dumps(error_data, ensure_ascii=False)}")
    
    def log_llm_request_error(self, error: Exception, request_data: Dict[str, Any], 
                             artists_data: List[Dict[str, Any]], attempt: int = 1):
        """Логирование ошибки запроса к LLM"""
        error_data = {
            'type': 'llm_request_error',
            'error_message': str(error),
            'error_type': type(error).__name__,
            'attempt': attempt,
            'request_data': {
                'id': request_data.get('id'),
                'text_length': len(request_data.get('text', '')),
                'author_name': request_data.get('author_name')
            },
            'artists_count': len(artists_data),
            'timestamp': datetime.now().isoformat(),
            'traceback': traceback.format_exc()
        }
        
        self.logger.error(f"LLM Request Error: {json.dumps(error_data, ensure_ascii=False)}")
    
    def log_json_parse_error(self, error: Exception, raw_response: str, 
                           request_data: Dict[str, Any]):
        """Логирование ошибки парсинга JSON"""
        error_data = {
            'type': 'json_parse_error',
            'error_message': str(error),
            'error_type': type(error).__name__,
            'raw_response_length': len(raw_response),
            'raw_response_preview': raw_response[:500] + '...' if len(raw_response) > 500 else raw_response,
            'request_data': {
                'id': request_data.get('id'),
                'text_length': len(request_data.get('text', ''))
            },
            'timestamp': datetime.now().isoformat(),
            'traceback': traceback.format_exc()
        }
        
        self.logger.error(f"JSON Parse Error: {json.dumps(error_data, ensure_ascii=False)}")
    
    def log_retry_attempt(self, attempt: int, max_attempts: int, error: Exception, 
                         request_data: Dict[str, Any]):
        """Логирование попытки повтора"""
        error_data = {
            'type': 'retry_attempt',
            'attempt': attempt,
            'max_attempts': max_attempts,
            'error_message': str(error),
            'error_type': type(error).__name__,
            'request_data': {
                'id': request_data.get('id'),
                'text_length': len(request_data.get('text', ''))
            },
            'timestamp': datetime.now().isoformat()
        }
        
        self.logger.warning(f"Retry Attempt: {json.dumps(error_data, ensure_ascii=False)}")
    
    def log_fallback_activation(self, reason: str, request_data: Dict[str, Any]):
        """Логирование активации fallback режима"""
        error_data = {
            'type': 'fallback_activation',
            'reason': reason,
            'request_data': {
                'id': request_data.get('id'),
                'text_length': len(request_data.get('text', ''))
            },
            'timestamp': datetime.now().isoformat()
        }
        
        self.logger.warning(f"Fallback Activated: {json.dumps(error_data, ensure_ascii=False)}")
    
    def log_successful_validation(self, request_data: Dict[str, Any], 
                                 response_data: Dict[str, Any], attempt: int = 1):
        """Логирование успешной валидации"""
        success_data = {
            'type': 'successful_validation',
            'attempt': attempt,
            'request_data': {
                'id': request_data.get('id'),
                'text_length': len(request_data.get('text', ''))
            },
            'response_data': {
                'project_title': response_data.get('project_analysis', {}).get('project_title'),
                'roles_count': len(response_data.get('project_analysis', {}).get('roles', []))
            },
            'timestamp': datetime.now().isoformat()
        }
        
        self.logger.info(f"Successful Validation: {json.dumps(success_data, ensure_ascii=False)}")


class ErrorMetrics:
    """
    Класс для сбора метрик ошибок
    """
    
    def __init__(self):
        self.metrics = {
            'validation_errors': 0,
            'llm_request_errors': 0,
            'json_parse_errors': 0,
            'retry_attempts': 0,
            'fallback_activations': 0,
            'successful_validations': 0,
            'total_requests': 0
        }
    
    def increment_metric(self, metric_name: str):
        """Увеличение метрики"""
        if metric_name in self.metrics:
            self.metrics[metric_name] += 1
    
    def get_metrics(self) -> Dict[str, int]:
        """Получение текущих метрик"""
        return self.metrics.copy()
    
    def get_error_rate(self) -> float:
        """Получение процента ошибок"""
        if self.metrics['total_requests'] == 0:
            return 0.0
        
        total_errors = (
            self.metrics['validation_errors'] +
            self.metrics['llm_request_errors'] +
            self.metrics['json_parse_errors']
        )
        
        return (total_errors / self.metrics['total_requests']) * 100
    
    def reset_metrics(self):
        """Сброс метрик"""
        for key in self.metrics:
            self.metrics[key] = 0


# Глобальные экземпляры
error_logger = ErrorLogger()
error_metrics = ErrorMetrics()


def log_error(error_type: str, error: Exception, context: Dict[str, Any] = None):
    """
    Удобная функция для логирования ошибок
    
    Args:
        error_type: Тип ошибки
        error: Объект ошибки
        context: Дополнительный контекст
    """
    error_metrics.increment_metric('total_requests')
    
    if error_type == 'validation':
        error_metrics.increment_metric('validation_errors')
        error_logger.log_validation_error(error, context)
    elif error_type == 'llm_request':
        error_metrics.increment_metric('llm_request_errors')
        error_logger.log_llm_request_error(error, context or {}, [])
    elif error_type == 'json_parse':
        error_metrics.increment_metric('json_parse_errors')
        error_logger.log_json_parse_error(error, '', context or {})
    else:
        error_logger.logger.error(f"Unknown error type: {error_type}, Error: {str(error)}")


def get_error_metrics() -> Dict[str, Any]:
    """
    Получение метрик ошибок
    
    Returns:
        Словарь с метриками ошибок
    """
    metrics = error_metrics.get_metrics()
    metrics['error_rate'] = error_metrics.get_error_rate()
    return metrics
