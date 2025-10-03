import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from telegram_requests.models import Request, RequestImage, RequestFile
from telegram_requests.serializers import (
    RequestSerializer, RequestListSerializer, RequestCreateSerializer,
    RequestResponseSerializer, RequestStatusSerializer,
    RequestImageSerializer, RequestFileSerializer
)
from .factories import (
    RequestFactory, PendingRequestFactory, CompletedRequestFactory,
    RequestImageFactory, RequestFileFactory, TelegramWebhookDataFactory
)

User = get_user_model()


class RequestSerializerTest(TestCase):
    """Тесты для сериализатора Request"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
        self.request = RequestFactory(agent=self.user)
    
    def test_request_serializer_fields(self):
        """Тест полей сериализатора Request"""
        serializer = RequestSerializer(self.request)
        data = serializer.data
        
        # Проверяем основные поля
        self.assertIn('id', data)
        self.assertIn('text', data)
        self.assertIn('author_name', data)
        self.assertIn('status', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        
        # Проверяем вычисляемые поля
        self.assertIn('agent_name', data)
        self.assertIn('is_forwarded', data)
        self.assertIn('has_media', data)
        self.assertIn('images_count', data)
        self.assertIn('files_count', data)
    
    def test_request_serializer_read_only_fields(self):
        """Тест read-only полей"""
        serializer = RequestSerializer(self.request)
        data = serializer.data
        
        # Эти поля должны быть только для чтения
        read_only_fields = [
            'author_name', 'author_telegram_id', 'sender_telegram_id',
            'telegram_message_id', 'telegram_chat_id', 'media_group_id',
            'has_images', 'has_files', 'original_created_at', 'is_forwarded',
            'images', 'files', 'images_count', 'files_count', 'agent_name'
        ]
        
        for field in read_only_fields:
            self.assertIn(field, data)
    
    def test_request_serializer_with_media(self):
        """Тест сериализатора с медиафайлами"""
        request = RequestFactory(has_images=True, has_files=True)
        
        # Добавляем изображения и файлы
        RequestImageFactory(request=request)
        RequestFileFactory(request=request)
        
        serializer = RequestSerializer(request)
        data = serializer.data
        
        self.assertTrue(data['has_images'])
        self.assertTrue(data['has_files'])
        self.assertTrue(data['has_media'])
        self.assertEqual(data['images_count'], 1)
        self.assertEqual(data['files_count'], 1)
        self.assertEqual(len(data['images']), 1)
        self.assertEqual(len(data['files']), 1)
    
    def test_request_serializer_agent_name(self):
        """Тест отображения имени агента"""
        serializer = RequestSerializer(self.request)
        data = serializer.data
        
        expected_name = f"{self.user.first_name} {self.user.last_name}".strip()
        self.assertEqual(data['agent_name'], expected_name)


class RequestListSerializerTest(TestCase):
    """Тесты для сериализатора RequestList"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
        self.request = RequestFactory(agent=self.user)
    
    def test_request_list_serializer_fields(self):
        """Тест полей сериализатора RequestList"""
        serializer = RequestListSerializer(self.request)
        data = serializer.data
        
        # Проверяем основные поля для списка
        self.assertIn('id', data)
        self.assertIn('text', data)
        self.assertIn('author_name', data)
        self.assertIn('status', data)
        self.assertIn('created_at', data)
        
        # Проверяем вычисляемые поля
        self.assertIn('agent_name', data)
        self.assertIn('is_forwarded', data)
        self.assertIn('has_media', data)
        self.assertIn('images_count', data)
        self.assertIn('files_count', data)
        
        # Проверяем, что детальные поля присутствуют
        self.assertIn('images', data)
        self.assertIn('files', data)
        # Проверяем, что response_text отсутствует
        self.assertNotIn('response_text', data)


