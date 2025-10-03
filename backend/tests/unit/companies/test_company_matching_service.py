"""
Unit тесты для CompanyMatchingService
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, mock_open
import yaml

from companies.models import Company
from companies.services import CompanyMatchingService

User = get_user_model()


class CompanyMatchingServiceTest(TestCase):
    """Тесты для CompanyMatchingService"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Создаем тестовые компании
        self.companies = [
            Company.objects.create(
                name='Мосфильм',
                company_type='production',
                description='Крупнейшая киностудия России',
                website='https://mosfilm.ru',
                email='info@mosfilm.ru',
                phone='+7-495-123-45-67',
                address='Москва, ул. Мосфильмовская, 1',
                founded_year=1924,
                is_active=True,
                created_by=self.user
            ),
            Company.objects.create(
                name='Ленфильм',
                company_type='production',
                description='Старейшая киностудия России',
                website='https://lenfilm.ru',
                email='info@lenfilm.ru',
                phone='+7-812-123-45-67',
                address='Санкт-Петербург, ул. Каменноостровский проспект, 10',
                founded_year=1918,
                is_active=True,
                created_by=self.user
            ),
            Company.objects.create(
                name='Студия Горького',
                company_type='production',
                description='Киностудия им. М. Горького',
                website='https://gorkyfilm.ru',
                email='info@gorkyfilm.ru',
                phone='+7-495-234-56-78',
                address='Москва, ул. Сергея Эйзенштейна, 8',
                founded_year=1915,
                is_active=True,
                created_by=self.user
            ),
            Company.objects.create(
                name='Мосфильм Дистрибуция',
                company_type='distribution',
                description='Дистрибьюторская компания Мосфильма',
                website='https://distribution.mosfilm.ru',
                email='distribution@mosfilm.ru',
                phone='+7-495-345-67-89',
                address='Москва, ул. Мосфильмовская, 1',
                founded_year=2000,
                is_active=True,
                created_by=self.user
            ),
            Company.objects.create(
                name='Неактивная компания',
                company_type='production',
                description='Неактивная компания для тестов',
                website='https://inactive.ru',
                email='info@inactive.ru',
                phone='+7-495-999-99-99',
                address='Москва, ул. Тестовая, 1',
                founded_year=2020,
                is_active=False,  # Неактивная
                created_by=self.user
            )
        ]
        
        # Мокаем конфигурацию
        self.mock_config = {
            'search': {
                'fuzzy_matching': {
                    'rapidfuzz': {
                        'scorer': 'fuzz.ratio'
                    }
                },
                'text_normalization': {
                    'to_lowercase': True,
                    'remove_punctuation': False,
                    'remove_extra_spaces': True
                },
                'thresholds': {
                    'companies': {
                        'production': 0.6,
                        'distribution': 0.7,
                        'post_production': 0.8,
                        'other': 0.5
                    }
                },
                'field_weights': {
                    'companies': {
                        'name': 1.0,
                        'website': 0.8,
                        'email': 0.6,
                        'phone': 0.4,
                        'description': 0.3
                    }
                }
            }
        }
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_load_config(self, mock_yaml_load, mock_file):
        """Тест загрузки конфигурации"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        self.assertEqual(service.config, self.mock_config)
        self.assertEqual(service.thresholds, self.mock_config['search']['thresholds']['companies'])
        self.assertEqual(service.field_weights, self.mock_config['search']['field_weights']['companies'])
    
    def test_normalize_text(self):
        """Тест нормализации текста"""
        service = CompanyMatchingService()
        service.config = self.mock_config
        service.thresholds = self.mock_config['search']['thresholds']['companies']
        service.field_weights = self.mock_config['search']['field_weights']['companies']
        
        # Тест нормализации
        self.assertEqual(service._normalize_text('  Мосфильм  '), 'мосфильм')
        self.assertEqual(service._normalize_text('МОСФИЛЬМ'), 'мосфильм')
        self.assertEqual(service._normalize_text('Мос-фильм'), 'мос-фильм')
        self.assertEqual(service._normalize_text(''), '')
    
    def test_calculate_field_score(self):
        """Тест расчета оценки схожести для поля"""
        service = CompanyMatchingService()
        service.config = self.mock_config
        service.thresholds = self.mock_config['search']['thresholds']['companies']
        service.field_weights = self.mock_config['search']['field_weights']['companies']
        
        # Тест точного совпадения
        score = service._calculate_field_score('name', 'Мосфильм', 'Мосфильм')
        self.assertAlmostEqual(score, 1.0, places=2)
        
        # Тест частичного совпадения
        score = service._calculate_field_score('name', 'Мосфильм', 'Мос-фильм')
        self.assertGreater(score, 0.5)
        
        # Тест с весом поля
        score = service._calculate_field_score('website', 'mosfilm.ru', 'mosfilm.ru')
        self.assertAlmostEqual(score, 0.8, places=2)  # вес website = 0.8
    
    def test_get_confidence_level(self):
        """Тест определения уровня уверенности"""
        service = CompanyMatchingService()
        service.config = self.mock_config
        service.thresholds = self.mock_config['search']['thresholds']['companies']
        service.field_weights = self.mock_config['search']['field_weights']['companies']
        
        # Тест высокого уровня уверенности
        self.assertEqual(service._get_confidence_level(0.95), 'high')
        self.assertEqual(service._get_confidence_level(0.9), 'high')
        
        # Тест среднего уровня уверенности
        self.assertEqual(service._get_confidence_level(0.7), 'medium')
        self.assertEqual(service._get_confidence_level(0.6), 'medium')
        
        # Тест низкого уровня уверенности
        self.assertEqual(service._get_confidence_level(0.5), 'low')
        self.assertEqual(service._get_confidence_level(0.3), 'low')
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_search_by_name(self, mock_yaml_load, mock_file):
        """Тест поиска по названию"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        # Тест поиска точного совпадения
        matches = service.search_by_name('Мосфильм', limit=3)
        self.assertGreater(len(matches), 0)
        self.assertEqual(matches[0]['name'], 'Мосфильм')
        self.assertEqual(matches[0]['confidence'], 'high')
        
        # Тест поиска частичного совпадения
        matches = service.search_by_name('фильм', limit=3)
        self.assertGreater(len(matches), 0)
        # Должны найтись компании с "фильм" в названии
        found_names = [match['name'] for match in matches]
        self.assertTrue(any('фильм' in name.lower() for name in found_names))
        
        # Тест поиска с типом компании (через search_matches)
        search_data = {'name': 'Мосфильм'}
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        # Проверяем, что найдены компании с нужным типом
        found_types = [match['company_type'] for match in matches]
        self.assertTrue(any(t in found_types for t in ['production', 'distribution']))
        
        # Тест ограничения результатов
        matches = service.search_by_name('фильм', limit=2)
        self.assertLessEqual(len(matches), 2)
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_search_matches(self, mock_yaml_load, mock_file):
        """Тест поиска по нескольким критериям"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        # Тест поиска по названию и email
        search_data = {
            'name': 'Мосфильм',
            'email': 'info@mosfilm.ru'
        }
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        
        # Проверяем, что найдены совпадения по нескольким полям
        best_match = matches[0]
        self.assertIn('matched_fields', best_match)
        self.assertGreater(len(best_match['matched_fields']), 0)
        
        # Тест поиска только по email
        search_data = {
            'email': 'info@mosfilm.ru'
        }
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        self.assertEqual(matches[0]['email'], 'info@mosfilm.ru')
        
        # Тест поиска с типом компании
        search_data = {
            'name': 'фильм'
        }
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        # Проверяем, что найдены компании с нужным типом
        found_types = [match['company_type'] for match in matches]
        self.assertTrue(any(t in found_types for t in ['production', 'distribution']))
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_get_companies_by_type(self, mock_yaml_load, mock_file):
        """Тест получения компаний по типу"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        # Тест получения production компаний
        companies = service.get_companies_by_type('production')
        self.assertEqual(len(companies), 3)  # Мосфильм, Ленфильм, Студия Горького
        for company in companies:
            self.assertEqual(company.company_type, 'production')
            self.assertTrue(company.is_active)
        
        # Тест получения distribution компаний
        companies = service.get_companies_by_type('distribution')
        self.assertEqual(len(companies), 1)  # Мосфильм Дистрибуция
        self.assertEqual(companies[0].name, 'Мосфильм Дистрибуция')
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_get_company_types(self, mock_yaml_load, mock_file):
        """Тест получения типов компаний"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        types = service.get_company_types()
        self.assertIsInstance(types, list)
        self.assertGreater(len(types), 0)
        
        # Проверяем структуру типов
        for company_type in types:
            self.assertIn('value', company_type)
            self.assertIn('label', company_type)
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_empty_search_results(self, mock_yaml_load, mock_file):
        """Тест пустых результатов поиска"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        # Тест поиска несуществующей компании
        matches = service.search_by_name('Несуществующая компания', limit=3)
        self.assertEqual(len(matches), 0)
    
    @patch('companies.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_inactive_companies_excluded(self, mock_yaml_load, mock_file):
        """Тест исключения неактивных компаний"""
        mock_yaml_load.return_value = self.mock_config
        
        service = CompanyMatchingService()
        
        # Поиск должен исключать неактивные компании
        matches = service.search_by_name('Неактивная', limit=3)
        self.assertEqual(len(matches), 0)
        
        # Получение по типу также должно исключать неактивные
        companies = service.get_companies_by_type('production')
        company_names = [c.name for c in companies]
        self.assertNotIn('Неактивная компания', company_names)
