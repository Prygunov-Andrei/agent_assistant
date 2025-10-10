"""
Юнит-тесты для LLM Service (основной сервис)
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from llm.services import LLMService, LLMEmulatorService


class TestLLMService:
    """Тесты для LLMService"""
    
    @patch('llm.services.settings.OPENAI_API_KEY', None)
    def test_initialization_without_api_key(self):
        """Тест инициализации без API ключа - должен использоваться только эмулятор"""
        service = LLMService()
        
        assert service.emulator is not None
        assert service.openai_service is None
    
    @patch('llm.services.settings.OPENAI_API_KEY', 'test-key')
    @patch('llm.services.LLMService._load_config')
    @patch('llm.openai_service.OpenAIService')
    def test_initialization_with_api_key_emulator_disabled(self, mock_openai_service, mock_load_config):
        """Тест инициализации с API ключом и отключенным эмулятором"""
        mock_load_config.return_value = {'llm': {'use_emulator': False}}
        
        service = LLMService()
        
        assert service.emulator is not None
        assert service.openai_service is not None
    
    @patch('llm.services.settings.OPENAI_API_KEY', 'test-key')
    @patch('llm.services.LLMService._load_config')
    def test_initialization_with_api_key_emulator_enabled(self, mock_load_config):
        """Тест инициализации с API ключом но эмулятор включен"""
        mock_load_config.return_value = {'llm': {'use_emulator': True}}
        
        service = LLMService()
        
        assert service.emulator is not None
        assert service.openai_service is None
    
    @patch('llm.services.settings.OPENAI_API_KEY', None)
    def test_analyze_request_with_emulator(self):
        """Тест анализа запроса через эмулятор"""
        service = LLMService()
        
        request_data = {
            'id': 123,
            'text': 'Тестовый запрос для кастинга'
        }
        
        result = service.analyze_request(request_data, [])
        
        assert result is not None
        assert 'project_analysis' in result
        assert 'contacts' in result
        assert result['used_emulator'] == True
    
    @patch('llm.services.settings.OPENAI_API_KEY', 'test-key')
    @patch('llm.services.LLMService._load_config')
    @patch('llm.openai_service.OpenAIService')
    def test_analyze_request_with_openai(self, mock_openai_service_class, mock_load_config):
        """Тест анализа запроса через OpenAI"""
        mock_load_config.return_value = {'llm': {'use_emulator': False}}
        
        # Мок OpenAI сервиса
        mock_openai_instance = Mock()
        mock_openai_instance.analyze_request.return_value = {
            'project_analysis': {'project_title': 'OpenAI Результат'},
            'contacts': {},
            'confidence': 0.9,
            'used_emulator': False,
            'model': 'gpt-4o'
        }
        mock_openai_service_class.return_value = mock_openai_instance
        
        service = LLMService()
        
        request_data = {
            'id': 123,
            'text': 'Тестовый запрос'
        }
        
        result = service.analyze_request(request_data, [])
        
        assert result['used_emulator'] == False
        assert result['model'] == 'gpt-4o'
        assert mock_openai_instance.analyze_request.called
    
    @patch('llm.services.settings.OPENAI_API_KEY', 'test-key')
    @patch('llm.services.LLMService._load_config')
    @patch('llm.openai_service.OpenAIService')
    def test_analyze_request_openai_fallback_to_emulator(self, mock_openai_service_class, mock_load_config):
        """Тест fallback на эмулятор при ошибке OpenAI"""
        mock_load_config.return_value = {'llm': {'use_emulator': False}}
        
        # Мок OpenAI сервиса с ошибкой
        mock_openai_instance = Mock()
        mock_openai_instance.analyze_request.side_effect = Exception("OpenAI API Error")
        mock_openai_service_class.return_value = mock_openai_instance
        
        service = LLMService()
        
        request_data = {
            'id': 123,
            'text': 'Тестовый запрос'
        }
        
        result = service.analyze_request(request_data, [])
        
        # Должен вернуться результат от эмулятора
        assert result is not None
        assert result['used_emulator'] == True
    
    @patch('llm.services.settings.OPENAI_API_KEY', None)
    def test_test_connection_emulator_only(self):
        """Тест подключения когда доступен только эмулятор"""
        service = LLMService()
        
        result = service.test_connection()
        
        assert result['emulator_available'] == True
        assert result['openai_available'] == False
        assert result['current_mode'] == 'emulator'
    
    @patch('llm.services.settings.OPENAI_API_KEY', 'test-key')
    @patch('llm.services.LLMService._load_config')
    @patch('llm.openai_service.OpenAIService')
    def test_test_connection_with_openai(self, mock_openai_service_class, mock_load_config):
        """Тест подключения когда доступен OpenAI"""
        mock_load_config.return_value = {'llm': {'use_emulator': False}}
        
        mock_openai_instance = Mock()
        mock_openai_instance.test_connection.return_value = True
        mock_openai_service_class.return_value = mock_openai_instance
        
        service = LLMService()
        result = service.test_connection()
        
        assert result['emulator_available'] == True
        assert result['openai_available'] == True
        assert result['current_mode'] == 'openai'
    
    @patch('llm.services.settings.OPENAI_API_KEY', None)
    def test_get_service_info_emulator(self):
        """Тест получения информации о сервисе (эмулятор)"""
        service = LLMService()
        
        info = service.get_service_info()
        
        assert info['service'] == 'emulator'
        assert 'config' in info
    
    @patch('llm.services.settings.OPENAI_API_KEY', 'test-key')
    @patch('llm.services.LLMService._load_config')
    @patch('llm.openai_service.OpenAIService')
    def test_get_service_info_openai(self, mock_openai_service_class, mock_load_config):
        """Тест получения информации о сервисе (OpenAI)"""
        mock_load_config.return_value = {'llm': {'use_emulator': False}}
        
        mock_openai_instance = Mock()
        mock_openai_instance.get_model_info.return_value = {
            'model': 'gpt-4o',
            'temperature': 0.3
        }
        mock_openai_service_class.return_value = mock_openai_instance
        
        service = LLMService()
        info = service.get_service_info()
        
        assert info['service'] == 'openai'
        assert 'model_info' in info
        assert info['model_info']['model'] == 'gpt-4o'


class TestLLMEmulatorService:
    """Тесты для LLMEmulatorService"""
    
    def test_initialization(self):
        """Тест инициализации эмулятора"""
        service = LLMEmulatorService()
        
        assert service.config is not None
        assert service.test_scenarios is not None
    
    def test_analyze_request_basic(self):
        """Тест базового анализа запроса"""
        service = LLMEmulatorService()
        
        request_data = {
            'id': 123,
            'text': 'Ищем актера для комедийного фильма'
        }
        
        result = service.analyze_request(request_data, [])
        
        assert result is not None
        assert 'project_analysis' in result
        assert 'contacts' in result
        assert 'confidence' in result
        assert result['used_emulator'] == True
    
    def test_analyze_request_returns_roles(self):
        """Тест что эмулятор возвращает роли"""
        service = LLMEmulatorService()
        
        request_data = {
            'id': 123,
            'text': 'Тестовый запрос'
        }
        
        result = service.analyze_request(request_data, [])
        
        assert 'roles' in result['project_analysis']
        assert len(result['project_analysis']['roles']) > 0
    
    def test_analyze_request_returns_all_role_fields(self):
        """Тест что эмулятор возвращает все поля роли"""
        service = LLMEmulatorService()
        
        request_data = {
            'id': 123,
            'text': 'Тестовый запрос'
        }
        
        result = service.analyze_request(request_data, [])
        role = result['project_analysis']['roles'][0]
        
        # Проверяем наличие всех важных полей
        required_fields = [
            'role_type', 'character_name', 'description',
            'age_min', 'age_max', 'gender', 'media_presence',
            'height', 'body_type', 'hair_color', 'eye_color',
            'hairstyle', 'clothing_size', 'shoe_size', 'nationality',
            'rate_per_shift', 'shooting_dates', 'shooting_location',
            'skills_required'
        ]
        
        for field in required_fields:
            assert field in role, f"Field '{field}' missing in role"
    
    def test_analyze_request_returns_contacts(self):
        """Тест что эмулятор возвращает контакты"""
        service = LLMEmulatorService()
        
        request_data = {
            'id': 123,
            'text': 'Тестовый запрос'
        }
        
        result = service.analyze_request(request_data, [])
        
        assert 'casting_director' in result['contacts']
        assert 'director' in result['contacts']
        assert 'producers' in result['contacts']
        assert 'production_company' in result['contacts']