class RequestCreateSerializerTest(TestCase):
    """Тесты для сериализатора RequestCreate"""
    
    def test_request_create_serializer_fields(self):
        """Тест полей сериализатора RequestCreate"""
        serializer = RequestCreateSerializer()
        fields = serializer.fields
        
        # Проверяем, что есть только нужные поля
        expected_fields = [
            'text', 'author_name', 'author_telegram_id', 'sender_telegram_id',
            'telegram_message_id', 'telegram_chat_id', 'media_group_id',
            'has_images', 'has_files', 'original_created_at'
        ]
        
        for field in expected_fields:
            self.assertIn(field, fields)
        
        # Проверяем, что нет полей, которые не должны быть в создании
        self.assertNotIn('status', fields)
        self.assertNotIn('agent', fields)
        self.assertNotIn('response_text', fields)
    
    def test_request_create_serializer_validation(self):
        """Тест валидации сериализатора RequestCreate"""
        data = {
            'text': 'Тестовый запрос',
            'author_name': 'Иван Иванов',
            'sender_telegram_id': 123456789,
            'telegram_message_id': 987654321,
            'telegram_chat_id': 123456789,
            'has_images': False,
            'has_files': False
        }
        
        serializer = RequestCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_request_create_serializer_invalid_data(self):
        """Тест валидации с неверными данными"""
        data = {
            'text': '',  # Пустой текст
            'sender_telegram_id': 'invalid',  # Неверный тип
            'telegram_message_id': None  # Обязательное поле None
        }
        
        serializer = RequestCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('text', serializer.errors)
        self.assertIn('sender_telegram_id', serializer.errors)
        self.assertIn('telegram_message_id', serializer.errors)


class RequestResponseSerializerTest(TestCase):
    """Тесты для сериализатора RequestResponse"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
        self.request = PendingRequestFactory()
    
    def test_request_response_serializer_fields(self):
        """Тест полей сериализатора RequestResponse"""
        serializer = RequestResponseSerializer()
        fields = serializer.fields
        
        expected_fields = ['status', 'response_text', 'processed_at']
        for field in expected_fields:
            self.assertIn(field, fields)
    
    def test_request_response_serializer_update(self):
        """Тест обновления через RequestResponse"""
        data = {
            'status': 'in_progress',
            'response_text': 'Запрос в обработке'
        }
        
        serializer = RequestResponseSerializer(
            self.request, 
            data=data,
            context={'request': type('obj', (object,), {'user': self.user})()}
        )
        
        self.assertTrue(serializer.is_valid())
        updated_request = serializer.save()
        
        self.assertEqual(updated_request.status, 'in_progress')
        self.assertEqual(updated_request.response_text, 'Запрос в обработке')
        self.assertEqual(updated_request.agent, self.user)
        self.assertIsNotNone(updated_request.processed_at)
    
    def test_request_response_serializer_status_transition(self):
        """Тест перехода статуса с установкой processed_at"""
        data = {'status': 'in_progress'}
        
        serializer = RequestResponseSerializer(
            self.request,
            data=data,
            context={'request': type('obj', (object,), {'user': self.user})()}
        )
        
        self.assertTrue(serializer.is_valid())
        updated_request = serializer.save()
        
        self.assertEqual(updated_request.status, 'in_progress')
        self.assertIsNotNone(updated_request.processed_at)


class RequestStatusSerializerTest(TestCase):
    """Тесты для сериализатора RequestStatus"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test_user',
            email='test@example.com',
            password='testpass123'
        )
        self.request = PendingRequestFactory()
    
    def test_request_status_serializer_fields(self):
        """Тест полей сериализатора RequestStatus"""
        serializer = RequestStatusSerializer()
        fields = serializer.fields
        
        self.assertIn('status', fields)
        self.assertEqual(len(fields), 1)
    
    def test_request_status_serializer_update(self):
        """Тест обновления статуса"""
        data = {'status': 'completed'}
        
        serializer = RequestStatusSerializer(
            self.request,
            data=data,
            context={'request': type('obj', (object,), {'user': self.user})()}
        )
        
        self.assertTrue(serializer.is_valid())
        updated_request = serializer.save()
        
        self.assertEqual(updated_request.status, 'completed')
        self.assertEqual(updated_request.agent, self.user)
    
    def test_request_status_serializer_auto_processed_at(self):
        """Тест автоматической установки processed_at"""
        data = {'status': 'in_progress'}
        
        serializer = RequestStatusSerializer(
            self.request,
            data=data,
            context={'request': type('obj', (object,), {'user': self.user})()}
        )
        
        self.assertTrue(serializer.is_valid())
        updated_request = serializer.save()
        
        self.assertIsNotNone(updated_request.processed_at)


