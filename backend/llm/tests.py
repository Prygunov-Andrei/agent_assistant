"""
Тесты для LLM сервисов
"""

import pytest
import json
from unittest.mock import patch, mock_open
from django.test import TestCase
from django.conf import settings

from .services import LLMEmulatorService, LLMService
from .validators import LLMResponseValidator, LLMRetryHandler, validate_llm_response


class TestLLMEmulatorService(TestCase):
    """Тесты для эмулятора LLM"""
    
    def setUp(self):
        self.emulator = LLMEmulatorService()
        self.sample_artists = [
            {'id': 1, 'name': 'Иван Иванов', 'gender': 'male'},
            {'id': 2, 'name': 'Мария Петрова', 'gender': 'female'},
            {'id': 3, 'name': 'Алексей Сидоров', 'gender': 'male'},
        ]
    
    def test_emulator_initialization(self):
        """Тест инициализации эмулятора"""
        self.assertIsNotNone(self.emulator.config)
        self.assertIsNotNone(self.emulator.test_scenarios)
        self.assertGreater(len(self.emulator.test_scenarios), 0)
    
    def test_detect_project_type_drama(self):
        """Тест определения драматического проекта"""
        text = "Нужен актер для драматического фильма"
        result = self.emulator._detect_project_type(text)
        
        self.assertEqual(result['project_type'], 'Фильм')
        self.assertEqual(result['genre'], 'Драма')
        self.assertEqual(result['template'], 'drama')
    
    def test_detect_project_type_comedy(self):
        """Тест определения комедийного проекта"""
        text = "Ищем актера для комедийный фильм"
        result = self.emulator._detect_project_type(text)
        
        self.assertEqual(result['project_type'], 'Фильм')
        self.assertEqual(result['genre'], 'Комедия')
        self.assertEqual(result['template'], 'comedy')
    
    def test_detect_project_type_series(self):
        """Тест определения сериала"""
        text = "Кастинг для сериала"
        result = self.emulator._detect_project_type(text)
        
        self.assertEqual(result['project_type'], 'Сериал')
        self.assertEqual(result['genre'], 'Драма')
        self.assertEqual(result['template'], 'series')
    
    def test_detect_project_type_default(self):
        """Тест определения проекта по умолчанию"""
        text = "Просто какой-то проект"
        result = self.emulator._detect_project_type(text)
        
        self.assertEqual(result['project_type'], 'Фильм')
        self.assertEqual(result['genre'], 'Драма')
        self.assertEqual(result['template'], 'default')
    
    def test_generate_roles_with_keywords(self):
        """Тест генерации ролей с ключевыми словами"""
        text = "Нужен главный герой и героиня"
        roles = self.emulator._generate_roles(text, self.sample_artists)
        
        self.assertGreater(len(roles), 0)
        self.assertTrue(any('главный' in role['character_name'].lower() for role in roles))
        self.assertTrue(any('героиня' in role['character_name'].lower() for role in roles))
    
    def test_generate_roles_default(self):
        """Тест генерации ролей по умолчанию"""
        text = "Простой запрос"
        roles = self.emulator._generate_roles(text, self.sample_artists)
        
        self.assertEqual(len(roles), 1)
        self.assertEqual(roles[0]['character_name'], 'Актер')
    
    def test_create_role_with_gender_filter(self):
        """Тест создания роли с фильтрацией по полу"""
        role = self.emulator._create_role('Героиня', 'female', self.sample_artists)
        
        self.assertEqual(role['character_name'], 'Героиня')
        self.assertEqual(role['gender'], 'female')
        self.assertGreater(len(role['suggested_artists']), 0)
        
        # Проверяем, что предложены только женские артисты
        suggested_genders = [
            artist['gender'] for artist in self.sample_artists 
            if artist['id'] in role['suggested_artists']
        ]
        self.assertTrue(all(gender == 'female' for gender in suggested_genders))
    
    def test_extract_contacts_basic(self):
        """Тест извлечения контактов"""
        request_data = {
            'text': 'Свяжитесь со мной по email: test@example.com',
            'author_name': 'Тестовый автор'
        }
        
        contacts = self.emulator._extract_contacts(request_data)
        
        self.assertIn('casting_director', contacts)
        self.assertEqual(contacts['casting_director']['name'], 'Тестовый автор')
        self.assertIn('director', contacts)
        self.assertIn('producers', contacts)
        self.assertIn('production_company', contacts)
    
    def test_extract_contacts_with_email(self):
        """Тест извлечения email из текста"""
        request_data = {
            'text': 'Мой email: director@studio.com для связи',
            'author_name': 'Режиссер'
        }
        
        contacts = self.emulator._extract_contacts(request_data)
        
        self.assertEqual(contacts['casting_director']['email'], 'director@studio.com')
        self.assertGreater(contacts['casting_director']['confidence'], 0.5)
    
    def test_extract_contacts_with_phone(self):
        """Тест извлечения телефона из текста"""
        request_data = {
            'text': 'Звоните по телефону +7(999)123-45-67',
            'author_name': 'Продюсер'
        }
        
        contacts = self.emulator._extract_contacts(request_data)
        
        self.assertIn('+7', contacts['casting_director']['phone'])
        self.assertGreater(contacts['casting_director']['confidence'], 0.5)
    
    def test_generate_project_title(self):
        """Тест генерации названия проекта"""
        title = self.emulator._generate_project_title('drama')
        
        self.assertIsInstance(title, str)
        self.assertGreater(len(title), 0)
    
    def test_generate_description(self):
        """Тест генерации описания проекта"""
        text = "Нужен актер для драмы"
        description = self.emulator._generate_description(text, 'drama')
        
        self.assertIsInstance(description, str)
        self.assertGreater(len(description), 0)
        self.assertIn('драма', description.lower())
    
    def test_generate_premiere_date(self):
        """Тест генерации даты премьеры"""
        date = self.emulator._generate_premiere_date()
        
        self.assertIsInstance(date, str)
        self.assertEqual(len(date), 10)  # YYYY-MM-DD format
        self.assertIn('-', date)
    
    def test_analyze_request_complete(self):
        """Тест полного анализа запроса"""
        request_data = {
            'text': 'Нужен актер для драматического фильма о любви. Свяжитесь: director@film.com',
            'author_name': 'Кастинг-директор'
        }
        
        result = self.emulator.analyze_request(request_data, self.sample_artists)
        
        # Проверяем структуру ответа
        self.assertIn('project_analysis', result)
        project = result['project_analysis']
        
        # Проверяем обязательные поля
        self.assertIn('project_title', project)
        self.assertIn('project_type', project)
        self.assertIn('genre', project)
        self.assertIn('description', project)
        self.assertIn('premiere_date', project)
        self.assertIn('roles', project)
        # Контакты теперь как отдельные поля
        self.assertIn('casting_director', project)
        self.assertIn('director', project)
        self.assertIn('producers', project)
        self.assertIn('production_company', project)
        self.assertIn('confidence', project)
        
        # Проверяем типы данных
        self.assertIsInstance(project['project_title'], str)
        self.assertIsInstance(project['project_type'], str)
        self.assertIsInstance(project['genre'], str)
        self.assertIsInstance(project['description'], str)
        self.assertIsInstance(project['premiere_date'], str)
        self.assertIsInstance(project['roles'], list)
        # Контакты теперь как отдельные поля
        self.assertIsInstance(project['casting_director'], dict)
        self.assertIsInstance(project['director'], dict)
        self.assertIsInstance(project['producers'], list)
        self.assertIsInstance(project['production_company'], dict)
        self.assertIsInstance(project['confidence'], (int, float))
        
        # Проверяем роли
        self.assertGreater(len(project['roles']), 0)
        for role in project['roles']:
            self.assertIn('character_name', role)
            self.assertIn('suggested_artists', role)
            self.assertIsInstance(role['suggested_artists'], list)
    
    def test_analyze_request_with_exception(self):
        """Тест обработки исключений в анализе"""
        # Передаем некорректные данные
        request_data = None
        artists_data = None
        
        result = self.emulator.analyze_request(request_data, artists_data)
        
        # Должен вернуться fallback ответ
        self.assertIn('project_analysis', result)
        self.assertEqual(result['project_analysis']['project_title'], 'Проект по запросу')
    
    def test_get_fallback_response(self):
        """Тест fallback ответа"""
        result = self.emulator._get_fallback_response()
        
        self.assertIn('project_analysis', result)
        project = result['project_analysis']
        
        # Проверяем, что все обязательные поля присутствуют
        required_fields = ['project_title', 'project_type', 'genre', 'description', 'premiere_date', 'roles', 'contacts']
        for field in required_fields:
            self.assertIn(field, project)
        
        # Проверяем, что есть хотя бы одна роль
        self.assertGreater(len(project['roles']), 0)


