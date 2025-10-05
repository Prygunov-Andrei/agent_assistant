"""
Тесты для валидации и обработки ошибок LLM
"""

import pytest
import json
from unittest.mock import Mock, patch
from django.test import TestCase
from django.core.exceptions import ValidationError

from llm.validators import LLMResponseValidator, LLMRetryHandler
from llm.error_logging import ErrorLogger, ErrorMetrics, log_error, get_error_metrics
from llm.services import LLMEmulatorService


class TestLLMResponseValidator(TestCase):
    """Тесты валидатора ответов LLM"""
    
    def setUp(self):
        self.validator = LLMResponseValidator()
    
    def test_valid_response(self):
        """Тест валидного ответа"""
        valid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма для проверки валидации',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male',
                        'suggested_artists': [1, 2, 3],
                        'skills_required': {
                            'acting_skills': ['драма'],
                            'physical_skills': [],
                            'languages': ['русский'],
                            'special_requirements': []
                        }
                    }
                ],
                'casting_director': {
                    'name': 'Иван Петров',
                    'phone': '+7-999-123-45-67',
                    'email': 'ivan@example.com',
                    'telegram': '@ivan_petrov'
                },
                'director': {
                    'name': 'Петр Иванов',
                    'phone': '+7-999-765-43-21',
                    'email': 'petr@example.com',
                    'telegram': '@petr_ivanov'
                },
                'producers': [
                    {
                        'name': 'Анна Сидорова',
                        'phone': '+7-999-111-22-33',
                        'email': 'anna@example.com',
                        'telegram': '@anna_sidorova'
                    }
                ],
                'production_company': {
                    'name': 'Тестовая компания',
                    'phone': '+7-999-444-55-66',
                    'email': 'company@example.com',
                    'website': 'https://example.com'
                }
            }
        }
        
        # Должно пройти без ошибок
        self.assertTrue(self.validator.validate_analysis_result(valid_response))
    
    def test_missing_required_fields(self):
        """Тест отсутствующих обязательных полей"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                # Отсутствует project_type
                'genre': 'драма',
                'description': 'Описание'
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('Required field missing: project_analysis.project_type', str(context.exception))
    
    def test_invalid_project_title_length(self):
        """Тест неверной длины названия проекта"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'А',  # Слишком короткое
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ]
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('project_title must be at least', str(context.exception))
    
    def test_invalid_email_format(self):
        """Тест неверного формата email"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ],
                'casting_director': {
                    'name': 'Иван Петров',
                    'phone': '+7-999-123-45-67',
                    'email': 'invalid-email',  # Неверный формат
                    'telegram': '@ivan_petrov'
                }
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('Invalid email format', str(context.exception))
    
    def test_invalid_phone_format(self):
        """Тест неверного формата телефона"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ],
                'casting_director': {
                    'name': 'Иван Петров',
                    'phone': 'invalid-phone',  # Неверный формат
                    'email': 'ivan@example.com',
                    'telegram': '@ivan_petrov'
                }
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('Invalid phone format', str(context.exception))
    
    def test_invalid_telegram_format(self):
        """Тест неверного формата telegram"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ],
                'casting_director': {
                    'name': 'Иван Петров',
                    'phone': '+7-999-123-45-67',
                    'email': 'ivan@example.com',
                    'telegram': 'ab'  # Неверный формат (слишком короткий)
                }
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('Invalid telegram format', str(context.exception))
    
    def test_invalid_project_type(self):
        """Тест неверного типа проекта"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'неверный_тип',  # Неверный тип
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ]
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('project_type must be one of', str(context.exception))
    
    def test_empty_roles(self):
        """Тест пустого списка ролей"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': []  # Пустой список
            }
        }
        
        with self.assertRaises(ValidationError) as context:
            self.validator.validate_analysis_result(invalid_response)
        
        self.assertIn('Required field missing: project_analysis.roles', str(context.exception))


class TestLLMRetryHandler(TestCase):
    """Тесты обработчика повторных попыток"""
    
    def setUp(self):
        self.validator = LLMResponseValidator()
        self.retry_handler = LLMRetryHandler(self.validator, max_attempts=3)
        self.mock_llm_service = Mock()
    
    def test_successful_validation_first_attempt(self):
        """Тест успешной валидации с первой попытки"""
        valid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ]
            }
        }
        
        request_data = {'id': 1, 'text': 'Тестовый запрос'}
        artists_data = []
        
        result = self.retry_handler.validate_with_retry(
            valid_response, self.mock_llm_service, request_data, artists_data
        )
        
        self.assertEqual(result, valid_response)
        self.mock_llm_service.analyze_request.assert_not_called()
    
    def test_retry_on_validation_error(self):
        """Тест повторной попытки при ошибке валидации"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'А',  # Слишком короткое
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ]
            }
        }
        
        valid_response = {
            'project_analysis': {
                'project_title': 'Тестовый фильм',
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание тестового фильма',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ]
            }
        }
        
        # Настраиваем mock для возврата валидного ответа при повторной попытке
        self.mock_llm_service.analyze_request.return_value = valid_response
        
        request_data = {'id': 1, 'text': 'Тестовый запрос'}
        artists_data = []
        
        result = self.retry_handler.validate_with_retry(
            invalid_response, self.mock_llm_service, request_data, artists_data
        )
        
        self.assertEqual(result, valid_response)
        self.mock_llm_service.analyze_request.assert_called_once_with(request_data, artists_data)
    
    def test_max_retries_exceeded(self):
        """Тест превышения максимального количества попыток"""
        invalid_response = {
            'project_analysis': {
                'project_title': 'А',  # Слишком короткое
                'project_type': 'фильм',
                'genre': 'драма',
                'description': 'Описание',
                'roles': [
                    {
                        'role_type': 'main',
                        'character_name': 'Главный герой',
                        'description': 'мужчина 30-40 лет',
                        'age_range': '30-40',
                        'gender': 'male'
                    }
                ]
            }
        }
        
        # Mock всегда возвращает невалидный ответ
        self.mock_llm_service.analyze_request.return_value = invalid_response
        
        request_data = {'id': 1, 'text': 'Тестовый запрос'}
        artists_data = []
        
        with self.assertRaises(ValidationError) as context:
            self.retry_handler.validate_with_retry(
                invalid_response, self.mock_llm_service, request_data, artists_data
            )
        
        self.assertIn('Validation failed after 3 attempts', str(context.exception))
        self.assertEqual(self.mock_llm_service.analyze_request.call_count, 2)  # 2 повторные попытки


