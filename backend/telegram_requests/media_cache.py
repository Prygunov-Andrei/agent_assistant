"""
Сервис для кэширования медиафайлов
"""
import os
import hashlib
import logging
from django.core.cache import cache
from django.conf import settings
from PIL import Image
from io import BytesIO
import requests

logger = logging.getLogger(__name__)


class MediaCacheService:
    """Сервис для кэширования и оптимизации медиафайлов"""
    
    CACHE_TIMEOUT = 3600  # 1 час
    THUMBNAIL_SIZE = (300, 300)
    MAX_IMAGE_SIZE = (1200, 1200)
    
    @staticmethod
    def get_cache_key(request_id: int, media_type: str) -> str:
        """Генерирует ключ кэша для медиафайлов запроса"""
        return f"request_media_{request_id}_{media_type}"
    
    @staticmethod
    def get_media_from_cache(request_id: int) -> dict:
        """Получает медиафайлы из кэша"""
        images_key = MediaCacheService.get_cache_key(request_id, 'images')
        files_key = MediaCacheService.get_cache_key(request_id, 'files')
        
        images_data = cache.get(images_key)
        files_data = cache.get(files_key)
        
        if images_data is not None and files_data is not None:
            logger.info(f"Медиафайлы запроса {request_id} получены из кэша")
            return {
                'images': images_data,
                'files': files_data,
                'cached': True
            }
        
        return {'cached': False}
    
    @staticmethod
    def set_media_to_cache(request_id: int, images_data: list, files_data: list):
        """Сохраняет медиафайлы в кэш"""
        images_key = MediaCacheService.get_cache_key(request_id, 'images')
        files_key = MediaCacheService.get_cache_key(request_id, 'files')
        
        cache.set(images_key, images_data, MediaCacheService.CACHE_TIMEOUT)
        cache.set(files_key, files_data, MediaCacheService.CACHE_TIMEOUT)
        
        logger.info(f"Медиафайлы запроса {request_id} сохранены в кэш")
    
    @staticmethod
    def clear_media_cache(request_id: int):
        """Очищает кэш медиафайлов запроса"""
        images_key = MediaCacheService.get_cache_key(request_id, 'images')
        files_key = MediaCacheService.get_cache_key(request_id, 'files')
        
        cache.delete(images_key)
        cache.delete(files_key)
        
        logger.info(f"Кэш медиафайлов запроса {request_id} очищен")
    
    @staticmethod
    def create_thumbnail(image_path: str, size: tuple = None) -> str:
        """Создает миниатюру изображения"""
        if size is None:
            size = MediaCacheService.THUMBNAIL_SIZE
            
        try:
            # Открываем изображение
            with Image.open(image_path) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Создаем миниатюру
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                # Сохраняем миниатюру
                thumbnail_path = f"{image_path}_thumb_{size[0]}x{size[1]}.jpg"
                
                # Создаем директорию если не существует
                os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
                
                img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
                
                return thumbnail_path
                
        except Exception as e:
            logger.error(f"Ошибка создания миниатюры для {image_path}: {e}")
            return image_path
    
    @staticmethod
    def optimize_image(image_path: str) -> str:
        """Оптимизирует изображение для веб-отображения"""
        try:
            with Image.open(image_path) as img:
                # Конвертируем в RGB если нужно
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Уменьшаем размер если слишком большой
                if img.size[0] > MediaCacheService.MAX_IMAGE_SIZE[0] or img.size[1] > MediaCacheService.MAX_IMAGE_SIZE[1]:
                    img.thumbnail(MediaCacheService.MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                
                # Создаем оптимизированную версию
                optimized_path = f"{image_path}_optimized.jpg"
                
                # Создаем директорию если не существует
                os.makedirs(os.path.dirname(optimized_path), exist_ok=True)
                
                img.save(optimized_path, 'JPEG', quality=85, optimize=True)
                
                return optimized_path
                
        except Exception as e:
            logger.error(f"Ошибка оптимизации изображения {image_path}: {e}")
            return image_path
    
    @staticmethod
    def get_file_hash(file_path: str) -> str:
        """Вычисляет хэш файла для проверки изменений"""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            logger.error(f"Ошибка вычисления хэша файла {file_path}: {e}")
            return ""
    
    @staticmethod
    def should_optimize_image(file_path: str) -> bool:
        """Проверяет, нужно ли оптимизировать изображение"""
        try:
            file_size = os.path.getsize(file_path)
            # Оптимизируем файлы больше 500KB
            return file_size > 500 * 1024
        except Exception:
            return False


# Глобальный экземпляр сервиса
media_cache_service = MediaCacheService()
