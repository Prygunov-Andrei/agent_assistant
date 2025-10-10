"""
Юнит-тесты для OpenAI Service
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from llm.openai_service import OpenAIService
from openai import OpenAIError
import json


class TestOpenAIService:
    """Тесты для OpenAIService"""
    
    @pytest.fixture
    def mock_openai_response(self):
        """Мок ответа от OpenAI API"""
        mock_response = Mock()
        mock_response.choices = [
            Mock(
                message=Mock(
                    content=json.dumps({
                        'project_analysis': {
                            'project_title': 'Тестовый проект',
                            'project_type': 'Фильм',
                            'project_type_raw': 'фильм',
                            'genre': 'Комедия',
                            'description': 'Тестовое описание',
                            'premiere_date': '2025-12-31',
                            'roles': [
                                {
                                    'role_type': 'Актер',
                                    'character_name': 'Тестовая роль',
                                    'description': 'Описание роли',
                                    'age_min': 25,
                                    'age_max': 35,
                                    'gender': 'male',
                                    'media_presence': 'doesnt_matter',
                                    'skills_required': {
                                        'acting_skills': ['Актерское мастерство'],
                                        'special_skills': []
                                    },
                                    'confidence': 0.9
                                }
                            ],
                            'confidence': 0.85
                        },
                        'contacts': {
                            'casting_director': {
                                'name': 'Тестовый КД',
                                'email': 'test@test.com',
                                'phone': '+7-900-000-00-00',
                                'telegram': '@test',
                                'confidence': 0.9
                            },
                            'director': {
                                'name': 'неопределено',
                                'confidence': 0.0
                            },
                            'producers': [],
                            'production_company': {
                                'name': 'неопределено',
                                'confidence': 0.0
                            }
                        },
                        'confidence': 0.85,
                        'errors': []
                    })
                )
            )
        ]
        return mock_response
    
    @patch('llm.openai_service.OpenAI')
    def test_initialization_with_api_key(self, mock_openai_class):
        """Тест инициализации с API ключом"""
        service = OpenAIService(api_key='test-key')
        
        assert service.api_key == 'test-key'
        assert service.model == 'gpt-4o'
        assert service.temperature == 0.3
        assert service.max_tokens == 4000
        mock_openai_class.assert_called_once_with(api_key='test-key')
    
    @patch('llm.openai_service.OpenAI')
    def test_load_prompt(self, mock_openai_class):
        """Тест загрузки промпта"""
        service = OpenAIService(api_key='test-key')
        
        assert service.prompt is not None
        assert len(service.prompt) > 0
        assert 'кастинг' in service.prompt.lower()
    
    @patch('llm.openai_service.OpenAI')
    def test_load_schema(self, mock_openai_class):
        """Тест загрузки JSON схемы"""
        service = OpenAIService(api_key='test-key')
        
        assert service.schema is not None
        assert 'properties' in service.schema
        assert 'project_analysis' in service.schema['properties']
    
    @patch('llm.openai_service.LLMResponseValidator')
    @patch('llm.openai_service.OpenAI')
    def test_analyze_request_success(self, mock_openai_class, mock_validator_class, mock_openai_response):
        """Тест успешного анализа запроса"""
        # Настройка мока OpenAI
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_openai_response
        mock_openai_class.return_value = mock_client
        
        # Настройка мока валидатора
        mock_validator = Mock()
        mock_validator.validate.return_value = {
            'project_analysis': {'project_title': 'Тестовый проект'},
            'contacts': {},
            'confidence': 0.85,
            'errors': []
        }
        mock_validator_class.return_value = mock_validator
        
        # Создаем сервис и вызываем анализ
        service = OpenAIService(api_key='test-key')
        request_data = {
            'id': 123,
            'text': 'Ищем актера для комедийного фильма'
        }
        
        result = service.analyze_request(request_data, [])
        
        # Проверки
        assert result is not None
        assert 'project_analysis' in result
        assert result['project_analysis']['project_title'] == 'Тестовый проект'
        assert result['used_emulator'] == False
        assert result['model'] == 'gpt-4o'
        assert mock_client.chat.completions.create.called
    
    @patch('llm.openai_service.OpenAI')
    def test_analyze_request_empty_text(self, mock_openai_class):
        """Тест анализа с пустым текстом"""
        service = OpenAIService(api_key='test-key')
        request_data = {'id': 123, 'text': ''}
        
        with pytest.raises(ValueError, match="Request text is empty"):
            service.analyze_request(request_data, [])
    
    @patch('llm.openai_service.OpenAI')
    def test_call_openai_with_retry_success(self, mock_openai_class, mock_openai_response):
        """Тест успешного вызова OpenAI с первой попытки"""
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_openai_response
        mock_openai_class.return_value = mock_client
        
        service = OpenAIService(api_key='test-key')
        response = service._call_openai_with_retry("Test prompt")
        
        assert response == mock_openai_response
        assert mock_client.chat.completions.create.call_count == 1
    
    @patch('llm.openai_service.OpenAI')
    def test_call_openai_with_retry_failure(self, mock_openai_class):
        """Тест вызова OpenAI с исчерпанием retry попыток"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = OpenAIError("API Error")
        mock_openai_class.return_value = mock_client
        
        service = OpenAIService(api_key='test-key')
        
        with pytest.raises(OpenAIError):
            service._call_openai_with_retry("Test prompt")
        
        # Должно быть 4 попытки (первая + 3 retry)
        assert mock_client.chat.completions.create.call_count == 4
    
    @patch('llm.openai_service.OpenAI')
    def test_call_openai_with_retry_success_on_second_attempt(self, mock_openai_class, mock_openai_response):
        """Тест успешного вызова OpenAI со второй попытки"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = [
            OpenAIError("Temporary error"),
            mock_openai_response
        ]
        mock_openai_class.return_value = mock_client
        
        service = OpenAIService(api_key='test-key')
        response = service._call_openai_with_retry("Test prompt")
        
        assert response == mock_openai_response
        assert mock_client.chat.completions.create.call_count == 2
    
    @patch('llm.openai_service.OpenAI')
    def test_parse_response_success(self, mock_openai_class, mock_openai_response):
        """Тест парсинга ответа"""
        service = OpenAIService(api_key='test-key')
        result = service._parse_response(mock_openai_response)
        
        assert isinstance(result, dict)
        assert 'project_analysis' in result
        assert 'contacts' in result
    
    @patch('llm.openai_service.OpenAI')
    def test_parse_response_invalid_json(self, mock_openai_class):
        """Тест парсинга невалидного JSON"""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Invalid JSON {"))]
        
        service = OpenAIService(api_key='test-key')
        
        with pytest.raises(Exception):  # JSONDecodeError или другая ошибка
            service._parse_response(mock_response)
    
    @patch('llm.openai_service.OpenAI')
    def test_test_connection_success(self, mock_openai_class):
        """Тест успешного подключения"""
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = Mock()
        mock_openai_class.return_value = mock_client
        
        service = OpenAIService(api_key='test-key')
        result = service.test_connection()
        
        assert result == True
    
    @patch('llm.openai_service.OpenAI')
    def test_test_connection_failure(self, mock_openai_class):
        """Тест неудачного подключения"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = OpenAIError("Connection failed")
        mock_openai_class.return_value = mock_client
        
        service = OpenAIService(api_key='test-key')
        result = service.test_connection()
        
        assert result == False
    
    @patch('llm.openai_service.OpenAI')
    def test_get_model_info(self, mock_openai_class):
        """Тест получения информации о модели"""
        service = OpenAIService(api_key='test-key')
        info = service.get_model_info()
        
        assert 'model' in info
        assert 'temperature' in info
        assert 'max_tokens' in info
        assert info['model'] == 'gpt-4o'
        assert info['temperature'] == 0.3