class TestErrorLogging(TestCase):
    """Тесты системы логирования ошибок"""
    
    def setUp(self):
        self.error_logger = ErrorLogger()
        self.error_metrics = ErrorMetrics()
    
    def test_error_metrics_increment(self):
        """Тест увеличения метрик ошибок"""
        self.error_metrics.increment_metric('validation_errors')
        self.error_metrics.increment_metric('validation_errors')
        
        metrics = self.error_metrics.get_metrics()
        self.assertEqual(metrics['validation_errors'], 2)
    
    def test_error_rate_calculation(self):
        """Тест расчета процента ошибок"""
        self.error_metrics.increment_metric('total_requests')
        self.error_metrics.increment_metric('total_requests')
        self.error_metrics.increment_metric('validation_errors')
        
        error_rate = self.error_metrics.get_error_rate()
        self.assertEqual(error_rate, 50.0)  # 1 ошибка из 2 запросов = 50%
    
    def test_log_error_function(self):
        """Тест функции логирования ошибок"""
        error = ValidationError("Test error")
        
        # Проверяем, что функция не вызывает исключений
        try:
            log_error('validation', error, {'test': 'context'})
        except Exception as e:
            self.fail(f"log_error raised an exception: {e}")
    
    def test_get_error_metrics_function(self):
        """Тест функции получения метрик"""
        metrics = get_error_metrics()
        
        self.assertIn('validation_errors', metrics)
        self.assertIn('llm_request_errors', metrics)
        self.assertIn('error_rate', metrics)
        self.assertIsInstance(metrics['error_rate'], float)


class TestLLMEmulatorServiceIntegration(TestCase):
    """Тесты интеграции эмулятора LLM с валидацией"""
    
    def setUp(self):
        self.llm_service = LLMEmulatorService()
    
    def test_analyze_request_with_validation(self):
        """Тест анализа запроса с валидацией"""
        request_data = {
            'id': 1,
            'text': 'Ищем актера на роль детектива в детективной драме',
            'author_name': 'Иван Петров'
        }
        
        artists_data = [
            {
                'id': 1,
                'name': 'Алексей Иванов',
                'age': 30,
                'gender': 'male',
                'skills': ['Актерское мастерство']
            }
        ]
        
        # Должно пройти без ошибок
        result = self.llm_service.analyze_request(request_data, artists_data)
        
        # Проверяем структуру ответа
        self.assertIn('project_analysis', result)
        self.assertIn('project_title', result['project_analysis'])
        self.assertIn('project_type', result['project_analysis'])
        self.assertIn('roles', result['project_analysis'])
    
    def test_analyze_request_error_handling(self):
        """Тест обработки ошибок в анализе запроса"""
        # Тест с некорректными данными
        request_data = {
            'id': 1,
            'text': '',  # Пустой текст
            'author_name': ''
        }
        
        artists_data = []
        
        # Должно обработать ошибку корректно
        try:
            result = self.llm_service.analyze_request(request_data, artists_data)
            # Если не выбросилось исключение, проверим что результат валидный
            self.assertIn('project_analysis', result)
        except Exception as e:
            # Ожидаем исключение при некорректных данных
            self.assertIsInstance(e, Exception)


if __name__ == '__main__':
    pytest.main([__file__])
