import pytest
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.base import ContentFile

from telegram_requests.services import TelegramFileService
from telegram_requests.models import Request, RequestImage, RequestFile
from tests.unit.telegram_requests.factories import RequestFactory
from tests.unit.users.factories import AgentFactory


class TelegramFileServiceTest(TestCase):
    """Тесты для сервиса работы с файлами Telegram"""
    
    def setUp(self):
        self.agent = AgentFactory()
        self.request = RequestFactory(created_by=self.agent)
        self.service = TelegramFileService(bot_token="test_token")
        
    def test_init_without_token(self):
        """Тест инициализации без токена"""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                TelegramFileService()
    
    def test_init_with_token(self):
        """Тест инициализации с токеном"""
        service = TelegramFileService(bot_token="test_token")
        self.assertEqual(service.bot_token, "test_token")
        self.assertEqual(service.api_url, "https://api.telegram.org/bottest_token")
    
    @patch('telegram_requests.services.requests.get')
    def test_get_file_path_success(self, mock_get):
        """Тест успешного получения пути к файлу"""
        # Настраиваем мок
        mock_response = Mock()
        mock_response.json.return_value = {
            'ok': True,
            'result': {
                'file_path': 'photos/file_123.jpg'
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Тестируем
        result = self.service.get_file_path("test_file_id")
        
        # Проверяем
        self.assertEqual(result, "photos/file_123.jpg")
        mock_get.assert_called_once_with(
            "https://api.telegram.org/bottest_token/getFile",
            params={'file_id': 'test_file_id'},
            timeout=10
        )
    
    @patch('telegram_requests.services.requests.get')
    def test_get_file_path_failure(self, mock_get):
        """Тест неудачного получения пути к файлу"""
        # Настраиваем мок
        mock_response = Mock()
        mock_response.json.return_value = {'ok': False}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Тестируем
        result = self.service.get_file_path("test_file_id")
        
        # Проверяем
        self.assertIsNone(result)
    
    @patch('telegram_requests.services.requests.get')
    def test_get_file_path_network_error(self, mock_get):
        """Тест ошибки сети при получении пути к файлу"""
        # Настраиваем мок для вызова исключения
        from requests import RequestException
        mock_get.side_effect = RequestException("Network error")
        
        # Тестируем
        result = self.service.get_file_path("test_file_id")
        
        # Проверяем
        self.assertIsNone(result)
    
    @patch('telegram_requests.services.requests.get')
    def test_download_file_success(self, mock_get):
        """Тест успешного скачивания файла"""
        # Настраиваем мок
        test_content = b"test file content"
        mock_response = Mock()
        mock_response.content = test_content
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Тестируем
        result = self.service.download_file("photos/file_123.jpg")
        
        # Проверяем
        self.assertEqual(result, test_content)
        mock_get.assert_called_once_with(
            "https://api.telegram.org/file/bottest_token/photos/file_123.jpg",
            timeout=30
        )
    
    @patch('telegram_requests.services.requests.get')
    def test_download_file_network_error(self, mock_get):
        """Тест ошибки сети при скачивании файла"""
        # Настраиваем мок для вызова исключения
        from requests import RequestException
        mock_get.side_effect = RequestException("Network error")
        
        # Тестируем
        result = self.service.download_file("photos/file_123.jpg")
        
        # Проверяем
        self.assertIsNone(result)
    
    @patch.object(TelegramFileService, 'get_file_path')
    @patch.object(TelegramFileService, 'download_file')
    def test_download_telegram_file_success(self, mock_download, mock_get_path):
        """Тест успешного скачивания файла по file_id"""
        # Настраиваем моки
        mock_get_path.return_value = "photos/file_123.jpg"
        mock_download.return_value = b"test content"
        
        # Тестируем
        result = self.service.download_telegram_file("test_file_id")
        
        # Проверяем
        self.assertIsNotNone(result)
        content, filename = result
        self.assertEqual(content, b"test content")
        self.assertEqual(filename, "file_123.jpg")
    
    @patch.object(TelegramFileService, 'get_file_path')
    @patch.object(TelegramFileService, 'download_file')
    def test_download_telegram_file_too_large(self, mock_download, mock_get_path):
        """Тест скачивания слишком большого файла"""
        # Настраиваем моки
        mock_get_path.return_value = "photos/file_123.jpg"
        # Создаем большой файл (21MB)
        large_content = b"x" * (21 * 1024 * 1024)
        mock_download.return_value = large_content
        
        # Тестируем
        result = self.service.download_telegram_file("test_file_id", max_size_mb=20)
        
        # Проверяем
        self.assertIsNone(result)
    
    @patch.object(TelegramFileService, 'download_telegram_file')
    def test_save_image_from_telegram_success(self, mock_download):
        """Тест успешного сохранения изображения"""
        # Настраиваем мок
        test_content = b"fake image content"
        mock_download.return_value = (test_content, "test_image.jpg")
        
        # Тестируем
        result = self.service.save_image_from_telegram("test_file_id", self.request)
        
        # Проверяем
        self.assertIsNotNone(result)
        self.assertIsInstance(result, RequestImage)
        self.assertEqual(result.request, self.request)
        self.assertEqual(result.telegram_file_id, "test_file_id")
        self.assertEqual(result.file_size, len(test_content))
        self.assertEqual(result.created_by, self.agent)
        
        # Проверяем, что файл был сохранен
        self.assertTrue(result.image)
        self.assertTrue(result.image.name.endswith('.jpg'))
    
    @patch.object(TelegramFileService, 'download_telegram_file')
    def test_save_image_from_telegram_failure(self, mock_download):
        """Тест неудачного сохранения изображения"""
        # Настраиваем мок для возврата None
        mock_download.return_value = None
        
        # Тестируем
        result = self.service.save_image_from_telegram("test_file_id", self.request)
        
        # Проверяем
        self.assertIsNone(result)
    
    @patch.object(TelegramFileService, 'download_telegram_file')
    def test_save_document_from_telegram_success(self, mock_download):
        """Тест успешного сохранения документа"""
        # Настраиваем мок
        test_content = b"fake document content"
        mock_download.return_value = (test_content, "test_document.pdf")
        
        document_data = {
            'file_id': 'test_file_id',
            'file_name': 'test_document.pdf',
            'file_size': 1024,
            'mime_type': 'application/pdf'
        }
        
        # Тестируем
        result = self.service.save_document_from_telegram("test_file_id", document_data, self.request)
        
        # Проверяем
        self.assertIsNotNone(result)
        self.assertIsInstance(result, RequestFile)
        self.assertEqual(result.request, self.request)
        self.assertEqual(result.telegram_file_id, "test_file_id")
        self.assertEqual(result.original_filename, "test_document.pdf")
        self.assertEqual(result.file_size, 1024)
        self.assertEqual(result.mime_type, "application/pdf")
        self.assertEqual(result.created_by, self.agent)
        
        # Проверяем, что файл был сохранен
        self.assertTrue(result.file)
    
    @patch.object(TelegramFileService, 'download_telegram_file')
    def test_save_document_from_telegram_failure(self, mock_download):
        """Тест неудачного сохранения документа"""
        # Настраиваем мок для возврата None
        mock_download.return_value = None
        
        document_data = {
            'file_id': 'test_file_id',
            'file_name': 'test_document.pdf',
            'file_size': 1024,
            'mime_type': 'application/pdf'
        }
        
        # Тестируем
        result = self.service.save_document_from_telegram("test_file_id", document_data, self.request)
        
        # Проверяем
        self.assertIsNone(result)


class TelegramFileServiceIntegrationTest(TestCase):
    """Интеграционные тесты для сервиса работы с файлами Telegram"""
    
    def setUp(self):
        self.agent = AgentFactory()
        self.request = RequestFactory(created_by=self.agent)
    
    def test_service_initialization(self):
        """Тест инициализации сервиса"""
        with patch.dict(os.environ, {'BOT_TOKEN': 'test_token'}):
            service = TelegramFileService()
            self.assertEqual(service.bot_token, 'test_token')
    
    def test_api_url_construction(self):
        """Тест построения URL для API"""
        service = TelegramFileService(bot_token="test_token")
        self.assertEqual(service.api_url, "https://api.telegram.org/bottest_token")
    
    @patch('telegram_requests.services.requests.get')
    def test_full_workflow_success(self, mock_get):
        """Тест полного рабочего процесса успешного скачивания"""
        # Настраиваем моки для полного цикла
        # 1. getFile
        mock_response_1 = Mock()
        mock_response_1.json.return_value = {
            'ok': True,
            'result': {'file_path': 'photos/test_image.jpg'}
        }
        mock_response_1.raise_for_status.return_value = None
        
        # 2. download file
        mock_response_2 = Mock()
        mock_response_2.content = b"fake image content"
        mock_response_2.raise_for_status.return_value = None
        
        # Настраиваем последовательность вызовов
        mock_get.side_effect = [mock_response_1, mock_response_2]
        
        # Создаем сервис и тестируем
        service = TelegramFileService(bot_token="test_token")
        
        # Тестируем полный процесс
        result = service.download_telegram_file("test_file_id")
        
        # Проверяем результат
        self.assertIsNotNone(result)
        content, filename = result
        self.assertEqual(content, b"fake image content")
        self.assertEqual(filename, "test_image.jpg")
        
        # Проверяем, что были сделаны оба вызова
        self.assertEqual(mock_get.call_count, 2)
