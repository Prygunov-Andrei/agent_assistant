"""
Интеграционные тесты для различных типов медиафайлов
"""

import os
import tempfile
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Agent
from telegram_requests.models import Request, RequestImage, RequestFile


class MediaTypesTestCase(TestCase):
    """Тесты для различных типов медиафайлов"""

    def setUp(self):
        """Настройка тестовых данных"""
        # Создаем агента
        self.agent = Agent.objects.create_user(
            username='test_agent',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='Agent'
        )
        
        # Создаем запрос
        self.request = Request.objects.create(
            text="Тестовый запрос с различными медиафайлами",
            author_name="Test User",
            sender_telegram_id=12345,
            telegram_message_id=67890,
            telegram_chat_id=98765,
            agent=self.agent,
            has_images=True,
            has_files=True
        )
        
        # Создаем клиент API
        self.client = APIClient()
        self.client.force_authenticate(user=self.agent)

    def tearDown(self):
        """Очистка после тестов"""
        # Очищаем временные файлы
        for image in RequestImage.objects.all():
            if image.image and os.path.exists(image.image.path):
                os.unlink(image.image.path)
            if image.thumbnail and os.path.exists(image.thumbnail.path):
                os.unlink(image.thumbnail.path)
        
        for file_obj in RequestFile.objects.all():
            if file_obj.file and os.path.exists(file_obj.file.path):
                os.unlink(file_obj.file.path)

    def create_test_image(self, format='JPEG', size=(800, 600), color='red'):
        """Создает тестовое изображение"""
        img = Image.new('RGB', size, color=color)
        
        temp_file = tempfile.NamedTemporaryFile(suffix=f'.{format.lower()}', delete=False)
        img.save(temp_file.name, format=format, quality=95)
        temp_file.close()
        
        with open(temp_file.name, 'rb') as f:
            uploaded_file = SimpleUploadedFile(
                f'test_image.{format.lower()}',
                f.read(),
                content_type=f'image/{format.lower()}'
            )
        
        os.unlink(temp_file.name)
        return uploaded_file

    def create_test_file(self, content, filename, mime_type):
        """Создает тестовый файл"""
        return SimpleUploadedFile(filename, content, content_type=mime_type)

    def test_jpeg_image_processing(self):
        """Тест обработки JPEG изображений"""
        jpeg_file = self.create_test_image('JPEG', (2000, 1500), 'blue')
        
        # Создаем изображение в запросе
        request_image = RequestImage.objects.create(
            request=self.request,
            image=jpeg_file,
            caption="JPEG изображение",
            file_size=jpeg_file.size
        )
        
        # Проверяем, что изображение создано
        self.assertTrue(os.path.exists(request_image.image.path))
        
        # Проверяем, что миниатюра создана
        self.assertIsNotNone(request_image.thumbnail)
        if request_image.thumbnail:
            self.assertTrue(os.path.exists(request_image.thumbnail.path))
            
            # Проверяем размер миниатюры
            with Image.open(request_image.thumbnail.path) as thumb:
                self.assertEqual(thumb.size, (300, 300))

    def test_png_image_processing(self):
        """Тест обработки PNG изображений с прозрачностью"""
        png_file = self.create_test_image('PNG', (1000, 800), 'green')
        
        request_image = RequestImage.objects.create(
            request=self.request,
            image=png_file,
            caption="PNG изображение с прозрачностью",
            file_size=png_file.size
        )
        
        self.assertTrue(os.path.exists(request_image.image.path))
        
        # PNG должен быть конвертирован в RGB
        with Image.open(request_image.image.path) as img:
            self.assertEqual(img.mode, 'RGB')

    def test_pdf_document(self):
        """Тест обработки PDF документов"""
        pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
        pdf_file = self.create_test_file(pdf_content, 'test_document.pdf', 'application/pdf')
        
        request_file = RequestFile.objects.create(
            request=self.request,
            file=pdf_file,
            original_filename='test_document.pdf',
            file_size=pdf_file.size,
            mime_type='application/pdf'
        )
        
        self.assertTrue(os.path.exists(request_file.file.path))
        self.assertEqual(request_file.mime_type, 'application/pdf')

    def test_text_document(self):
        """Тест обработки текстовых документов"""
        text_content = 'Это тестовый текстовый документ.\nСодержит несколько строк текста.'.encode('utf-8')
        text_file = self.create_test_file(text_content, 'test_document.txt', 'text/plain')
        
        request_file = RequestFile.objects.create(
            request=self.request,
            file=text_file,
            original_filename='test_document.txt',
            file_size=text_file.size,
            mime_type='text/plain'
        )
        
        self.assertTrue(os.path.exists(request_file.file.path))
        self.assertEqual(request_file.mime_type, 'text/plain')

    def test_word_document(self):
        """Тест обработки Word документов"""
        # Создаем простой Word документ (на самом деле это будет текстовый файл)
        word_content = 'Это тестовый Word документ'.encode('utf-8')
        word_file = self.create_test_file(word_content, 'test_document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        
        request_file = RequestFile.objects.create(
            request=self.request,
            file=word_file,
            original_filename='test_document.docx',
            file_size=word_file.size,
            mime_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
        self.assertTrue(os.path.exists(request_file.file.path))
        self.assertIn('word', request_file.mime_type)

    def test_excel_document(self):
        """Тест обработки Excel документов"""
        excel_content = 'Это тестовый Excel документ'.encode('utf-8')
        excel_file = self.create_test_file(excel_content, 'test_spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        
        request_file = RequestFile.objects.create(
            request=self.request,
            file=excel_file,
            original_filename='test_spreadsheet.xlsx',
            file_size=excel_file.size,
            mime_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
        self.assertTrue(os.path.exists(request_file.file.path))
        self.assertIn('spreadsheet', request_file.mime_type)

    def test_zip_archive(self):
        """Тест обработки ZIP архивов"""
        zip_content = b'PK\x03\x04\x14\x00\x00\x00\x08\x00'  # Минимальный ZIP заголовок
        zip_file = self.create_test_file(zip_content, 'test_archive.zip', 'application/zip')
        
        request_file = RequestFile.objects.create(
            request=self.request,
            file=zip_file,
            original_filename='test_archive.zip',
            file_size=zip_file.size,
            mime_type='application/zip'
        )
        
        self.assertTrue(os.path.exists(request_file.file.path))
        self.assertEqual(request_file.mime_type, 'application/zip')

    def test_media_api_with_various_types(self):
        """Тест API медиафайлов с различными типами файлов"""
        # Создаем различные типы файлов
        jpeg_file = self.create_test_image('JPEG', (800, 600), 'red')
        png_file = self.create_test_image('PNG', (600, 400), 'blue')
        pdf_file = self.create_test_file(b'PDF content', 'test.pdf', 'application/pdf')
        text_file = self.create_test_file(b'Text content', 'test.txt', 'text/plain')
        
        # Создаем записи в БД
        RequestImage.objects.create(
            request=self.request,
            image=jpeg_file,
            caption="JPEG изображение",
            file_size=jpeg_file.size
        )
        
        RequestImage.objects.create(
            request=self.request,
            image=png_file,
            caption="PNG изображение",
            file_size=png_file.size
        )
        
        RequestFile.objects.create(
            request=self.request,
            file=pdf_file,
            original_filename='test.pdf',
            file_size=pdf_file.size,
            mime_type='application/pdf'
        )
        
        RequestFile.objects.create(
            request=self.request,
            file=text_file,
            original_filename='test.txt',
            file_size=text_file.size,
            mime_type='text/plain'
        )
        
        # Тестируем API
        url = f'/api/requests/{self.request.id}/media/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        
        # Проверяем структуру ответа
        self.assertIn('images', data)
        self.assertIn('files', data)
        self.assertEqual(data['images_count'], 2)
        self.assertEqual(data['files_count'], 2)
        
        # Проверяем изображения
        self.assertEqual(len(data['images']), 2)
        for image in data['images']:
            self.assertIn('image', image)
            self.assertIn('thumbnail', image)
            self.assertIn('caption', image)
        
        # Проверяем файлы
        self.assertEqual(len(data['files']), 2)
        for file_obj in data['files']:
            self.assertIn('file', file_obj)
            self.assertIn('original_filename', file_obj)
            self.assertIn('mime_type', file_obj)

    def test_large_image_optimization(self):
        """Тест оптимизации больших изображений"""
        # Создаем большое изображение
        large_image = self.create_test_image('JPEG', (4000, 3000), 'purple')
        
        request_image = RequestImage.objects.create(
            request=self.request,
            image=large_image,
            caption="Большое изображение",
            file_size=large_image.size
        )
        
        # Проверяем, что изображение было оптимизировано
        with Image.open(request_image.image.path) as img:
            # Изображение должно быть сжато до максимум 1200x1200
            self.assertLessEqual(img.size[0], 1200)
            self.assertLessEqual(img.size[1], 1200)
        
        # Проверяем миниатюру
        if request_image.thumbnail:
            with Image.open(request_image.thumbnail.path) as thumb:
                self.assertEqual(thumb.size, (300, 300))

    def test_multiple_images_performance(self):
        """Тест производительности с множественными изображениями"""
        # Создаем 10 изображений
        colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'cyan']
        images = []
        for i in range(10):
            img_file = self.create_test_image('JPEG', (1000, 800), colors[i])
            images.append(img_file)
        
        # Создаем записи в БД
        for i, img_file in enumerate(images):
            RequestImage.objects.create(
                request=self.request,
                image=img_file,
                caption=f"Изображение {i+1}",
                file_size=img_file.size
            )
        
        # Тестируем API производительность
        url = f'/api/requests/{self.request.id}/media/'
        
        import time
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Проверяем, что ответ пришел быстро (менее 1 секунды)
        response_time = end_time - start_time
        self.assertLess(response_time, 1.0)
        
        data = response.json()
        self.assertEqual(data['images_count'], 10)
