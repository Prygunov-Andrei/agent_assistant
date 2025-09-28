import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta
import pytz

from users.models import Agent
from telegram_requests.models import Request, RequestImage, RequestFile
from .factories import (
    RequestFactory, PendingRequestFactory, CompletedRequestFactory,
    RequestWithMediaFactory, RequestImageFactory, RequestFileFactory
)


class RequestModelTest(TestCase):
    """Тесты для модели Request"""
    
    def setUp(self):
        self.agent = Agent.objects.create_user(
            username='test_agent',
            email='agent@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Agent'
        )
    
    def test_request_creation(self):
        """Тест создания запроса"""
        request = RequestFactory()
        self.assertIsInstance(request, Request)
        # Статус может быть любым из итератора
        self.assertIn(request.status, ['pending', 'in_progress', 'completed', 'cancelled'])
        # has_media зависит от has_images и has_files
        self.assertIsInstance(request.has_media, bool)
    
    def test_request_str_method(self):
        """Тест строкового представления запроса"""
        request = RequestFactory(author_name='Иван Иванов')
        expected = f"Запрос от Иван Иванов ({request.created_at.strftime('%d.%m.%Y %H:%M')})"
        self.assertEqual(str(request), expected)
    
    def test_is_forwarded_property(self):
        """Тест свойства is_forwarded"""
        # Обычное сообщение (автор = отправитель)
        request = RequestFactory(
            author_telegram_id=123456789,
            sender_telegram_id=123456789
        )
        self.assertFalse(request.is_forwarded)
        
        # Пересланное сообщение (автор != отправитель)
        request = RequestFactory(
            author_telegram_id=123456789,
            sender_telegram_id=987654321
        )
        self.assertTrue(request.is_forwarded)
    
    def test_has_media_property(self):
        """Тест свойства has_media"""
        # Запрос без медиа
        request = RequestFactory(has_images=False, has_files=False)
        self.assertFalse(request.has_media)
        
        # Запрос с изображениями
        request = RequestFactory(has_images=True, has_files=False)
        self.assertTrue(request.has_media)
        
        # Запрос с файлами
        request = RequestFactory(has_images=False, has_files=True)
        self.assertTrue(request.has_media)
        
        # Запрос с изображениями и файлами
        request = RequestFactory(has_images=True, has_files=True)
        self.assertTrue(request.has_media)
    
    def test_status_choices(self):
        """Тест валидных статусов запроса"""
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        
        for status in valid_statuses:
            request = RequestFactory(status=status)
            self.assertEqual(request.status, status)
    
    def test_agent_relationship(self):
        """Тест связи с агентом"""
        request = RequestFactory(agent=self.agent)
        self.assertEqual(request.agent, self.agent)
        
        # Проверяем обратную связь
        self.assertIn(request, self.agent.processed_requests.all())
    
    def test_created_by_relationship(self):
        """Тест связи с создателем"""
        request = RequestFactory(created_by=self.agent)
        self.assertEqual(request.created_by, self.agent)
    
    def test_original_created_at_field(self):
        """Тест поля original_created_at"""
        original_time = timezone.now() - timedelta(hours=2)
        request = RequestFactory(original_created_at=original_time)
        self.assertEqual(request.original_created_at, original_time)
    
    def test_processed_at_field(self):
        """Тест поля processed_at"""
        processed_time = timezone.now()
        request = RequestFactory(processed_at=processed_time)
        self.assertEqual(request.processed_at, processed_time)
    
    def test_response_text_field(self):
        """Тест поля response_text"""
        response = "Запрос обработан успешно"
        request = RequestFactory(response_text=response)
        self.assertEqual(request.response_text, response)
    
    def test_telegram_fields(self):
        """Тест полей Telegram"""
        telegram_id = 123456789
        message_id = 987654321
        chat_id = 111222333
        
        request = RequestFactory(
            author_telegram_id=telegram_id,
            sender_telegram_id=telegram_id,
            telegram_message_id=message_id,
            telegram_chat_id=chat_id
        )
        
        self.assertEqual(request.author_telegram_id, telegram_id)
        self.assertEqual(request.sender_telegram_id, telegram_id)
        self.assertEqual(request.telegram_message_id, message_id)
        self.assertEqual(request.telegram_chat_id, chat_id)
    
    def test_media_flags(self):
        """Тест флагов медиафайлов"""
        request = RequestFactory(has_images=True, has_files=False)
        self.assertTrue(request.has_images)
        self.assertFalse(request.has_files)
        
        request = RequestFactory(has_images=False, has_files=True)
        self.assertFalse(request.has_images)
        self.assertTrue(request.has_files)