class TestLLMResponseValidator(TestCase):
    """Тесты для валидатора ответов LLM"""
    
    def setUp(self):
        self.validator = LLMResponseValidator()
        self.valid_response = {
            'project_analysis': {
                'project_title': 'Тестовый проект',
                'project_type': 'Фильм',
                'project_type_raw': 'Фильм',
                'genre': 'Драма',
                'description': 'Описание проекта',
                'premiere_date': '2024-12-31',
                'roles': [
                    {
                        'role_type': 'Актер',
                        'character_name': 'Главный герой',
                        'description': 'Описание роли',
                        'age_range': '25-35',
                        'gender': 'male',
                        'suggested_artists': [1, 2],
                        'skills_required': {
                            'acting_skills': ['драма'],
                            'physical_skills': [],
                            'languages': ['русский'],
                            'special_requirements': []
                        },
                        'confidence': 0.8
                    }
                ],
                'contacts': {
                    'casting_director': {
                        'name': 'Кастинг-директор',
                        'phone': '+7(999)123-45-67',
                        'email': 'casting@example.com',
                        'telegram': '@casting_director',
                        'confidence': 0.9
                    },
                    'director': {
                        'name': 'Режиссер',
                        'phone': '+7(999)123-45-68',
                        'email': 'director@example.com',
                        'telegram': '@director',
                        'confidence': 0.7
                    },
                    'producers': [],
                    'production_company': {
                        'name': 'Кинокомпания',
                        'phone': '+7(999)123-45-69',
                        'email': 'company@example.com',
                        'website': 'www.company.com',
                        'confidence': 0.6
                    }
                },
                'confidence': 0.8
            }
        }
    
    def test_validate_valid_response(self):
        """Тест валидации корректного ответа"""
        result = self.validator.validate_analysis_result(self.valid_response)
        self.assertTrue(result)
    
    def test_validate_empty_response(self):
        """Тест валидации пустого ответа"""
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result({})
    
    def test_validate_missing_project_title(self):
        """Тест валидации без названия проекта"""
        invalid_response = self.valid_response.copy()
        del invalid_response['project_analysis']['project_title']
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)
    
    def test_validate_missing_roles(self):
        """Тест валидации без ролей"""
        invalid_response = self.valid_response.copy()
        del invalid_response['project_analysis']['roles']
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)
    
    def test_validate_empty_roles(self):
        """Тест валидации с пустым списком ролей"""
        invalid_response = self.valid_response.copy()
        invalid_response['project_analysis']['roles'] = []
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)
    
    def test_validate_invalid_confidence(self):
        """Тест валидации некорректного confidence"""
        invalid_response = self.valid_response.copy()
        invalid_response['project_analysis']['confidence'] = 1.5  # > 1.0
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)
    
    def test_validate_invalid_role_confidence(self):
        """Тест валидации некорректного confidence роли"""
        invalid_response = self.valid_response.copy()
        invalid_response['project_analysis']['roles'][0]['confidence'] = -0.1  # < 0.0
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)
    
    def test_validate_invalid_suggested_artists(self):
        """Тест валидации некорректных suggested_artists"""
        invalid_response = self.valid_response.copy()
        invalid_response['project_analysis']['roles'][0]['suggested_artists'] = ['not_an_int']
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)
    
    def test_validate_missing_contact_fields(self):
        """Тест валидации без обязательных полей контактов"""
        invalid_response = self.valid_response.copy()
        del invalid_response['project_analysis']['contacts']['casting_director']['name']
        
        with self.assertRaises(Exception):
            self.validator.validate_analysis_result(invalid_response)


