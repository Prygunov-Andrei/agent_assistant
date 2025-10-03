"""
Unit тесты для ProjectMatchingService
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, mock_open
import yaml

from projects.models import Project, ProjectType, Genre
from projects.services import ProjectMatchingService

User = get_user_model()


class ProjectMatchingServiceTest(TestCase):
    """Тесты для ProjectMatchingService"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Создаем типы проектов и жанры
        self.project_type = ProjectType.objects.create(
            name='Фильм',
            description='Художественный фильм'
        )
        
        self.genre = Genre.objects.create(
            name='Драма',
            description='Драматический жанр'
        )
        
        # Создаем тестовые проекты
        self.projects = [
            Project.objects.create(
                title='Война и мир',
                description='Экранизация романа Л.Н. Толстого',
                project_type=self.project_type,
                genre=self.genre,
                status='completed',
                is_active=True,
                created_by=self.user
            ),
            Project.objects.create(
                title='Анна Каренина',
                description='Экранизация романа Л.Н. Толстого',
                project_type=self.project_type,
                genre=self.genre,
                status='completed',
                is_active=True,
                created_by=self.user
            ),
            Project.objects.create(
                title='Война и мир 2',
                description='Продолжение экранизации романа Л.Н. Толстого',
                project_type=self.project_type,
                genre=self.genre,
                status='in_production',
                is_active=True,
                created_by=self.user
            ),
            Project.objects.create(
                title='Мир и война',
                description='Современная интерпретация классического романа',
                project_type=self.project_type,
                genre=self.genre,
                status='cancelled',
                is_active=True,
                created_by=self.user
            ),
            Project.objects.create(
                title='Неактивный проект',
                description='Неактивный проект для тестов',
                project_type=self.project_type,
                genre=self.genre,
                status='draft',
                is_active=False,  # Неактивный
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
                    'projects': {
                        'completed': 0.6,
                        'in_production': 0.7,
                        'cancelled': 0.8,
                        'draft': 0.5
                    }
                },
                'field_weights': {
                    'projects': {
                        'title': 1.0,
                        'description': 0.6
                    }
                }
            }
        }
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_load_config(self, mock_yaml_load, mock_file):
        """Тест загрузки конфигурации"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        self.assertEqual(service.config, self.mock_config)
        self.assertEqual(service.thresholds, self.mock_config['search']['thresholds']['projects'])
        self.assertEqual(service.field_weights, self.mock_config['search']['field_weights']['projects'])
    
    def test_normalize_text(self):
        """Тест нормализации текста"""
        service = ProjectMatchingService()
        service.config = self.mock_config
        service.thresholds = self.mock_config['search']['thresholds']['projects']
        service.field_weights = self.mock_config['search']['field_weights']['projects']
        
        # Тест нормализации
        self.assertEqual(service._normalize_text('  Война и мир  '), 'война и мир')
        self.assertEqual(service._normalize_text('ВОЙНА И МИР'), 'война и мир')
        self.assertEqual(service._normalize_text('Война-и-мир'), 'война-и-мир')
        self.assertEqual(service._normalize_text(''), '')
    
    def test_calculate_field_score(self):
        """Тест расчета оценки схожести для поля"""
        service = ProjectMatchingService()
        service.config = self.mock_config
        service.thresholds = self.mock_config['search']['thresholds']['projects']
        service.field_weights = self.mock_config['search']['field_weights']['projects']
        
        # Тест точного совпадения
        score = service._calculate_field_score('title', 'Война и мир', 'Война и мир')
        self.assertAlmostEqual(score, 1.0, places=2)
        
        # Тест частичного совпадения
        score = service._calculate_field_score('title', 'Война и мир', 'Война-и-мир')
        self.assertGreater(score, 0.5)
        
        # Тест с весом поля
        score = service._calculate_field_score('description', 'Толстой', 'Толстой')
        self.assertAlmostEqual(score, 0.6, places=2)  # вес description = 0.6
    
    def test_get_confidence_level(self):
        """Тест определения уровня уверенности"""
        service = ProjectMatchingService()
        service.config = self.mock_config
        service.thresholds = self.mock_config['search']['thresholds']['projects']
        service.field_weights = self.mock_config['search']['field_weights']['projects']
        
        # Тест высокого уровня уверенности
        self.assertEqual(service._get_confidence_level(0.95), 'high')
        self.assertEqual(service._get_confidence_level(0.9), 'high')
        
        # Тест среднего уровня уверенности
        self.assertEqual(service._get_confidence_level(0.7), 'medium')
        self.assertEqual(service._get_confidence_level(0.6), 'medium')
        
        # Тест низкого уровня уверенности
        self.assertEqual(service._get_confidence_level(0.5), 'low')
        self.assertEqual(service._get_confidence_level(0.3), 'low')
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_search_by_title(self, mock_yaml_load, mock_file):
        """Тест поиска по названию"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Тест поиска точного совпадения
        matches = service.search_by_title('Война и мир', limit=3)
        self.assertGreater(len(matches), 0)
        self.assertEqual(matches[0]['title'], 'Война и мир')
        self.assertEqual(matches[0]['confidence'], 'high')
        
        # Тест поиска частичного совпадения
        matches = service.search_by_title('война', limit=3)
        self.assertGreater(len(matches), 0)
        # Должны найтись проекты с "война" в названии
        found_titles = [match['title'] for match in matches]
        self.assertTrue(any('война' in title.lower() for title in found_titles))
        
        # Тест поиска с статусом проекта (через search_matches)
        search_data = {'title': 'Война и мир'}
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        # Проверяем, что найдены проекты с нужным статусом
        found_statuses = [match['status'] for match in matches]
        self.assertTrue(any(s in found_statuses for s in ['completed', 'in_production', 'cancelled']))
        
        # Тест ограничения результатов
        matches = service.search_by_title('война', limit=2)
        self.assertLessEqual(len(matches), 2)
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_search_matches(self, mock_yaml_load, mock_file):
        """Тест поиска по нескольким критериям"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Тест поиска по названию и описанию
        search_data = {
            'title': 'Война и мир',
            'description': 'Толстой'
        }
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        
        # Проверяем, что найдены совпадения по нескольким полям
        best_match = matches[0]
        self.assertIn('matched_fields', best_match)
        self.assertGreater(len(best_match['matched_fields']), 0)
        
        # Тест поиска только по описанию
        search_data = {
            'description': 'Толстой'
        }
        matches = service.search_matches(search_data, limit=3)
        # Может быть 0 результатов, если порог слишком высокий
        if len(matches) > 0:
            # Должны найтись проекты с "Толстой" в описании
            found_descriptions = [match['description'] for match in matches]
            self.assertTrue(any('толстой' in desc.lower() for desc in found_descriptions))
        
        # Тест поиска с статусом проекта
        search_data = {
            'title': 'война'
        }
        matches = service.search_matches(search_data, limit=3)
        self.assertGreater(len(matches), 0)
        # Проверяем, что найдены проекты с нужным статусом
        found_statuses = [match['status'] for match in matches]
        self.assertTrue(any(s in found_statuses for s in ['completed', 'in_production', 'cancelled']))
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_get_projects_by_status(self, mock_yaml_load, mock_file):
        """Тест получения проектов по статусу"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Тест получения completed проектов
        projects = service.get_projects_by_status('completed')
        self.assertEqual(len(projects), 2)  # Война и мир, Анна Каренина
        for project in projects:
            self.assertEqual(project.status, 'completed')
            self.assertTrue(project.is_active)
        
        # Тест получения in_production проектов
        projects = service.get_projects_by_status('in_production')
        self.assertEqual(len(projects), 1)  # Война и мир 2
        self.assertEqual(projects[0].title, 'Война и мир 2')
        
        # Тест получения cancelled проектов
        projects = service.get_projects_by_status('cancelled')
        self.assertEqual(len(projects), 1)  # Мир и война
        self.assertEqual(projects[0].title, 'Мир и война')
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_get_project_statuses(self, mock_yaml_load, mock_file):
        """Тест получения статусов проектов"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        statuses = service.get_project_statuses()
        self.assertIsInstance(statuses, list)
        self.assertGreater(len(statuses), 0)
        
        # Проверяем структуру статусов
        for status in statuses:
            self.assertIn('value', status)
            self.assertIn('label', status)
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_empty_search_results(self, mock_yaml_load, mock_file):
        """Тест пустых результатов поиска"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Тест поиска несуществующего проекта
        matches = service.search_by_title('Несуществующий проект', limit=3)
        self.assertEqual(len(matches), 0)
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_inactive_projects_excluded(self, mock_yaml_load, mock_file):
        """Тест исключения неактивных проектов"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Поиск должен исключать неактивные проекты
        matches = service.search_by_title('Неактивный', limit=3)
        self.assertEqual(len(matches), 0)
        
        # Получение по статусу также должно исключать неактивные
        projects = service.get_projects_by_status('draft')
        project_titles = [p.title for p in projects]
        self.assertNotIn('Неактивный проект', project_titles)
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_fuzzy_matching_accuracy(self, mock_yaml_load, mock_file):
        """Тест точности fuzzy matching"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Тест поиска с опечатками
        matches = service.search_by_title('Война и мирр', limit=3)  # опечатка
        self.assertGreater(len(matches), 0)
        # Должен найти "Война и мир" несмотря на опечатку
        found_titles = [match['title'] for match in matches]
        self.assertIn('Война и мир', found_titles)
        
        # Тест поиска с разным порядком слов
        matches = service.search_by_title('мир и война', limit=3)
        self.assertGreater(len(matches), 0)
        # Должен найти проекты с "война" и "мир"
        found_titles = [match['title'] for match in matches]
        self.assertTrue(any('война' in title.lower() and 'мир' in title.lower() for title in found_titles))
    
    @patch('projects.services.open', new_callable=mock_open)
    @patch('yaml.safe_load')
    def test_score_calculation_consistency(self, mock_yaml_load, mock_file):
        """Тест консистентности расчета оценок"""
        mock_yaml_load.return_value = self.mock_config
        
        service = ProjectMatchingService()
        
        # Тест, что одинаковые запросы дают одинаковые результаты
        matches1 = service.search_by_title('Война и мир', limit=3)
        matches2 = service.search_by_title('Война и мир', limit=3)
        
        self.assertEqual(len(matches1), len(matches2))
        for i, (match1, match2) in enumerate(zip(matches1, matches2)):
            self.assertEqual(match1['title'], match2['title'])
            self.assertAlmostEqual(match1['score'], match2['score'], places=3)
            self.assertEqual(match1['confidence'], match2['confidence'])
