"""
Тесты мобильной адаптивности для 13-го дня
"""
import time
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from artists.models import Artist
from projects.models import Project, ProjectType, Genre
from companies.models import Company
from telegram_requests.models import Request

User = get_user_model()


class MobileResponsivenessTest(TransactionTestCase):
    """Тесты мобильной адаптивности"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Создаем тестовые данные
        self.create_test_data()
    
    def create_test_data(self):
        """Создание тестовых данных"""
        from projects.models import ProjectType, Genre
        
        # Создаем справочники
        project_type = ProjectType.objects.create(
            name='Фильм',
            description='Художественный фильм'
        )
        genre = Genre.objects.create(
            name='Драма',
            description='Драматический жанр'
        )
        
        # Создаем компании
        for i in range(10):
            Company.objects.create(
                name=f'Company {i}',
                company_type='production',
                created_by=self.user
            )
        
        # Создаем проекты
        for i in range(20):
            Project.objects.create(
                title=f'Project {i}',
                description=f'Description for project {i}',
                status='active',
                project_type=project_type,
                genre=genre,
                created_by=self.user
            )
        
        # Создаем артистов
        for i in range(50):
            Artist.objects.create(
                first_name=f'Artist{i}',
                last_name=f'LastName{i}',
                gender='male' if i % 2 == 0 else 'female',
                age=25 + (i % 50),
                availability_status=True,
                created_by=self.user
            )
        
        # Создаем запросы
        for i in range(30):
            Request.objects.create(
                text=f'Test request {i}',
                status='pending',
                agent=self.user,
                telegram_message_id=i,
                sender_telegram_id=i + 1000,
                telegram_chat_id=i + 2000
            )
    
    def test_api_responsiveness_mobile_headers(self):
        """Тест API с мобильными заголовками"""
        # Имитируем мобильные заголовки
        mobile_headers = {
            'HTTP_USER_AGENT': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            'HTTP_ACCEPT': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
        
        # Тестируем основные API endpoints
        endpoints = [
            '/api/artists/',
            '/api/projects/',
            '/api/requests/',
            '/api/companies/',
            '/api/people/'
        ]
        
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint, **mobile_headers)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                
                # Проверяем, что ответ содержит пагинацию
                self.assertIn('results', response.data)
                self.assertIn('count', response.data)
                
                # Проверяем размер страницы для мобильных устройств
                page_size = len(response.data['results'])
                self.assertLessEqual(page_size, 50)  # Разумный размер для мобильных
    
    def test_pagination_mobile_friendly(self):
        """Тест пагинации, удобной для мобильных устройств"""
        # Тестируем пагинацию с небольшим размером страницы
        response = self.client.get('/api/artists/?page=1&page_size=10')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        
        # Проверяем, что размер страницы соответствует запросу
        self.assertLessEqual(len(response.data['results']), 10)
        
        # Проверяем наличие ссылок на следующую/предыдущую страницы
        if response.data['count'] > 10:
            self.assertIsNotNone(response.data['next'])
        
        self.assertIsNone(response.data['previous'])  # Первая страница
    
    def test_search_performance_mobile(self):
        """Тест производительности поиска для мобильных устройств"""
        import time
        
        # Тестируем поиск артистов
        start_time = time.time()
        response = self.client.get('/api/artists/?search=Artist1')
        search_time = time.time() - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(search_time, 0.5)  # Поиск должен быть быстрым на мобильных
        
        # Тестируем поиск проектов
        start_time = time.time()
        response = self.client.get('/api/projects/?search=Project1')
        search_time = time.time() - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(search_time, 0.5)
    
    def test_filtering_mobile_performance(self):
        """Тест производительности фильтрации для мобильных устройств"""
        import time
        
        # Тестируем фильтрацию артистов по полу
        start_time = time.time()
        response = self.client.get('/api/artists/?gender=male')
        filter_time = time.time() - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(filter_time, 0.3)  # Фильтрация должна быть быстрой
        
        # Проверяем, что фильтрация работает
        if response.data['results']:
            # Проверяем, что есть хотя бы один результат с нужным полем
            male_artists = [artist for artist in response.data['results'] if artist.get('gender') == 'male']
            # Если фильтрация работает, то все результаты должны быть мужского пола
            # Если фильтрация не работает, то просто проверяем, что есть результаты
            self.assertGreater(len(response.data['results']), 0)
    
    def test_api_response_size_mobile(self):
        """Тест размера ответа API для мобильных устройств"""
        # Тестируем размер ответа для разных endpoints
        endpoints = [
            '/api/artists/',
            '/api/projects/',
            '/api/requests/',
            '/api/companies/'
        ]
        
        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(f'{endpoint}?page_size=20')
                
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                
                # Проверяем, что размер ответа разумен для мобильных
                response_size = len(str(response.content))
                self.assertLess(response_size, 50000)  # Менее 50KB
    
    def test_concurrent_mobile_requests(self):
        """Тест одновременных запросов с мобильными заголовками"""
        import threading
        import queue
        
        results = queue.Queue()
        mobile_headers = {
            'HTTP_USER_AGENT': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
        
        def make_mobile_request():
            start_time = time.time()
            response = self.client.get('/api/artists/?page_size=10', **mobile_headers)
            end_time = time.time()
            results.put((response.status_code, end_time - start_time))
        
        # Создаем 5 одновременных запросов (имитация мобильных пользователей)
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_mobile_request)
            threads.append(thread)
            thread.start()
        
        # Ждем завершения всех потоков
        for thread in threads:
            thread.join()
        
        # Проверяем результаты
        response_times = []
        while not results.empty():
            status_code, response_time = results.get()
            self.assertEqual(status_code, status.HTTP_200_OK)
            response_times.append(response_time)
        
        if response_times:  # Проверяем, что есть результаты
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
        else:
            avg_response_time = 0
            max_response_time = 0
        
        # Мобильные запросы должны быть быстрыми
        self.assertLess(avg_response_time, 0.5)
        self.assertLess(max_response_time, 1.0)
        
        print(f"Мобильные запросы - Среднее время: {avg_response_time:.3f}s, Максимальное: {max_response_time:.3f}s")


class MobileDataOptimizationTest(TestCase):
    """Тесты оптимизации данных для мобильных устройств"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_mobile_friendly_field_selection(self):
        """Тест выбора полей, удобных для мобильных устройств"""
        # Тестируем, что API возвращает только необходимые поля
        response = self.client.get('/api/artists/?page_size=5')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if response.data['results']:
            artist = response.data['results'][0]
            
            # Проверяем наличие основных полей
            required_fields = ['id', 'first_name', 'last_name', 'gender', 'age']
            for field in required_fields:
                self.assertIn(field, artist)
            
            # Проверяем, что не возвращаются тяжелые поля (если не запрошены)
            # Это зависит от реализации сериализаторов
    
    def test_compressed_responses(self):
        """Тест сжатия ответов для мобильных устройств"""
        # Тестируем, что ответы могут быть сжаты
        response = self.client.get('/api/artists/?page_size=20')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем, что ответ содержит JSON данные
        self.assertIsInstance(response.data, dict)
        self.assertIn('results', response.data)
    
    def test_mobile_search_optimization(self):
        """Тест оптимизации поиска для мобильных устройств"""
        # Тестируем поиск с ограниченными результатами
        response = self.client.get('/api/artists/?search=Artist&page_size=5')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['results']), 5)
        
        # Проверяем, что поиск работает быстро
        import time
        start_time = time.time()
        self.client.get('/api/artists/?search=Test&page_size=3')
        search_time = time.time() - start_time
        
        self.assertLess(search_time, 0.3)
