import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from django.test import TestCase
from django.utils import timezone
from datetime import datetime, timedelta

from telegram_requests.bot.bot import CastingAgencyBot
from telegram_requests.models import Request
from .factories import TelegramWebhookDataFactory


class TelegramRequestsBotTest(TestCase):
    """Тесты для TelegramRequestsBot"""
    
    def setUp(self):
        self.bot = CastingAgencyBot()
    
    def test_bot_initialization(self):
        """Тест инициализации бота"""
        self.assertIsNone(self.bot.application)
        self.assertIsNotNone(self.bot.api_base)
    
    def test_get_author_info_regular_message(self):
        """Тест получения информации об авторе обычного сообщения"""
        # Мокаем пользователя
        mock_user = Mock()
        mock_user.id = 123456789
        mock_user.username = 'testuser'
        mock_user.first_name = 'Test'
        mock_user.last_name = 'User'
        
        # Мокаем сообщение
        mock_message = Mock()
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        result = self.bot._get_author_info(mock_message, mock_user)
        
        self.assertEqual(result['telegram_id'], 123456789)
        self.assertEqual(result['name'], 'Test User')
        self.assertEqual(result['username'], 'testuser')
        self.assertEqual(result['first_name'], 'Test')
        self.assertEqual(result['last_name'], 'User')
        self.assertFalse(result['is_forwarded'])
    
    def test_get_author_info_forwarded_message(self):
        """Тест получения информации об авторе пересланного сообщения"""
        # Мокаем оригинального пользователя
        mock_original_user = Mock()
        mock_original_user.id = 987654321
        mock_original_user.username = 'originaluser'
        mock_original_user.first_name = 'Original'
        mock_original_user.last_name = 'User'
        
        # Мокаем отправителя
        mock_sender = Mock()
        mock_sender.id = 123456789
        
        # Мокаем сообщение
        mock_message = Mock()
        mock_message.forward_from = mock_original_user
        mock_message.forward_from_chat = None
        
        result = self.bot._get_author_info(mock_message, mock_sender)
        
        self.assertEqual(result['telegram_id'], 123456789)  # ID того, кто переслал
        self.assertEqual(result['name'], 'Original User')
        self.assertEqual(result['username'], 'originaluser')
        self.assertEqual(result['first_name'], 'Original')
        self.assertEqual(result['last_name'], 'User')
        self.assertTrue(result['is_forwarded'])
    
    def test_get_author_info_forwarded_from_chat(self):
        """Тест получения информации об авторе сообщения, пересланного из чата"""
        # Мокаем чат
        mock_chat = Mock()
        mock_chat.id = 555666777
        mock_chat.title = 'Test Channel'
        
        # Мокаем отправителя
        mock_sender = Mock()
        mock_sender.id = 123456789
        
        # Мокаем сообщение
        mock_message = Mock()
        mock_message.forward_from = None
        mock_message.forward_from_chat = mock_chat
        
        result = self.bot._get_author_info(mock_message, mock_sender)
        
        self.assertEqual(result['telegram_id'], 123456789)  # ID того, кто переслал
        self.assertEqual(result['name'], 'Test Channel')
        self.assertIsNone(result['username'])
        self.assertIsNone(result['first_name'])
        self.assertIsNone(result['last_name'])
        self.assertTrue(result['is_forwarded'])
    
    def test_get_author_info_with_full_name(self):
        """Тест получения информации об авторе с полным именем"""
        mock_user = Mock()
        mock_user.first_name = 'John'
        mock_user.last_name = 'Doe'
        mock_user.username = 'johndoe'
        mock_user.id = 123456789
        
        mock_message = Mock()
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        result = self.bot._get_author_info(mock_message, mock_user)
        self.assertEqual(result['name'], 'John Doe')
        self.assertEqual(result['telegram_id'], 123456789)
        self.assertFalse(result['is_forwarded'])
    
    def test_get_author_info_with_first_name_only(self):
        """Тест получения информации об авторе только с именем"""
        mock_user = Mock()
        mock_user.first_name = 'John'
        mock_user.last_name = None
        mock_user.username = 'johndoe'
        mock_user.id = 123456789
        
        mock_message = Mock()
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        result = self.bot._get_author_info(mock_message, mock_user)
        self.assertEqual(result['name'], 'John')
        self.assertEqual(result['telegram_id'], 123456789)
    
    def test_get_author_info_with_username_only(self):
        """Тест получения информации об авторе только с username"""
        mock_user = Mock()
        mock_user.first_name = None
        mock_user.last_name = None
        mock_user.username = 'johndoe'
        mock_user.id = 123456789
        
        mock_message = Mock()
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        result = self.bot._get_author_info(mock_message, mock_user)
        self.assertEqual(result['name'], 'johndoe')
        self.assertEqual(result['telegram_id'], 123456789)
    
    def test_get_author_info_with_id_only(self):
        """Тест получения информации об авторе только с ID"""
        mock_user = Mock()
        mock_user.first_name = None
        mock_user.last_name = None
        mock_user.username = None
        mock_user.id = 123456789
        
        mock_message = Mock()
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        result = self.bot._get_author_info(mock_message, mock_user)
        self.assertEqual(result['name'], 'User_123456789')
        self.assertEqual(result['telegram_id'], 123456789)
    
    @pytest.mark.asyncio
    async def test_handle_message_text_content(self):
        """Тест обработки текстового сообщения в handle_message"""
        # Мокаем пользователя и сообщение
        mock_user = Mock()
        mock_user.id = 123456789
        mock_user.username = 'testuser'
        mock_user.first_name = 'Test'
        mock_user.last_name = 'User'
        
        mock_message = AsyncMock()
        mock_message.text = "Тестовое сообщение"
        mock_message.caption = None
        mock_message.photo = None
        mock_message.document = None
        mock_message.media_group_id = None
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        mock_message.message_id = 1
        mock_message.chat.id = 123456789
        mock_message.date = datetime.now()
        
        mock_update = Mock()
        mock_update.effective_user = mock_user
        mock_update.message = mock_message
        
        mock_context = Mock()
        
        # Мокаем API вызов
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {'status': 'ok'}
            
            await self.bot.handle_message(mock_update, mock_context)
            
            # Проверяем, что API был вызван с правильными данными
            mock_post.assert_called_once()
            call_args = mock_post.call_args
            self.assertIn('webhook/telegram/webhook/', call_args[0][0])
            self.assertEqual(call_args[1]['json']['message']['text'], "Тестовое сообщение")
    
    @pytest.mark.asyncio
    async def test_handle_message_with_caption(self):
        """Тест обработки сообщения с подписью"""
        mock_user = Mock()
        mock_user.id = 123456789
        mock_user.username = 'testuser'
        mock_user.first_name = 'Test'
        mock_user.last_name = 'User'
        
        mock_message = AsyncMock()
        mock_message.text = None
        mock_message.caption = "Подпись к изображению"
        mock_message.photo = None
        mock_message.document = None
        mock_message.media_group_id = None
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        mock_message.message_id = 1
        mock_message.chat.id = 123456789
        mock_message.date = datetime.now()
        
        mock_update = Mock()
        mock_update.effective_user = mock_user
        mock_update.message = mock_message
        
        mock_context = Mock()
        
        with patch('requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {'status': 'ok'}
            
            await self.bot.handle_message(mock_update, mock_context)
            
            call_args = mock_post.call_args
            self.assertEqual(call_args[1]['json']['message']['text'], "Подпись к изображению")
    
    @patch('telegram_requests.bot.bot.requests.post')
    @pytest.mark.asyncio
    async def test_handle_message_success(self, mock_post):
        """Тест успешной обработки сообщения"""
        # Мокаем успешный ответ API
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'ok',
            'request_id': 123
        }
        mock_post.return_value = mock_response
        
        # Мокаем пользователя и сообщение
        mock_user = Mock()
        mock_user.id = 123456789
        mock_user.username = 'testuser'
        mock_user.first_name = 'Test'
        mock_user.last_name = 'User'
        
        mock_message = Mock()
        mock_message.message_id = 987654321
        mock_message.chat_id = 123456789
        mock_message.text = "Тестовое сообщение"
        mock_message.date = datetime.now()
        mock_message.photo = None
        mock_message.document = None
        mock_message.media_group_id = None
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        mock_update = Mock()
        mock_update.message = mock_message
        mock_update.effective_user = mock_user
        
        # Мокаем reply_text
        mock_message.reply_text = AsyncMock()
        
        # Вызываем handle_message
        await self.bot.handle_message(mock_update, None)
        
        # Проверяем, что API был вызван
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        
        # Проверяем URL
        self.assertIn('/webhook/telegram/webhook/', call_args[0][0])
        
        # Проверяем данные
        webhook_data = call_args[1]['json']
        self.assertIn('message', webhook_data)
        self.assertEqual(webhook_data['message']['text'], "Тестовое сообщение")
        
        # Проверяем, что было отправлено подтверждение
        mock_message.reply_text.assert_called_once()
    
    @patch('telegram_requests.bot.bot.requests.post')
    @pytest.mark.asyncio
    async def test_handle_message_api_error(self, mock_post):
        """Тест обработки ошибки API"""
        # Мокаем ошибку API
        mock_response = Mock()
        mock_response.status_code = 500
        mock_post.return_value = mock_response
        
        # Мокаем пользователя и сообщение
        mock_user = Mock()
        mock_user.id = 123456789
        mock_user.username = 'testuser'
        mock_user.first_name = 'Test'
        mock_user.last_name = 'User'
        
        mock_message = Mock()
        mock_message.message_id = 987654321
        mock_message.chat_id = 123456789
        mock_message.text = "Тестовое сообщение"
        mock_message.date = datetime.now()
        mock_message.photo = None
        mock_message.document = None
        mock_message.media_group_id = None
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        mock_update = Mock()
        mock_update.message = mock_message
        mock_update.effective_user = mock_user
        
        # Мокаем reply_text
        mock_message.reply_text = AsyncMock()
        
        # Вызываем handle_message
        await self.bot.handle_message(mock_update, None)
        
        # Проверяем, что было отправлено сообщение об ошибке
        mock_message.reply_text.assert_called_once()
        call_args = mock_message.reply_text.call_args[0]
        self.assertIn("Ошибка при отправке запроса", call_args[0])
    
    @patch('telegram_requests.bot.bot.requests.post')
    @pytest.mark.asyncio
    async def test_handle_message_network_error(self, mock_post):
        """Тест обработки сетевой ошибки"""
        # Мокаем сетевую ошибку
        import requests
        mock_post.side_effect = requests.exceptions.RequestException("Network error")
        
        # Мокаем пользователя и сообщение
        mock_user = Mock()
        mock_user.id = 123456789
        mock_user.username = 'testuser'
        mock_user.first_name = 'Test'
        mock_user.last_name = 'User'
        
        mock_message = Mock()
        mock_message.message_id = 987654321
        mock_message.chat_id = 123456789
        mock_message.text = "Тестовое сообщение"
        mock_message.date = datetime.now()
        mock_message.photo = None
        mock_message.document = None
        mock_message.media_group_id = None
        mock_message.forward_from = None
        mock_message.forward_from_chat = None
        
        mock_update = Mock()
        mock_update.message = mock_message
        mock_update.effective_user = mock_user
        
        # Мокаем reply_text
        mock_message.reply_text = AsyncMock()
        
        # Вызываем handle_message
        await self.bot.handle_message(mock_update, None)
        
        # Проверяем, что было отправлено сообщение об ошибке
        mock_message.reply_text.assert_called_once()
        call_args = mock_message.reply_text.call_args[0]
        self.assertIn("Ошибка подключения", call_args[0])
    
    @patch('telegram_requests.bot.bot.requests.post')
    @pytest.mark.asyncio
    async def test_handle_message_forwarded(self, mock_post):
        """Тест обработки пересланного сообщения"""
        # Мокаем успешный ответ API
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'ok',
            'request_id': 123
        }
        mock_post.return_value = mock_response
        
        # Мокаем оригинального пользователя
        mock_original_user = Mock()
        mock_original_user.id = 987654321
        mock_original_user.username = 'originaluser'
        mock_original_user.first_name = 'Original'
        mock_original_user.last_name = 'User'
        
        # Мокаем отправителя
        mock_sender = Mock()
        mock_sender.id = 123456789
        mock_sender.username = 'sender'
        mock_sender.first_name = 'Sender'
        mock_sender.last_name = 'User'
        
        mock_message = Mock()
        mock_message.message_id = 987654321
        mock_message.chat_id = 123456789
        mock_message.text = "Пересланное сообщение"
        mock_message.date = datetime.now()
        mock_message.photo = None
        mock_message.document = None
        mock_message.media_group_id = None
        mock_message.forward_from = mock_original_user
        mock_message.forward_from_chat = None
        
        mock_update = Mock()
        mock_update.message = mock_message
        mock_update.effective_user = mock_sender
        
        # Мокаем reply_text
        mock_message.reply_text = AsyncMock()
        
        # Вызываем handle_message
        await self.bot.handle_message(mock_update, None)
        
        # Проверяем данные в webhook
        call_args = mock_post.call_args
        webhook_data = call_args[1]['json']
        message_data = webhook_data['message']
        
        # ID должен быть того, кто переслал (для уведомлений)
        self.assertEqual(message_data['from']['id'], 123456789)
        self.assertEqual(message_data['from']['first_name'], 'Sender')
        self.assertEqual(message_data['from']['last_name'], 'User')
        
        # Проверяем, что было отправлено сообщение о пересланном запросе
        mock_message.reply_text.assert_called_once()
        call_args = mock_message.reply_text.call_args[0]
        self.assertIn("Original User", call_args[0])


