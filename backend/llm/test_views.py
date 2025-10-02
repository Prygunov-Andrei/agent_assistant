"""
Тесты для LLM API views
"""

import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from artists.models import Artist
from telegram_requests.models import Request

User = get_user_model()


class LLMAPIViewsTestCase(TestCase):
    """Тесты для LLM API views"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        self.client = APIClient()
        
        # Создаем пользователя
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        # Создаем артиста
        self.artist = Artist.objects.create(
            first_name='Тестовый',
            last_name='Артист',
            gender='male',
            height=180,
            weight=75,
            clothing_size='M',
            shoe_size='42',
            hair_color='Брюнет',
            eye_color='Карие',
            created_by=self.user
        )
        
        # Создаем запрос
        self.telegram_request = Request.objects.create(
            text='Нужен актер для комедийный фильм',
            author_name='Тестовый Автор',
            author_telegram_id=123456789,
            sender_telegram_id=987654321,
            telegram_message_id=111,
            telegram_chat_id=222,
            analysis_status='new',
            created_by=self.user
        )
        
        # Аутентифицируем клиент
        self.client.force_authenticate(user=self.user)
    
    def test_analyze_request_success(self):
        """Тест успешного анализа запроса"""
        url = reverse('llm:analyze_request', kwargs={'request_id': self.telegram_request.id})
        data = {'use_emulator': True}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('project_analysis', response.data)
        self.assertIn('confidence', response.data)
        self.assertIn('processing_time', response.data)
        self.assertTrue(response.data['used_emulator'])
        
        # Проверяем, что статус запроса обновился
        self.telegram_request.refresh_from_db()
        self.assertEqual(self.telegram_request.analysis_status, 'analyzed')
    
    def test_analyze_request_not_found(self):
        """Тест анализа несуществующего запроса"""
        url = reverse('llm:analyze_request', kwargs={'request_id': 99999})
        data = {'use_emulator': True}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_analyze_request_invalid_data(self):
        """Тест анализа с неверными данными"""
        url = reverse('llm:analyze_request', kwargs={'request_id': self.telegram_request.id})
        data = {'use_emulator': 'invalid'}

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_analyze_request_unauthorized(self):
        """Тест анализа без аутентификации"""
        self.client.force_authenticate(user=None)
        
        url = reverse('llm:analyze_request', kwargs={'request_id': self.telegram_request.id})
        data = {'use_emulator': True}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_artists_for_llm(self):
        """Тест получения артистов для LLM"""
        url = reverse('llm:artists_for_llm')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('artists', response.data)
        self.assertIn('total_count', response.data)
        self.assertEqual(response.data['total_count'], 1)
        
        # Проверяем структуру данных артиста
        artist_data = response.data['artists'][0]
        self.assertEqual(artist_data['id'], self.artist.id)
        self.assertEqual(artist_data['name'], f"{self.artist.first_name} {self.artist.last_name}")
        self.assertEqual(artist_data['gender'], self.artist.gender)
        self.assertIn('skills', artist_data)
        self.assertIn('languages', artist_data)
    
    def test_get_artists_for_llm_unauthorized(self):
        """Тест получения артистов без аутентификации"""
        self.client.force_authenticate(user=None)
        
        url = reverse('llm:artists_for_llm')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_llm_status(self):
        """Тест получения статуса LLM"""
        url = reverse('llm:llm_status')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('emulator_enabled', response.data)
        self.assertIn('current_model', response.data)
    
    def test_get_llm_status_unauthorized(self):
        """Тест получения статуса LLM без аутентификации"""
        self.client.force_authenticate(user=None)
        
        url = reverse('llm:llm_status')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_request_analysis_status(self):
        """Тест получения статуса анализа запроса"""
        url = reverse('llm:request_analysis_status', kwargs={'request_id': self.telegram_request.id})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['request_id'], self.telegram_request.id)
        self.assertEqual(response.data['analysis_status'], 'new')
        self.assertIn('created_at', response.data)
        self.assertIn('updated_at', response.data)
    
    def test_get_request_analysis_status_not_found(self):
        """Тест получения статуса несуществующего запроса"""
        url = reverse('llm:request_analysis_status', kwargs={'request_id': 99999})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_request_analysis_status_unauthorized(self):
        """Тест получения статуса анализа без аутентификации"""
        self.client.force_authenticate(user=None)
        
        url = reverse('llm:request_analysis_status', kwargs={'request_id': self.telegram_request.id})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LLMSerializersTestCase(TestCase):
    """Тесты для LLM сериализаторов"""
    
    def test_llm_analysis_request_serializer_valid(self):
        """Тест валидного сериализатора запроса анализа"""
        from .serializers import LLMAnalysisRequestSerializer
        
        data = {
            'request_id': 1,
            'use_emulator': True
        }
        
        serializer = LLMAnalysisRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['request_id'], 1)
        self.assertTrue(serializer.validated_data['use_emulator'])
    
    def test_llm_analysis_request_serializer_invalid_request_id(self):
        """Тест невалидного ID запроса"""
        from .serializers import LLMAnalysisRequestSerializer
        
        data = {
            'request_id': -1,
            'use_emulator': True
        }
        
        serializer = LLMAnalysisRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('request_id', serializer.errors)
    
    def test_artist_for_llm_serializer(self):
        """Тест сериализатора артиста для LLM"""
        from .serializers import ArtistForLLMSerializer
        
        artist_data = {
            'id': 1,
            'name': 'Тестовый Артист',
            'age': 25,
            'gender': 'male',
            'height': 180,
            'weight': 75,
            'clothing_size': 'M',
            'shoe_size': '42',
            'hair_color': 'Брюнет',
            'eye_color': 'Карие',
            'skills': ['драма', 'комедия'],
            'languages': ['русский'],
            'special_requirements': []
        }
        
        serializer = ArtistForLLMSerializer(data=artist_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'Тестовый Артист')
        self.assertEqual(serializer.validated_data['age'], 25)
        self.assertEqual(serializer.validated_data['gender'], 'male')