class TestLLMService(TestCase):
    """Тесты для основного LLM сервиса"""
    
    def setUp(self):
        self.service = LLMService()
        self.sample_artists = [
            {'id': 1, 'name': 'Иван Иванов', 'gender': 'male'},
            {'id': 2, 'name': 'Мария Петрова', 'gender': 'female'},
        ]
    
    def test_service_initialization(self):
        """Тест инициализации сервиса"""
        self.assertIsNotNone(self.service.config)
        self.assertIsNotNone(self.service.emulator)
    
    def test_analyze_request_with_emulator(self):
        """Тест анализа запроса через эмулятор"""
        request_data = {
            'text': 'Нужен актер для комедийный фильм',
            'author_name': 'Тестовый автор'
        }
        
        result = self.service.analyze_request(request_data, self.sample_artists)
        
        self.assertIn('project_analysis', result)
        self.assertEqual(result['project_analysis']['project_type'], 'Фильм')
        self.assertEqual(result['project_analysis']['genre'], 'Комедия')


class TestValidateLLMResponse(TestCase):
    """Тесты для функции validate_llm_response"""
    
    def test_validate_with_valid_response(self):
        """Тест валидации с корректным ответом"""
        valid_response = {
            'project_analysis': {
                'project_title': 'Тест',
                'project_type': 'Фильм',
                'genre': 'Драма',
                'description': 'Тестовое описание',
                'roles': [{
                    'role_type': 'Актер',
                    'character_name': 'Герой',
                    'description': 'Описание роли',
                    'age_range': '25-35',
                    'gender': 'male',
                    'suggested_artists': [1, 2],
                    'skills_required': {
                        'acting_skills': ['драма'],
                        'physical_skills': [],
                        'languages': ['русский'],
                        'special_requirements': []
                    }
                }]
            }
        }
        
        result = validate_llm_response(valid_response)
        self.assertTrue(result)
    
    def test_validate_with_invalid_response(self):
        """Тест валидации с некорректным ответом"""
        invalid_response = {
            'project_analysis': {
                'project_title': '',  # Пустое название
                'project_type': 'Фильм',
                'roles': []
            }
        }
        
        with self.assertRaises(Exception):
            validate_llm_response(invalid_response)
