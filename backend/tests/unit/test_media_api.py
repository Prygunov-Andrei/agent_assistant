"""
Тесты для API медиафайлов запросов
"""
import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

from telegram_requests.models import Request, RequestImage, RequestFile
from users.models import Agent
from .users.factories import AgentFactory
from .telegram_requests.factories import RequestFactory


class MediaAPITestCase(APITestCase):
    """Тесты для API медиафайлов"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        # Очищаем кэш перед каждым тестом
        cache.clear()
        
        # Создаем агента
        self.agent = AgentFactory()
        
        # Создаем запрос
        self.request = RequestFactory(
            agent=self.agent,
            has_images=True,
            has_files=True
        )
        
        # Аутентификация
        self.client.force_authenticate(user=self.agent)
    
    def tearDown(self):
        """Очистка после тестов"""
        cache.clear()
    
    def create_test_image(self, name='test_image.jpg'):
        """Создает тестовое изображение"""
        image = Image.new('RGB', (100, 100), color='red')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        
        return SimpleUploadedFile(
            name=name,
            content=image_io.getvalue(),
            content_type='image/jpeg'
        )
    
    def create_test_file(self, name='test_file.txt'):
        """Создает тестовый файл"""
        return SimpleUploadedFile(
            name=name,
            content=b'Test file content',
            content_type='text/plain'
        )
    
    def test_get_request_media_success(self):
        """Тест успешного получения медиафайлов запроса"""
        # Создаем тестовые изображения
        image1 = self.create_test_image('test1.jpg')
        image2 = self.create_test_image('test2.jpg')
        
        RequestImage.objects.create(
            request=self.request,
            image=image1,
            caption='Test image 1',
            file_size=1024
        )
        RequestImage.objects.create(
            request=self.request,
            image=image2,
            caption='Test image 2',
            file_size=2048
        )
        
        # Создаем тестовые файлы
        file1 = self.create_test_file('test1.txt')
        file2 = self.create_test_file('test2.txt')
        
        RequestFile.objects.create(
            request=self.request,
            file=file1,
            original_filename='test1.txt',
            file_size=512,
            mime_type='text/plain'
        )
        RequestFile.objects.create(
            request=self.request,
            file=file2,
            original_filename='test2.txt',
            file_size=1024,
            mime_type='text/plain'
        )
        
        # Выполняем запрос
        url = reverse('request-media', kwargs={'pk': self.request.pk})
        response = self.client.get(url)
        
        # Проверяем ответ
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], self.request.pk)
        self.assertTrue(data['has_images'])
        self.assertTrue(data['has_files'])
        self.assertEqual(len(data['images']), 2)
        self.assertEqual(len(data['files']), 2)
        self.assertEqual(data['images_count'], 2)
        self.assertEqual(data['files_count'], 2)
        self.assertEqual(data['total_size'], 1024 + 2048 + 512 + 1024)
        self.assertFalse(data['cached'])  # Первый запрос не из кэша
    
    def test_get_request_media_cached(self):
        """Тест получения медиафайлов из кэша"""
        # Создаем тестовые данные
        image = self.create_test_image()
        RequestImage.objects.create(
            request=self.request,
            image=image,
            caption='Test image',
            file_size=1024
        )
        
        # Первый запрос (заполняет кэш)
        url = reverse('request-media', kwargs={'pk': self.request.pk})
        response1 = self.client.get(url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertFalse(response1.json()['cached'])
        
        # Второй запрос (должен быть из кэша)
        response2 = self.client.get(url)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertTrue(response2.json()['cached'])
    
    def test_get_request_media_no_media(self):
        """Тест получения медиафайлов для запроса без медиа"""
        # Создаем запрос без медиа
        request_no_media = RequestFactory(
            agent=self.agent,
            has_images=False,
            has_files=False
        )
        
        url = reverse('request-media', kwargs={'pk': request_no_media.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], request_no_media.pk)
        self.assertFalse(data['has_images'])
        self.assertFalse(data['has_files'])
        self.assertEqual(len(data['images']), 0)
        self.assertEqual(len(data['files']), 0)
        self.assertEqual(data['images_count'], 0)
        self.assertEqual(data['files_count'], 0)
        self.assertEqual(data['total_size'], 0)
    
    def test_get_request_media_unauthorized(self):
        """Тест получения медиафайлов без аутентификации"""
        self.client.logout()
        
        url = reverse('request-media', kwargs={'pk': self.request.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_request_media_not_found(self):
        """Тест получения медиафайлов несуществующего запроса"""
        url = reverse('request-media', kwargs={'pk': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_clear_media_cache_success(self):
        """Тест успешной очистки кэша медиафайлов"""
        # Создаем тестовые данные и заполняем кэш
        image = self.create_test_image()
        RequestImage.objects.create(
            request=self.request,
            image=image,
            caption='Test image',
            file_size=1024
        )
        
        # Первый запрос (заполняет кэш)
        url = reverse('request-media', kwargs={'pk': self.request.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Очищаем кэш
        clear_url = reverse('request-media-clear-cache', kwargs={'pk': self.request.pk})
        response = self.client.post(clear_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['request_id'], self.request.pk)
        self.assertIn('очищен', data['message'])
    
    def test_clear_media_cache_not_found(self):
        """Тест очистки кэша несуществующего запроса"""
        clear_url = reverse('request-media-clear-cache', kwargs={'pk': 99999})
        response = self.client.post(clear_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_clear_media_cache_unauthorized(self):
        """Тест очистки кэша без аутентификации"""
        self.client.logout()
        
        clear_url = reverse('request-media-clear-cache', kwargs={'pk': self.request.pk})
        response = self.client.post(clear_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MediaCacheServiceTestCase(TestCase):
    """Тесты для сервиса кэширования медиафайлов"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        cache.clear()
        
        self.request = RequestFactory()
        self.test_data = {
            'images': [{'id': 1, 'url': 'test.jpg'}],
            'files': [{'id': 1, 'url': 'test.txt'}]
        }
    
    def tearDown(self):
        """Очистка после тестов"""
        cache.clear()
    
    def test_cache_key_generation(self):
        """Тест генерации ключей кэша"""
        from telegram_requests.media_cache import MediaCacheService
        
        images_key = MediaCacheService.get_cache_key(123, 'images')
        files_key = MediaCacheService.get_cache_key(123, 'files')
        
        self.assertEqual(images_key, 'request_media_123_images')
        self.assertEqual(files_key, 'request_media_123_files')
    
    def test_cache_set_and_get(self):
        """Тест сохранения и получения из кэша"""
        from telegram_requests.media_cache import MediaCacheService
        
        # Сохраняем данные в кэш
        MediaCacheService.set_media_to_cache(
            self.request.id,
            self.test_data['images'],
            self.test_data['files']
        )
        
        # Получаем данные из кэша
        cached_data = MediaCacheService.get_media_from_cache(self.request.id)
        
        self.assertTrue(cached_data['cached'])
        self.assertEqual(cached_data['images'], self.test_data['images'])
        self.assertEqual(cached_data['files'], self.test_data['files'])
    
    def test_cache_clear(self):
        """Тест очистки кэша"""
        from telegram_requests.media_cache import MediaCacheService
        
        # Сохраняем данные в кэш
        MediaCacheService.set_media_to_cache(
            self.request.id,
            self.test_data['images'],
            self.test_data['files']
        )
        
        # Проверяем, что данные есть в кэше
        cached_data = MediaCacheService.get_media_from_cache(self.request.id)
        self.assertTrue(cached_data['cached'])
        
        # Очищаем кэш
        MediaCacheService.clear_media_cache(self.request.id)
        
        # Проверяем, что данные удалены из кэша
        cached_data = MediaCacheService.get_media_from_cache(self.request.id)
        self.assertFalse(cached_data['cached'])