class TelegramWebhookDataFactoryTest(TestCase):
    """Тесты для TelegramWebhookDataFactory"""
    
    def test_create_text_message(self):
        """Тест создания данных для текстового сообщения"""
        webhook_data = TelegramWebhookDataFactory.create_text_message()
        
        self.assertIn('message', webhook_data)
        message = webhook_data['message']
        
        # Проверяем структуру данных
        self.assertIn('from', message)
        self.assertIn('message_id', message)
        self.assertIn('text', message)
        self.assertIn('date', message)
        
        # Проверяем типы
        self.assertIsInstance(message['from']['id'], int)
        self.assertIsInstance(message['message_id'], int)
        self.assertIsInstance(message['text'], str)
        self.assertIsInstance(message['date'], int)
    
    def test_create_text_message_forwarded(self):
        """Тест создания данных для пересланного текстового сообщения"""
        webhook_data = TelegramWebhookDataFactory.create_text_message(forwarded=True)
        
        message = webhook_data['message']
        self.assertIn('forward_from', message)
        
        forward_from = message['forward_from']
        self.assertIn('id', forward_from)
        self.assertIn('username', forward_from)
        self.assertIn('first_name', forward_from)
        self.assertIn('last_name', forward_from)
    
    def test_create_photo_message(self):
        """Тест создания данных для сообщения с фотографией"""
        webhook_data = TelegramWebhookDataFactory.create_photo_message()
        
        message = webhook_data['message']
        self.assertIn('photo', message)
        
        photo = message['photo'][0]
        self.assertIn('file_id', photo)
        self.assertIn('file_size', photo)
        self.assertIn('width', photo)
        self.assertIn('height', photo)
    
    def test_create_document_message(self):
        """Тест создания данных для сообщения с документом"""
        webhook_data = TelegramWebhookDataFactory.create_document_message()
        
        message = webhook_data['message']
        self.assertIn('document', message)
        
        document = message['document']
        self.assertIn('file_id', document)
        self.assertIn('file_name', document)
        self.assertIn('file_size', document)
        self.assertIn('mime_type', document)
    
    def test_create_empty_message(self):
        """Тест создания данных для пустого сообщения"""
        webhook_data = TelegramWebhookDataFactory.create_empty_message()
        
        message = webhook_data['message']
        self.assertNotIn('text', message)
        self.assertNotIn('photo', message)
        self.assertNotIn('document', message)
        
        # Проверяем основные поля
        self.assertIn('from', message)
        self.assertIn('message_id', message)
        self.assertIn('date', message)
