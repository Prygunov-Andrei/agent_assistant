import os
import requests
import logging
from django.conf import settings
from django.core.files.base import ContentFile
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class TelegramFileService:
    """Сервис для скачивания файлов из Telegram"""
    
    def __init__(self, bot_token: str = None):
        # Пробуем получить BOT_TOKEN из разных источников
        self.bot_token = bot_token or os.getenv('BOT_TOKEN') or os.environ.get('BOT_TOKEN')
        # BOT_TOKEN удален из логов из соображений безопасности
        if not self.bot_token:
            raise ValueError("BOT_TOKEN не установлен")
        
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"
    
    def get_file_path(self, file_id: str) -> Optional[str]:
        """
        Получает путь к файлу в Telegram
        
        Args:
            file_id: ID файла в Telegram
            
        Returns:
            Путь к файлу или None если ошибка
        """
        try:
            url = f"{self.api_url}/getFile"
            response = requests.get(url, params={'file_id': file_id}, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get('ok'):
                return data['result']['file_path']
            else:
                logger.error(f"Ошибка получения пути файла: {data}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Ошибка при получении пути файла {file_id}: {e}")
            return None
    
    def download_file(self, file_path: str) -> Optional[bytes]:
        """
        Скачивает файл из Telegram
        
        Args:
            file_path: Путь к файлу в Telegram
            
        Returns:
            Содержимое файла в байтах или None если ошибка
        """
        try:
            url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            return response.content
            
        except requests.RequestException as e:
            logger.error(f"Ошибка при скачивании файла {file_path}: {e}")
            return None
    
    def download_telegram_file(self, file_id: str, max_size_mb: int = 20) -> Optional[Tuple[bytes, str]]:
        """
        Скачивает файл из Telegram по file_id
        
        Args:
            file_id: ID файла в Telegram
            max_size_mb: Максимальный размер файла в МБ
            
        Returns:
            Tuple (содержимое файла, имя файла) или None если ошибка
        """
        try:
            # Получаем информацию о файле
            file_path = self.get_file_path(file_id)
            if not file_path:
                return None
            
            # Получаем имя файла из пути
            filename = os.path.basename(file_path)
            if not filename:
                # Если нет имени, генерируем по file_id
                filename = f"telegram_file_{file_id}"
            
            # Скачиваем файл
            file_content = self.download_file(file_path)
            if not file_content:
                return None
            
            # Проверяем размер файла
            file_size_mb = len(file_content) / (1024 * 1024)
            if file_size_mb > max_size_mb:
                logger.warning(f"Файл {file_id} слишком большой: {file_size_mb:.2f}MB > {max_size_mb}MB")
                return None
            
            return file_content, filename
            
        except Exception as e:
            logger.error(f"Ошибка при скачивании файла {file_id}: {e}")
            return None
    
    def save_image_from_telegram(self, file_id: str, request_obj) -> Optional['RequestImage']:
        """
        Скачивает и сохраняет изображение из Telegram
        
        Args:
            file_id: ID файла изображения в Telegram
            request_obj: Объект запроса
            
        Returns:
            RequestImage объект или None если ошибка
        """
        try:
            # Скачиваем файл
            result = self.download_telegram_file(file_id, max_size_mb=10)
            if not result:
                return None
            
            file_content, filename = result
            
            # Создаем объект RequestImage
            from .models import RequestImage
            
            # Определяем расширение файла
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                filename += '.jpg'  # По умолчанию jpg
            
            # Создаем файл
            django_file = ContentFile(file_content, name=filename)
            
            # Создаем RequestImage
            request_image = RequestImage.objects.create(
                request=request_obj,
                image=django_file,
                telegram_file_id=file_id,
                file_size=len(file_content),
                caption="",  # Подпись будет добавлена отдельно
                created_by=request_obj.created_by
            )
            
            logger.info(f"Изображение {file_id} успешно сохранено как {filename}")
            return request_image
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении изображения {file_id}: {e}")
            return None
    
    def save_document_from_telegram(self, file_id: str, document_data: dict, request_obj) -> Optional['RequestFile']:
        """
        Скачивает и сохраняет документ из Telegram
        
        Args:
            file_id: ID файла документа в Telegram
            document_data: Данные документа от Telegram
            request_obj: Объект запроса
            
        Returns:
            RequestFile объект или None если ошибка
        """
        try:
            # Скачиваем файл
            result = self.download_telegram_file(file_id, max_size_mb=50)
            if not result:
                return None
            
            file_content, _ = result
            
            # Получаем оригинальное имя файла из данных Telegram
            original_filename = document_data.get('file_name', f'document_{file_id}')
            
            # Создаем объект RequestFile
            from .models import RequestFile
            
            # Создаем файл
            django_file = ContentFile(file_content, name=original_filename)
            
            # Создаем RequestFile
            request_file = RequestFile.objects.create(
                request=request_obj,
                file=django_file,
                original_filename=original_filename,
                file_size=document_data.get('file_size', len(file_content)),
                mime_type=document_data.get('mime_type', 'application/octet-stream'),
                telegram_file_id=file_id,
                created_by=request_obj.created_by
            )
            
            logger.info(f"Документ {file_id} успешно сохранен как {original_filename}")
            return request_file
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении документа {file_id}: {e}")
            return None
