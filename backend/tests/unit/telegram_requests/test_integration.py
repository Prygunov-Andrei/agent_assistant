import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import json

from telegram_requests.models import Request, RequestImage, RequestFile
from .factories import (
    RequestFactory, PendingRequestFactory, CompletedRequestFactory,
    RequestImageFactory, RequestFileFactory, TelegramWebhookDataFactory
)

User = get_user_model()


class TelegramRequestsIntegrationTest(APITestCase):
    """Интеграционные тесты для системы запросов Telegram"""
    
    def setUp(self):
        self.agent = User.objects.create_user(
            username='test_agent',
            email='agent@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Agent'
        )
        self.another_agent = User.objects.create_user(
            username='another_agent',
            email='another@test.com',
            password='testpass123'
        )
    
    def test_complete_request_workflow(self):
        """Тест полного рабочего процесса запроса"""
        # 1. Создаем запрос через webhook
        webhook_data = TelegramWebhookDataFactory.create_text_message()
        webhook_url = '/api/webhook/telegram/webhook/'
        webhook_response = self.client.post(webhook_url, webhook_data, format='json')
        
        self.assertEqual(webhook_response.status_code, status.HTTP_200_OK)
        request_id = webhook_response.data['request_id']
        
        # 2. Агент получает неназначенные запросы
        self.client.force_authenticate(user=self.agent)
        unassigned_url = '/api/requests/unassigned/'
        unassigned_response = self.client.get(unassigned_url)
        
        self.assertEqual(unassigned_response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(unassigned_response.data['results']), 0)
        
        # Находим наш запрос в неназначенных
        our_request = None
        for request_data in unassigned_response.data['results']:
            if request_data['id'] == request_id:
                our_request = request_data
                break
        
        self.assertIsNotNone(our_request)
        self.assertEqual(our_request['status'], 'pending')
        self.assertIsNone(our_request['agent'])
        
        # 3. Агент берет запрос в работу
        respond_url = f'/api/requests/{request_id}/respond/'
        respond_data = {
            'status': 'in_progress',
            'response_text': 'Запрос принят в обработку'
        }
        respond_response = self.client.post(respond_url, respond_data, format='json')
        
        self.assertEqual(respond_response.status_code, status.HTTP_200_OK)
        self.assertEqual(respond_response.data['status'], 'in_progress')
        
        # 4. Проверяем, что запрос больше не в неназначенных
        unassigned_response = self.client.get(unassigned_url)
        request_ids = [req['id'] for req in unassigned_response.data['results']]
        self.assertNotIn(request_id, request_ids)
        
        # 5. Проверяем, что запрос теперь в моих запросах
        my_requests_url = '/api/requests/my_requests/'
        my_requests_response = self.client.get(my_requests_url)
        
        self.assertEqual(my_requests_response.status_code, status.HTTP_200_OK)
        my_request_ids = [req['id'] for req in my_requests_response.data['results']]
        self.assertIn(request_id, my_request_ids)
        
        # 6. Завершаем запрос
        complete_data = {'status': 'completed'}
        complete_response = self.client.post(
            f'/api/requests/{request_id}/change_status/',
            complete_data,
            format='json'
        )
        
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data['status'], 'completed')
        
        # 7. Проверяем статистику
        stats_url = '/api/requests/stats/'
        stats_response = self.client.get(stats_url)
        
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        stats = stats_response.data
        self.assertGreater(stats['total'], 0)
        self.assertGreater(stats['completed'], 0)
    
    def test_multiple_agents_workflow(self):
        """Тест работы нескольких агентов"""
        # Создаем несколько запросов
        request1 = PendingRequestFactory()
        request2 = PendingRequestFactory()
        request3 = PendingRequestFactory()
        
        # Первый агент берет первый запрос
        self.client.force_authenticate(user=self.agent)
        respond_data = {'status': 'in_progress'}
        response1 = self.client.post(
            f'/api/requests/{request1.id}/respond/',
            respond_data,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Второй агент берет второй запрос
        self.client.force_authenticate(user=self.another_agent)
        response2 = self.client.post(
            f'/api/requests/{request2.id}/respond/',
            respond_data,
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Проверяем, что каждый агент видит только свои запросы
        self.client.force_authenticate(user=self.agent)
        my_requests = self.client.get('/api/requests/my_requests/')
        my_request_ids = [req['id'] for req in my_requests.data['results']]
        self.assertIn(request1.id, my_request_ids)
        self.assertNotIn(request2.id, my_request_ids)
        
        self.client.force_authenticate(user=self.another_agent)
        my_requests = self.client.get('/api/requests/my_requests/')
        my_request_ids = [req['id'] for req in my_requests.data['results']]
        self.assertNotIn(request1.id, my_request_ids)
        self.assertIn(request2.id, my_request_ids)
        
        # Третий запрос остается неназначенным
        self.client.force_authenticate(user=self.agent)
        unassigned = self.client.get('/api/requests/unassigned/')
        unassigned_ids = [req['id'] for req in unassigned.data['results']]
        self.assertIn(request3.id, unassigned_ids)
    
    def test_request_with_media_workflow(self):
        """Тест рабочего процесса с медиафайлами"""
        # 1. Создаем запрос с фотографией через webhook
        webhook_data = TelegramWebhookDataFactory.create_photo_message()
        webhook_response = self.client.post(
            '/api/webhook/telegram/webhook/',
            webhook_data,
            format='json'
        )
        
        self.assertEqual(webhook_response.status_code, status.HTTP_200_OK)
        request_id = webhook_response.data['request_id']
        
        # 2. Проверяем, что запрос создался с флагом has_images
        request = Request.objects.get(id=request_id)
        self.assertTrue(request.has_images)
        self.assertTrue(request.has_media)
        
        # 3. Агент получает запрос
        self.client.force_authenticate(user=self.agent)
        detail_response = self.client.get(f'/api/requests/{request_id}/')
        
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertTrue(detail_response.data['has_images'])
        self.assertTrue(detail_response.data['has_media'])
        
        # 4. Обрабатываем запрос
        respond_data = {
            'status': 'completed',
            'response_text': 'Запрос с изображением обработан'
        }
        respond_response = self.client.post(
            f'/api/requests/{request_id}/respond/',
            respond_data,
            format='json'
        )
        
        self.assertEqual(respond_response.status_code, status.HTTP_200_OK)
        self.assertEqual(respond_response.data['status'], 'completed')
    
    def test_request_filtering_and_search(self):
        """Тест фильтрации и поиска запросов"""
        # Создаем запросы с разными характеристиками
        pending_request = PendingRequestFactory(text="Поиск актера на главную роль")
        completed_request = CompletedRequestFactory(
            text="Нужен каскадер для трюков",
            agent=self.agent
        )
        
        # Тест фильтрации по статусу
        self.client.force_authenticate(user=self.agent)
        
        pending_response = self.client.get('/api/requests/?status=pending')
        self.assertEqual(pending_response.status_code, status.HTTP_200_OK)
        pending_ids = [req['id'] for req in pending_response.data['results']]
        self.assertIn(pending_request.id, pending_ids)
        self.assertNotIn(completed_request.id, pending_ids)
        
        completed_response = self.client.get('/api/requests/?status=completed')
        self.assertEqual(completed_response.status_code, status.HTTP_200_OK)
        completed_ids = [req['id'] for req in completed_response.data['results']]
        self.assertNotIn(pending_request.id, completed_ids)
        self.assertIn(completed_request.id, completed_ids)
        
        # Тест поиска по тексту
        search_response = self.client.get('/api/requests/?search=актер')
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        search_ids = [req['id'] for req in search_response.data['results']]
        self.assertIn(pending_request.id, search_ids)
        
        search_response = self.client.get('/api/requests/?search=каскадер')
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        search_ids = [req['id'] for req in search_response.data['results']]
        self.assertIn(completed_request.id, search_ids)
    
    def test_error_handling(self):
        """Тест обработки ошибок"""
        self.client.force_authenticate(user=self.agent)
        
        # Тест обращения к несуществующему запросу
        response = self.client.get('/api/requests/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Тест неверных данных при ответе на запрос
        request = PendingRequestFactory()
        invalid_data = {'status': 'invalid_status'}
        response = self.client.post(
            f'/api/requests/{request.id}/respond/',
            invalid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Тест ответа на запрос другим агентом (все агенты могут обрабатывать все запросы)
        assigned_request = RequestFactory(agent=self.another_agent)
        response = self.client.post(
            f'/api/requests/{assigned_request.id}/respond/',
            {'status': 'completed'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_permissions_and_access_control(self):
        """Тест прав доступа и контроля"""
        # Создаем запросы для разных агентов
        my_request = RequestFactory(agent=self.agent)
        other_request = RequestFactory(agent=self.another_agent)
        unassigned_request = PendingRequestFactory()
        
        self.client.force_authenticate(user=self.agent)
        
        # Агент может видеть все запросы
        response = self.client.get(f'/api/requests/{my_request.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Агент может видеть неназначенные запросы
        response = self.client.get(f'/api/requests/{unassigned_request.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Агент может видеть запросы других агентов
        response = self.client.get(f'/api/requests/{other_request.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Агент может отвечать на свои запросы
        response = self.client.post(
            f'/api/requests/{my_request.id}/respond/',
            {'status': 'completed'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Агент может отвечать на неназначенные запросы
        response = self.client.post(
            f'/api/requests/{unassigned_request.id}/respond/',
            {'status': 'in_progress'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Агент может отвечать на запросы других агентов
        response = self.client.post(
            f'/api/requests/{other_request.id}/respond/',
            {'status': 'completed'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_data_consistency(self):
        """Тест согласованности данных"""
        # Создаем запрос через webhook
        webhook_data = TelegramWebhookDataFactory.create_text_message()
        webhook_response = self.client.post(
            '/api/webhook/telegram/webhook/',
            webhook_data,
            format='json'
        )
        
        request_id = webhook_response.data['request_id']
        
        # Проверяем согласованность данных
        request = Request.objects.get(id=request_id)
        message_data = webhook_data['message']
        
        self.assertEqual(request.text, message_data['text'])
        self.assertEqual(request.telegram_message_id, message_data['message_id'])
        self.assertEqual(request.author_telegram_id, message_data['from']['id'])
        self.assertEqual(request.sender_telegram_id, message_data['from']['id'])
        
        # Проверяем, что дата создания правильно конвертирована
        expected_date = timezone.datetime.fromtimestamp(
            message_data['date'],
            tz=timezone.timezone.utc
        )
        self.assertEqual(request.original_created_at, expected_date)
        
        # Проверяем, что статус по умолчанию - pending
        self.assertEqual(request.status, 'pending')
        self.assertIsNone(request.agent)
        self.assertIsNone(request.processed_at)
    
    def test_performance_with_multiple_requests(self):
        """Тест производительности с множественными запросами"""
        # Создаем много запросов
        requests = []
        for i in range(50):
            request = RequestFactory()
            requests.append(request)
        
        self.client.force_authenticate(user=self.agent)
        
        # Тест получения списка запросов
        response = self.client.get('/api/requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)
        self.assertIn('results', response.data)
        
        # Проверяем пагинацию
        if 'next' in response.data:
            self.assertIsNotNone(response.data['next'])
        
        # Тест статистики
        response = self.client.get('/api/requests/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data
        self.assertGreaterEqual(stats['total'], 50)
