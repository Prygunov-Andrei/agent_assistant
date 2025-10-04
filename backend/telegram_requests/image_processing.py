"""
Сервис для обработки и сжатия изображений
"""

import os
import logging
from io import BytesIO
from PIL import Image, ImageOps
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)


class ImageProcessingService:
    """Сервис для обработки изображений"""
    
    # Качество сжатия JPEG (0-100)
    JPEG_QUALITY = 85
    
    # Максимальные размеры для превью
    THUMBNAIL_SIZE = (300, 300)
    
    # Максимальные размеры для оптимизированного изображения
    OPTIMIZED_SIZE = (1200, 1200)
    
    @staticmethod
    def optimize_image(image_file, max_size=None, quality=None):
        """
        Оптимизирует изображение для веб-отображения
        
        Args:
            image_file: Файл изображения
            max_size: Максимальный размер (width, height)
            quality: Качество JPEG (0-100)
            
        Returns:
            Оптимизированный файл изображения
        """
        try:
            # Открываем изображение
            with Image.open(image_file) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Поворачиваем изображение согласно EXIF данным
                img = ImageOps.exif_transpose(img)
                
                # Получаем размеры
                original_size = img.size
                
                # Если указан максимальный размер, масштабируем
                if max_size:
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Сжимаем изображение
                output = BytesIO()
                img.save(
                    output,
                    format='JPEG',
                    quality=quality or ImageProcessingService.JPEG_QUALITY,
                    optimize=True
                )
                
                output.seek(0)
                
                # Логируем информацию о сжатии
                original_size_kb = image_file.size / 1024
                compressed_size_kb = len(output.getvalue()) / 1024
                compression_ratio = (1 - len(output.getvalue()) / image_file.size) * 100
                
                logger.info(
                    f"Изображение оптимизировано: "
                    f"{original_size} -> {img.size}, "
                    f"{original_size_kb:.1f}KB -> {compressed_size_kb:.1f}KB "
                    f"({compression_ratio:.1f}% сжатие)"
                )
                
                return ContentFile(output.getvalue())
                
        except Exception as e:
            logger.error(f"Ошибка оптимизации изображения: {str(e)}")
            return None
    
    @staticmethod
    def create_thumbnail(image_file, size=None):
        """
        Создает миниатюру изображения
        
        Args:
            image_file: Файл изображения
            size: Размер миниатюры (width, height)
            
        Returns:
            Файл миниатюры
        """
        try:
            with Image.open(image_file) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Поворачиваем изображение согласно EXIF данным
                img = ImageOps.exif_transpose(img)
                
                # Создаем миниатюру
                img.thumbnail(size or ImageProcessingService.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                
                # Создаем квадратную миниатюру с центрированием
                thumb_size = size or ImageProcessingService.THUMBNAIL_SIZE
                thumb = ImageOps.fit(img, thumb_size, Image.Resampling.LANCZOS)
                
                # Сохраняем миниатюру
                output = BytesIO()
                thumb.save(
                    output,
                    format='JPEG',
                    quality=80,
                    optimize=True
                )
                
                output.seek(0)
                
                logger.info(f"Создана миниатюра: {thumb.size}")
                
                return ContentFile(output.getvalue())
                
        except Exception as e:
            logger.error(f"Ошибка создания миниатюры: {str(e)}")
            return None
    
    @staticmethod
    def get_image_info(image_file):
        """
        Получает информацию об изображении
        
        Args:
            image_file: Файл изображения
            
        Returns:
            Словарь с информацией об изображении
        """
        try:
            with Image.open(image_file) as img:
                return {
                    'width': img.size[0],
                    'height': img.size[1],
                    'format': img.format,
                    'mode': img.mode,
                    'size_bytes': image_file.size,
                    'has_transparency': img.mode in ('RGBA', 'LA', 'P')
                }
        except Exception as e:
            logger.error(f"Ошибка получения информации об изображении: {str(e)}")
            return None


# Экземпляр сервиса
image_processing_service = ImageProcessingService()
