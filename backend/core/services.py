"""
Сервисы для работы с внешними API и интеграциями.
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailBackupService:
    """
    Сервис для локального хранения бэкапов и отправки их по email.
    
    Обеспечивает:
    - Локальное хранение последнего бэкапа
    - Автоматическую отправку бэкапа на email
    - Перезапись старого бэкапа новым
    """
    
    def __init__(self):
        self.backup_dir = getattr(settings, 'LOCAL_BACKUP_DIR', '/app/backups')
        self.backup_filename = getattr(settings, 'LOCAL_BACKUP_FILENAME', 'latest_backup.sql.gz')
        self.email_enabled = getattr(settings, 'EMAIL_BACKUP_ENABLED', True)
        self.email_recipient = getattr(settings, 'EMAIL_BACKUP_RECIPIENT', None)
        self.email_subject_prefix = getattr(settings, 'EMAIL_BACKUP_SUBJECT_PREFIX', '[AgentAssistant] Backup')
        
        # Создаем директорию для бэкапов
        os.makedirs(self.backup_dir, exist_ok=True)
        
        if self.email_enabled and not self.email_recipient:
            logger.warning("Email backup enabled but no recipient configured")
    
    def _get_backup_path(self) -> str:
        """Возвращает полный путь к файлу бэкапа"""
        return os.path.join(self.backup_dir, self.backup_filename)
    
    def store_backup(self, file_path: str, filename: str) -> Dict:
        """
        Сохраняет бэкап локально и отправляет по email.
        
        Args:
            file_path: Путь к локальному файлу бэкапа
            filename: Имя файла бэкапа
            
        Returns:
            Dict с информацией о результате операции
        """
        try:
            backup_path = self._get_backup_path()
            
            # Копируем файл как последний бэкап
            import shutil
            shutil.copy2(file_path, backup_path)
            
            logger.info(f"Backup stored locally: {backup_path}")
            
            result = {
                'file_path': backup_path,
                'filename': self.backup_filename,
                'size': os.path.getsize(backup_path),
                'success': True
            }
            
            # Отправляем по email если включено
            if self.email_enabled and self.email_recipient:
                email_result = self._send_backup_email(backup_path, filename)
                result['email_sent'] = email_result['success']
                result['email_error'] = email_result.get('error')
            else:
                result['email_sent'] = False
                result['email_error'] = 'Email disabled or no recipient configured'
            
            return result
            
        except Exception as e:
            logger.error(f"Error storing backup: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _send_backup_email(self, backup_path: str, original_filename: str) -> Dict:
        """
        Отправляет бэкап по email.
        
        Args:
            backup_path: Путь к файлу бэкапа
            original_filename: Оригинальное имя файла
            
        Returns:
            Dict с результатом отправки
        """
        try:
            # Получаем размер файла
            file_size = os.path.getsize(backup_path)
            file_size_mb = round(file_size / (1024 * 1024), 2)
            
            # Создаем сообщение
            msg = MIMEMultipart()
            msg['From'] = settings.DEFAULT_FROM_EMAIL
            msg['To'] = self.email_recipient
            msg['Subject'] = f"{self.email_subject_prefix} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            
            # Текст сообщения
            body = f"""
Резервная копия базы данных AgentAssistant создана.

Детали:
- Файл: {original_filename}
- Размер: {file_size_mb} MB
- Дата создания: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- Статус: Успешно

Файл прикреплен к письму.
            """
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Прикрепляем файл
            with open(backup_path, 'rb') as attachment:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {original_filename}'
            )
            msg.attach(part)
            
            # Отправляем email через SMTP напрямую
            smtp_server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
            smtp_server.starttls()
            smtp_server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            smtp_server.send_message(msg)
            smtp_server.quit()
            
            logger.info(f"Backup email sent successfully to {self.email_recipient}")
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Error sending backup email: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_backup_info(self) -> Dict:
        """
        Получает информацию о последнем бэкапе.
        
        Returns:
            Dict: Информация о бэкапе
        """
        try:
            backup_path = self._get_backup_path()
            
            if os.path.exists(backup_path):
                stat = os.stat(backup_path)
                return {
                    'exists': True,
                    'path': backup_path,
                    'filename': self.backup_filename,
                    'size': stat.st_size,
                    'size_mb': round(stat.st_size / (1024 * 1024), 2),
                    'created_time': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'modified_time': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                }
            else:
                return {
                    'exists': False,
                    'path': backup_path,
                    'filename': self.backup_filename,
                }
                
        except Exception as e:
            logger.error(f"Error getting backup info: {e}")
            return {'exists': False, 'error': str(e)}
    
    def delete_backup(self) -> bool:
        """
        Удаляет локальный бэкап.
        
        Returns:
            bool: True если удаление успешно
        """
        try:
            backup_path = self._get_backup_path()
            
            if os.path.exists(backup_path):
                os.remove(backup_path)
                logger.info(f"Local backup deleted: {backup_path}")
                return True
            else:
                logger.warning(f"Backup file not found: {backup_path}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting backup: {e}")
            return False
    
    def get_storage_info(self) -> Dict:
        """
        Получает информацию о хранилище бэкапов.
        
        Returns:
            Dict: Информация о хранилище
        """
        try:
            # Получаем информацию о диске
            statvfs = os.statvfs(self.backup_dir)
            total_space = statvfs.f_frsize * statvfs.f_blocks
            free_space = statvfs.f_frsize * statvfs.f_bavail
            used_space = total_space - free_space
            
            return {
                'backup_dir': self.backup_dir,
                'total_space_gb': round(total_space / (1024**3), 2),
                'free_space_gb': round(free_space / (1024**3), 2),
                'used_space_gb': round(used_space / (1024**3), 2),
                'email_enabled': self.email_enabled,
                'email_recipient': self.email_recipient,
            }
            
        except Exception as e:
            logger.error(f"Error getting storage info: {e}")
            return {'error': str(e)}


class BackupError(Exception):
    """Базовый класс для ошибок бэкапа"""
    pass


class DatabaseBackupError(BackupError):
    """Ошибки создания бэкапа БД"""
    pass


class EmailBackupError(BackupError):
    """Ошибки отправки бэкапа по email"""
    pass