class RequestImageSerializerTest(TestCase):
    """Тесты для сериализатора RequestImage"""
    
    def setUp(self):
        self.request = RequestFactory()
        self.image = RequestImageFactory(request=self.request)
    
    def test_request_image_serializer_fields(self):
        """Тест полей сериализатора RequestImage"""
        serializer = RequestImageSerializer(self.image)
        data = serializer.data
        
        expected_fields = [
            'id', 'request', 'image', 'telegram_file_id', 'file_size',
            'caption', 'created_at', 'updated_at'
        ]
        
        for field in expected_fields:
            self.assertIn(field, data)
        
        # Проверяем, что file_size_mb вычисляется
        self.assertIsInstance(data.get('file_size_mb'), (int, float))
    
    def test_request_image_serializer_file_size_mb(self):
        """Тест вычисляемого поля file_size_mb"""
        # Создаем изображение с конкретным размером
        image_with_size = RequestImageFactory(request=self.request, file_size=2097152)  # 2MB
        serializer = RequestImageSerializer(image_with_size)
        data = serializer.data
        
        expected_mb = 2.0
        self.assertEqual(data['file_size_mb'], expected_mb)


class RequestFileSerializerTest(TestCase):
    """Тесты для сериализатора RequestFile"""
    
    def setUp(self):
        self.request = RequestFactory()
        self.file_obj = RequestFileFactory(request=self.request)
    
    def test_request_file_serializer_fields(self):
        """Тест полей сериализатора RequestFile"""
        serializer = RequestFileSerializer(self.file_obj)
        data = serializer.data
        
        expected_fields = [
            'id', 'request', 'file', 'original_filename', 'file_size',
            'mime_type', 'telegram_file_id', 'created_at', 'updated_at', 'file_size_mb'
        ]
        
        for field in expected_fields:
            self.assertIn(field, data)
    
    def test_request_file_serializer_file_size_mb(self):
        """Тест вычисляемого поля file_size_mb"""
        serializer = RequestFileSerializer(self.file_obj)
        data = serializer.data
        
        expected_mb = round(self.file_obj.file_size / (1024 * 1024), 2)
        self.assertEqual(data['file_size_mb'], expected_mb)


class TelegramWebhookDataSerializerTest(TestCase):
    """Тесты для обработки данных webhook от Telegram"""
    
    def test_webhook_data_processing(self):
        """Тест обработки данных webhook"""
        webhook_data = TelegramWebhookDataFactory.create_text_message()
        message_data = webhook_data['message']
        
        # Проверяем структуру данных
        self.assertIn('from', message_data)
        self.assertIn('message_id', message_data)
        self.assertIn('text', message_data)
        self.assertIn('date', message_data)
        
        # Проверяем типы данных
        self.assertIsInstance(message_data['from']['id'], int)
        self.assertIsInstance(message_data['message_id'], int)
        self.assertIsInstance(message_data['text'], str)
        self.assertIsInstance(message_data['date'], int)
    
    def test_webhook_photo_data_processing(self):
        """Тест обработки данных webhook с фотографией"""
        webhook_data = TelegramWebhookDataFactory.create_photo_message()
        message_data = webhook_data['message']
        
        # Проверяем наличие фотографии
        self.assertIn('photo', message_data)
        self.assertIsInstance(message_data['photo'], list)
        self.assertGreater(len(message_data['photo']), 0)
        
        # Проверяем структуру данных фотографии
        photo = message_data['photo'][0]
        self.assertIn('file_id', photo)
        self.assertIn('file_size', photo)
        self.assertIn('width', photo)
        self.assertIn('height', photo)
    
    def test_webhook_document_data_processing(self):
        """Тест обработки данных webhook с документом"""
        webhook_data = TelegramWebhookDataFactory.create_document_message()
        message_data = webhook_data['message']
        
        # Проверяем наличие документа
        self.assertIn('document', message_data)
        
        # Проверяем структуру данных документа
        document = message_data['document']
        self.assertIn('file_id', document)
        self.assertIn('file_name', document)
        self.assertIn('file_size', document)
        self.assertIn('mime_type', document)
    
    def test_webhook_empty_message_data_processing(self):
        """Тест обработки пустого сообщения"""
        webhook_data = TelegramWebhookDataFactory.create_empty_message()
        message_data = webhook_data['message']
        
        # Проверяем, что текст отсутствует
        self.assertNotIn('text', message_data)
        
        # Проверяем основные поля
        self.assertIn('from', message_data)
        self.assertIn('message_id', message_data)
        self.assertIn('date', message_data)