class RequestImageModelTest(TestCase):
    """Тесты для модели RequestImage"""
    
    def setUp(self):
        self.request = RequestFactory()
    
    def test_image_creation(self):
        """Тест создания изображения"""
        image = RequestImageFactory(request=self.request)
        self.assertIsInstance(image, RequestImage)
        self.assertEqual(image.request, self.request)
    
    def test_image_str_method(self):
        """Тест строкового представления изображения"""
        image = RequestImageFactory(request=self.request)
        expected = f"Изображение для запроса {self.request.id}"
        self.assertEqual(str(image), expected)
    
    def test_telegram_file_id_field(self):
        """Тест поля telegram_file_id"""
        file_id = "BAADBAADrwADBREAAZ123456789"
        image = RequestImageFactory(telegram_file_id=file_id)
        self.assertEqual(image.telegram_file_id, file_id)
    
    def test_file_size_field(self):
        """Тест поля file_size"""
        size = 1024000  # 1MB
        image = RequestImageFactory(file_size=size)
        self.assertEqual(image.file_size, size)
    
    def test_caption_field(self):
        """Тест поля caption"""
        caption = "Тестовое изображение"
        image = RequestImageFactory(caption=caption)
        self.assertEqual(image.caption, caption)
    
    def test_relationship_with_request(self):
        """Тест связи с запросом"""
        image = RequestImageFactory(request=self.request)
        self.assertEqual(image.request, self.request)
        
        # Проверяем обратную связь
        self.assertIn(image, self.request.images.all())


class RequestFileModelTest(TestCase):
    """Тесты для модели RequestFile"""
    
    def setUp(self):
        self.request = RequestFactory()
    
    def test_file_creation(self):
        """Тест создания файла"""
        file_obj = RequestFileFactory(request=self.request)
        self.assertIsInstance(file_obj, RequestFile)
        self.assertEqual(file_obj.request, self.request)
    
    def test_file_str_method(self):
        """Тест строкового представления файла"""
        filename = "test_document.pdf"
        file_obj = RequestFileFactory(
            request=self.request,
            original_filename=filename
        )
        expected = f"{filename} для запроса {self.request.id}"
        self.assertEqual(str(file_obj), expected)
    
    def test_original_filename_field(self):
        """Тест поля original_filename"""
        filename = "important_document.docx"
        file_obj = RequestFileFactory(original_filename=filename)
        self.assertEqual(file_obj.original_filename, filename)
    
    def test_file_size_field(self):
        """Тест поля file_size"""
        size = 2048000  # 2MB
        file_obj = RequestFileFactory(file_size=size)
        self.assertEqual(file_obj.file_size, size)
    
    def test_mime_type_field(self):
        """Тест поля mime_type"""
        mime_type = "application/pdf"
        file_obj = RequestFileFactory(mime_type=mime_type)
        self.assertEqual(file_obj.mime_type, mime_type)
    
    def test_telegram_file_id_field(self):
        """Тест поля telegram_file_id"""
        file_id = "BAADBAADrwADBREAAZ987654321"
        file_obj = RequestFileFactory(telegram_file_id=file_id)
        self.assertEqual(file_obj.telegram_file_id, file_id)
    
    def test_file_size_mb_property(self):
        """Тест свойства file_size_mb"""
        # Тест с размером в байтах
        size_bytes = 2097152  # 2MB
        file_obj = RequestFileFactory(file_size=size_bytes)
        self.assertEqual(file_obj.file_size_mb, 2.0)
        
        # Тест с размером 0
        file_obj = RequestFileFactory(file_size=0)
        self.assertEqual(file_obj.file_size_mb, 0)
    
    def test_relationship_with_request(self):
        """Тест связи с запросом"""
        file_obj = RequestFileFactory(request=self.request)
        self.assertEqual(file_obj.request, self.request)
        
        # Проверяем обратную связь
        self.assertIn(file_obj, self.request.files.all())


