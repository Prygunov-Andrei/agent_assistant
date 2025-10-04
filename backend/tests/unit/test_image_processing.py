"""
Тесты для сервиса обработки изображений
"""

import os
import tempfile
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from telegram_requests.image_processing import image_processing_service


class ImageProcessingServiceTestCase(TestCase):
    """Тесты для сервиса обработки изображений"""

    def setUp(self):
        """Настройка тестовых данных"""
        # Создаем тестовое изображение
        self.test_image = Image.new('RGB', (2000, 1500), color='red')
        
        # Сохраняем во временный файл
        self.temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        self.test_image.save(self.temp_file.name, format='JPEG', quality=95)
        self.temp_file.close()
        
        # Создаем Django файл
        with open(self.temp_file.name, 'rb') as f:
            self.uploaded_file = SimpleUploadedFile(
                'test_image.jpg',
                f.read(),
                content_type='image/jpeg'
            )

    def tearDown(self):
        """Очистка после тестов"""
        if os.path.exists(self.temp_file.name):
            os.unlink(self.temp_file.name)

    def test_optimize_image(self):
        """Тест оптимизации изображения"""
        # Оптимизируем изображение
        optimized = image_processing_service.optimize_image(
            self.uploaded_file,
            max_size=(1200, 1200),
            quality=85
        )
        
        self.assertIsNotNone(optimized)
        self.assertGreater(len(optimized.read()), 0)
        
        # Проверяем, что изображение было сжато
        optimized.seek(0)
        with Image.open(optimized) as img:
            self.assertLessEqual(img.size[0], 1200)
            self.assertLessEqual(img.size[1], 1200)

    def test_create_thumbnail(self):
        """Тест создания миниатюры"""
        # Создаем миниатюру
        thumbnail = image_processing_service.create_thumbnail(self.uploaded_file)
        
        self.assertIsNotNone(thumbnail)
        self.assertGreater(len(thumbnail.read()), 0)
        
        # Проверяем размер миниатюры
        thumbnail.seek(0)
        with Image.open(thumbnail) as img:
            self.assertEqual(img.size, (300, 300))

    def test_get_image_info(self):
        """Тест получения информации об изображении"""
        info = image_processing_service.get_image_info(self.uploaded_file)
        
        self.assertIsNotNone(info)
        self.assertEqual(info['width'], 2000)
        self.assertEqual(info['height'], 1500)
        self.assertEqual(info['format'], 'JPEG')
        self.assertEqual(info['mode'], 'RGB')
        self.assertGreater(info['size_bytes'], 0)
        self.assertFalse(info['has_transparency'])

    def test_optimize_image_without_max_size(self):
        """Тест оптимизации без ограничения размера"""
        optimized = image_processing_service.optimize_image(
            self.uploaded_file,
            quality=70
        )
        
        self.assertIsNotNone(optimized)
        
        # Изображение должно сохранить оригинальный размер
        optimized.seek(0)
        with Image.open(optimized) as img:
            self.assertEqual(img.size, (2000, 1500))

    def test_optimize_image_png_transparency(self):
        """Тест оптимизации PNG с прозрачностью"""
        # Создаем PNG с прозрачностью
        png_image = Image.new('RGBA', (500, 500), color=(255, 0, 0, 128))
        
        temp_png = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        png_image.save(temp_png.name, format='PNG')
        temp_png.close()
        
        try:
            with open(temp_png.name, 'rb') as f:
                png_file = SimpleUploadedFile(
                    'test_image.png',
                    f.read(),
                    content_type='image/png'
                )
            
            optimized = image_processing_service.optimize_image(png_file)
            
            self.assertIsNotNone(optimized)
            
            # PNG должен быть конвертирован в RGB
            optimized.seek(0)
            with Image.open(optimized) as img:
                self.assertEqual(img.mode, 'RGB')
                
        finally:
            if os.path.exists(temp_png.name):
                os.unlink(temp_png.name)

    def test_create_thumbnail_custom_size(self):
        """Тест создания миниатюры с кастомным размером"""
        thumbnail = image_processing_service.create_thumbnail(
            self.uploaded_file,
            size=(150, 150)
        )
        
        self.assertIsNotNone(thumbnail)
        
        thumbnail.seek(0)
        with Image.open(thumbnail) as img:
            self.assertEqual(img.size, (150, 150))

    def test_optimize_image_invalid_file(self):
        """Тест обработки невалидного файла"""
        invalid_file = SimpleUploadedFile(
            'invalid.txt',
            b'not an image',
            content_type='text/plain'
        )
        
        optimized = image_processing_service.optimize_image(invalid_file)
        self.assertIsNone(optimized)

    def test_create_thumbnail_invalid_file(self):
        """Тест создания миниатюры из невалидного файла"""
        invalid_file = SimpleUploadedFile(
            'invalid.txt',
            b'not an image',
            content_type='text/plain'
        )
        
        thumbnail = image_processing_service.create_thumbnail(invalid_file)
        self.assertIsNone(thumbnail)

    def test_get_image_info_invalid_file(self):
        """Тест получения информации о невалидном файле"""
        invalid_file = SimpleUploadedFile(
            'invalid.txt',
            b'not an image',
            content_type='text/plain'
        )
        
        info = image_processing_service.get_image_info(invalid_file)
        self.assertIsNone(info)
