import pytest
import json
from unittest.mock import Mock, patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from telegram_requests.models import Request, RequestImage, RequestFile
from .factories import (
    RequestFactory, PendingRequestFactory, CompletedRequestFactory,
    RequestImageFactory, RequestFileFactory, TelegramWebhookDataFactory
)

User = get_user_model()


class RequestViewSetTest(APITestCase):
    """Тесты для RequestViewSet"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.another_user = User.objects.create_user(
            username='another_user',
            email='another@example.com',
            password='testpass123'
        )
        self.request = RequestFactory(agent=self.user)
        self.pending_request = PendingRequestFactory()
        self.completed_request = CompletedRequestFactory(agent=self.user)
    
    def test_unauthenticated_access(self):
        """Тест доступа без аутентификации"""
        url = '/api/requests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_access(self):
        """Тест доступа с аутентификацией"""
        self.client.force_authenticate(user=self.user)
        url = '/api/requests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_request_list(self):
        """Тест получения списка запросов"""
        self.client.force_authenticate(user=self.user)
        url = '/api/requests/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
        self.assertIn('results', response.data)
    
    def test_request_detail(self):
        """Тест получения детальной информации о запросе"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/requests/{self.request.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.request.id)
        self.assertEqual(response.data['text'], self.request.text)
    
    def test_request_filtering_by_status(self):
        """Тест фильтрации запросов по статусу"""
        self.client.force_authenticate(user=self.user)
        
        # Создаем тестовые запросы с разными статусами
        pending_request = RequestFactory(status='pending', created_by=self.user)
        completed_request = RequestFactory(status='completed', created_by=self.user)
        
        url = '/api/requests/?status=pending'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Проверяем, что в результатах есть только pending запросы
        pending_requests = [r for r in response.data['results'] if r['status'] == 'pending']
        completed_requests = [r for r in response.data['results'] if r['status'] == 'completed']
        
        self.assertGreater(len(pending_requests), 0)
        self.assertEqual(len(completed_requests), 0)
    
    def test_request_filtering_by_agent(self):
        """Тест фильтрации запросов по агенту"""
        self.client.force_authenticate(user=self.user)
        
        # Создаем тестовые запросы с разными агентами
        user_request = RequestFactory(agent=self.user, created_by=self.user)
        another_user_request = RequestFactory(agent=self.another_user, created_by=self.another_user)
        
        url = f'/api/requests/?agent={self.user.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Проверяем, что в результатах есть только запросы текущего пользователя
        user_requests = [r for r in response.data['results'] if r['agent'] == self.user.id]
        another_user_requests = [r for r in response.data['results'] if r['agent'] == self.another_user.id]
        
        self.assertGreater(len(user_requests), 0)
        self.assertEqual(len(another_user_requests), 0)
    
    def test_request_search(self):
        """Тест поиска запросов по тексту"""
        search_term = "уникальный поисковый термин"
        search_request = RequestFactory(text=f"Запрос с {search_term}")
        
        self.client.force_authenticate(user=self.user)
        url = f'/api/requests/?search={search_term}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
        self.assertIn(search_term, response.data['results'][0]['text'])
    
    def test_request_stats(self):
        """Тест получения статистики запросов"""
        self.client.force_authenticate(user=self.user)
        url = '/api/requests/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data
        
        expected_fields = [
            'total', 'pending', 'in_progress', 'completed', 'cancelled',
            'with_media', 'today'
        ]
        
        for field in expected_fields:
            self.assertIn(field, stats)
            self.assertIsInstance(stats[field], int)
    
    def test_my_requests(self):
        """Тест получения запросов текущего агента"""
        self.client.force_authenticate(user=self.user)
        url = '/api/requests/my_requests/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for request_data in response.data['results']:
            self.assertEqual(request_data['agent'], self.user.id)
    
    def test_unassigned_requests(self):
        """Тест получения неназначенных запросов"""
        self.client.force_authenticate(user=self.user)
        url = '/api/requests/unassigned/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for request_data in response.data['results']:
            self.assertIsNone(request_data['agent'])
    
    def test_request_respond(self):
        """Тест ответа на запрос"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/requests/{self.pending_request.id}/respond/'
        data = {
            'status': 'in_progress',
            'response_text': 'Запрос принят в обработку'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')
        self.assertEqual(response.data['response_text'], 'Запрос принят в обработку')
        
        # Проверяем, что запрос обновился в базе
        self.pending_request.refresh_from_db()
        self.assertEqual(self.pending_request.status, 'in_progress')
        self.assertEqual(self.pending_request.agent, self.user)
        self.assertIsNotNone(self.pending_request.processed_at)
    
    def test_request_respond_unauthorized(self):
        """Тест ответа на запрос другим агентом"""
        self.client.force_authenticate(user=self.another_user)
        url = f'/api/requests/{self.request.id}/respond/'
        data = {'status': 'completed'}
        response = self.client.post(url, data, format='json')
        
        # Любой агент может ответить на любой запрос
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_request_change_status(self):
        """Тест изменения статуса запроса"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/requests/{self.pending_request.id}/change_status/'
        data = {'status': 'completed'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')
        
        # Проверяем, что запрос обновился в базе
        self.pending_request.refresh_from_db()
        self.assertEqual(self.pending_request.status, 'completed')
        self.assertEqual(self.pending_request.agent, self.user)
    
    def test_request_change_status_unauthorized(self):
        """Тест изменения статуса запроса другим агентом"""
        self.client.force_authenticate(user=self.another_user)
        url = f'/api/requests/{self.request.id}/change_status/'
        data = {'status': 'cancelled'}
        response = self.client.post(url, data, format='json')
        
        # Любой агент может изменить статус любого запроса
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_request_ordering(self):
        """Тест сортировки запросов"""
        # Создаем запросы с разными датами
        old_request = RequestFactory(
            created_at=timezone.now() - timedelta(days=2)
        )
        new_request = RequestFactory(
            created_at=timezone.now() - timedelta(days=1)
        )
        
        self.client.force_authenticate(user=self.user)
        url = '/api/requests/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        
        # Проверяем, что новые запросы идут первыми
        if len(results) >= 2:
            self.assertGreaterEqual(
                results[0]['created_at'], 
                results[1]['created_at']
            )


class RequestImageViewSetTest(APITestCase):
    """Тесты для RequestImageViewSet"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
        self.request = RequestFactory(agent=self.user)
        self.image = RequestImageFactory(request=self.request)
    
    def test_unauthenticated_access(self):
        """Тест доступа без аутентификации"""
        url = '/api/request-images/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_access(self):
        """Тест доступа с аутентификацией"""
        self.client.force_authenticate(user=self.user)
        url = '/api/request-images/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_image_list(self):
        """Тест получения списка изображений"""
        self.client.force_authenticate(user=self.user)
        url = '/api/request-images/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
        self.assertIn('results', response.data)
    
    def test_image_detail(self):
        """Тест получения детальной информации об изображении"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/request-images/{self.image.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.image.id)
        self.assertEqual(response.data['request'], self.request.id)


class RequestFileViewSetTest(APITestCase):
    """Тесты для RequestFileViewSet"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
        self.request = RequestFactory(agent=self.user)
        self.file_obj = RequestFileFactory(request=self.request)
    
    def test_unauthenticated_access(self):
        """Тест доступа без аутентификации"""
        url = '/api/request-files/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_access(self):
        """Тест доступа с аутентификацией"""
        self.client.force_authenticate(user=self.user)
        url = '/api/request-files/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_file_list(self):
        """Тест получения списка файлов"""
        self.client.force_authenticate(user=self.user)
        url = '/api/request-files/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
        self.assertIn('results', response.data)
    
    def test_file_detail(self):
        """Тест получения детальной информации о файле"""
        self.client.force_authenticate(user=self.user)
        url = f'/api/request-files/{self.file_obj.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.file_obj.id)
        self.assertEqual(response.data['request'], self.request.id)


class TelegramWebhookViewSetTest(APITestCase):
    """Тесты для TelegramWebhookViewSet"""
    
    def test_webhook_without_data(self):
        """Тест webhook без данных"""
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'error')
    
    def test_webhook_text_message(self):
        """Тест webhook с текстовым сообщением"""
        webhook_data = TelegramWebhookDataFactory.create_text_message()
        
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, webhook_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        self.assertIn('request_id', response.data)
        
        # Проверяем, что запрос создался в базе
        request_id = response.data['request_id']
        request = Request.objects.get(id=request_id)
        self.assertEqual(request.text, webhook_data['message']['text'])
    
    @patch('telegram_requests.views.TelegramFileService')
    def test_webhook_photo_message(self, mock_service_class):
        """Тест webhook с сообщением с фотографией"""
        # Настраиваем мок сервиса
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_request_image = Mock()
        mock_service.save_image_from_telegram.return_value = mock_request_image
        
        webhook_data = TelegramWebhookDataFactory.create_photo_message()
        
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, webhook_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        
        # Проверяем, что запрос создался с флагом has_images
        request_id = response.data['request_id']
        request = Request.objects.get(id=request_id)
        self.assertTrue(request.has_images)
        
        # Проверяем, что сервис был вызван для скачивания изображения
        mock_service_class.assert_called_once()
        mock_service.save_image_from_telegram.assert_called_once()
    
    @patch('telegram_requests.views.TelegramFileService')
    def test_webhook_document_message(self, mock_service_class):
        """Тест webhook с сообщением с документом"""
        # Настраиваем мок сервиса
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_request_file = Mock()
        mock_service.save_document_from_telegram.return_value = mock_request_file
        
        webhook_data = TelegramWebhookDataFactory.create_document_message()
        
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, webhook_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        
        # Проверяем, что запрос создался с флагом has_files
        request_id = response.data['request_id']
        request = Request.objects.get(id=request_id)
        self.assertTrue(request.has_files)
        
        # Проверяем, что сервис был вызван для скачивания документа
        mock_service_class.assert_called_once()
        mock_service.save_document_from_telegram.assert_called_once()
    
    def test_webhook_empty_message(self):
        """Тест webhook с пустым сообщением"""
        webhook_data = TelegramWebhookDataFactory.create_empty_message()
        
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, webhook_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        
        # Проверяем, что запрос создался с дефолтным текстом
        request_id = response.data['request_id']
        request = Request.objects.get(id=request_id)
        self.assertEqual(request.text, '[Сообщение без текста]')
    
    def test_webhook_forwarded_message(self):
        """Тест webhook с пересланным сообщением"""
        webhook_data = TelegramWebhookDataFactory.create_text_message(forwarded=True)
        
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, webhook_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        
        # Проверяем, что запрос создался с правильными данными автора
        request_id = response.data['request_id']
        request = Request.objects.get(id=request_id)
        self.assertEqual(
            request.author_telegram_id, 
            webhook_data['message']['forward_from']['id']
        )
    
    def test_webhook_invalid_json(self):
        """Тест webhook с неверным JSON"""
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(
            url, 
            'invalid json', 
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_webhook_missing_message(self):
        """Тест webhook без поля message"""
        data = {'some_other_field': 'value'}
        
        url = '/api/webhook/telegram/webhook/'
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Ошибка валидации webhook данных', response.data['message'])