class RequestModelIntegrationTest(TestCase):
    """Интеграционные тесты для моделей запросов"""
    
    def setUp(self):
        self.agent = Agent.objects.create_user(
            username='test_agent',
            email='agent@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Agent'
        )
    
    def test_request_with_images_and_files(self):
        """Тест запроса с изображениями и файлами"""
        request = RequestWithMediaFactory()
        
        # Добавляем изображения
        image1 = RequestImageFactory(request=request)
        image2 = RequestImageFactory(request=request)
        
        # Добавляем файлы
        file1 = RequestFileFactory(request=request)
        file2 = RequestFileFactory(request=request)
        
        # Проверяем связи
        self.assertEqual(request.images.count(), 2)
        self.assertEqual(request.files.count(), 2)
        
        # Проверяем свойства
        self.assertTrue(request.has_images)
        self.assertTrue(request.has_files)
        self.assertTrue(request.has_media)
    
    def test_request_status_transitions(self):
        """Тест переходов статусов запроса"""
        request = PendingRequestFactory()
        self.assertEqual(request.status, 'pending')
        self.assertIsNone(request.agent)
        self.assertIsNone(request.processed_at)
        
        # Назначаем агента и меняем статус на "в обработке"
        request.agent = self.agent
        request.status = 'in_progress'
        request.processed_at = timezone.now()
        request.save()
        
        self.assertEqual(request.status, 'in_progress')
        self.assertEqual(request.agent, self.agent)
        self.assertIsNotNone(request.processed_at)
        
        # Завершаем запрос
        request.status = 'completed'
        request.response_text = "Запрос выполнен успешно"
        request.save()
        
        self.assertEqual(request.status, 'completed')
        self.assertEqual(request.response_text, "Запрос выполнен успешно")
    
    def test_request_ordering(self):
        """Тест сортировки запросов"""
        # Создаем запросы с разными датами
        old_request = RequestFactory(
            created_at=timezone.now() - timedelta(days=2)
        )
        new_request = RequestFactory(
            created_at=timezone.now() - timedelta(days=1)
        )
        latest_request = RequestFactory(
            created_at=timezone.now()
        )
        
        # Проверяем сортировку по умолчанию (новые первые)
        requests = Request.objects.all()
        self.assertEqual(requests[0], latest_request)
        self.assertEqual(requests[1], new_request)
        self.assertEqual(requests[2], old_request)
    
    def test_request_filtering_by_agent(self):
        """Тест фильтрации запросов по агенту"""
        another_agent = Agent.objects.create_user(
            username='another_agent',
            email='another@test.com',
            password='testpass123'
        )
        
        # Создаем запросы для разных агентов
        request1 = RequestFactory(agent=self.agent)
        request2 = RequestFactory(agent=another_agent)
        request3 = RequestFactory(agent=None)
        
        # Фильтруем по агенту
        agent_requests = Request.objects.filter(agent=self.agent)
        self.assertIn(request1, agent_requests)
        self.assertNotIn(request2, agent_requests)
        self.assertNotIn(request3, agent_requests)
        
        # Фильтруем неназначенные запросы
        unassigned_requests = Request.objects.filter(agent__isnull=True)
        self.assertNotIn(request1, unassigned_requests)
        self.assertNotIn(request2, unassigned_requests)
        self.assertIn(request3, unassigned_requests)
    
    def test_request_filtering_by_status(self):
        """Тест фильтрации запросов по статусу"""
        pending_request = PendingRequestFactory()
        completed_request = CompletedRequestFactory()
        
        # Фильтруем по статусу
        pending_requests = Request.objects.filter(status='pending')
        self.assertIn(pending_request, pending_requests)
        self.assertNotIn(completed_request, pending_requests)
        
        completed_requests = Request.objects.filter(status='completed')
        self.assertNotIn(pending_request, completed_requests)
        self.assertIn(completed_request, completed_requests)
    
    def test_request_search_by_text(self):
        """Тест поиска запросов по тексту"""
        request1 = RequestFactory(text="Поиск актера на роль главного героя")
        request2 = RequestFactory(text="Нужен актер для эпизодической роли")
        request3 = RequestFactory(text="Требуется каскадер для трюков")
        
        # Поиск по ключевому слову
        actor_requests = Request.objects.filter(text__icontains='актер')
        self.assertIn(request1, actor_requests)
        self.assertIn(request2, actor_requests)
        self.assertNotIn(request3, actor_requests)
        
        # Поиск по автору
        author_requests = Request.objects.filter(author_name__icontains=request1.author_name.split()[0])
        self.assertIn(request1, author_requests)
