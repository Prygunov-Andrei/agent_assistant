"""
Менеджер для создания и управления резервными копиями базы данных.
"""

import os
import subprocess
import tempfile
import logging
from datetime import datetime
from typing import Dict, Optional

from django.conf import settings
from django.db import connection
from django.utils import timezone

from .models import BackupRecord
from .services import EmailBackupService, DatabaseBackupError, EmailBackupError

logger = logging.getLogger(__name__)


class BackupManager:
    """
    Менеджер для создания резервных копий базы данных.
    
    Обеспечивает создание дампов PostgreSQL, их сжатие, локальное хранение и отправку по email.
    """
    
    def __init__(self):
        self.email_backup_service = EmailBackupService()
        self.backup_timeout = getattr(settings, 'DB_BACKUP_TIMEOUT', 300)  # 5 минут
    
    def create_backup(self, user=None) -> BackupRecord:
        """
        Создает полную резервную копию базы данных.
        
        Args:
            user: Пользователь, создающий бэкап
            
        Returns:
            BackupRecord: Запись о созданном бэкапе
        """
        # Создаем запись о бэкапе
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"agent_assistant_backup_{timestamp}.sql.gz"
        
        backup_record = BackupRecord.objects.create(
            filename=filename,
            status='pending',
            created_by=user
        )
        
        try:
            logger.info(f"Starting backup creation: {filename}")
            
            # Создаем дамп базы данных
            dump_path = self._create_database_dump(filename)
            
            # Получаем размер файла
            file_size = os.path.getsize(dump_path)
            backup_record.file_size = file_size
            
            # Сохраняем локально и отправляем по email
            store_result = self.email_backup_service.store_backup(dump_path, filename)
            
            if store_result['success']:
                backup_record.status = 'success'
                backup_record.google_drive_file_id = store_result['file_path']  # Используем то же поле для совместимости
                backup_record.google_drive_url = f"file://{store_result['file_path']}"  # Используем то же поле для совместимости
                backup_record.completed_at = timezone.now()
                
                logger.info(f"Backup created successfully: {filename}")
                
                # Логируем результат отправки email
                if store_result.get('email_sent'):
                    logger.info(f"Backup email sent successfully")
                else:
                    logger.warning(f"Backup email failed: {store_result.get('email_error')}")
                
            else:
                backup_record.status = 'failed'
                backup_record.error_message = store_result.get('error', 'Unknown error')
                logger.error(f"Backup storage failed: {store_result.get('error')}")
            
            # Удаляем временный файл
            if os.path.exists(dump_path):
                os.remove(dump_path)
            
        except Exception as e:
            backup_record.status = 'failed'
            backup_record.error_message = str(e)
            backup_record.completed_at = timezone.now()
            logger.error(f"Backup creation failed: {e}")
        
        backup_record.save()
        return backup_record
    
    def _create_database_dump(self, filename: str) -> str:
        """
        Создает дамп базы данных PostgreSQL.
        
        Args:
            filename: Имя файла для дампа
            
        Returns:
            str: Путь к созданному файлу дампа
        """
        try:
            # Получаем параметры подключения к БД
            db_config = settings.DATABASES['default']
            
            # Создаем временный файл
            temp_dir = tempfile.gettempdir()
            dump_path = os.path.join(temp_dir, filename)
            
            # Формируем команду pg_dump
            cmd = [
                'pg_dump',
                f"--host={db_config['HOST']}",
                f"--port={db_config['PORT']}",
                f"--username={db_config['USER']}",
                f"--dbname={db_config['NAME']}",
                '--no-password',  # Используем .pgpass или переменные окружения
                '--verbose',
                '--format=custom',  # Бинарный формат для лучшего сжатия
                '--compress=9',      # Максимальное сжатие
                f"--file={dump_path}"
            ]
            
            # Устанавливаем переменные окружения для пароля
            env = os.environ.copy()
            if db_config.get('PASSWORD'):
                env['PGPASSWORD'] = db_config['PASSWORD']
            
            # Выполняем команду
            logger.info(f"Executing pg_dump command")
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=self.backup_timeout
            )
            
            if result.returncode != 0:
                error_msg = f"pg_dump failed: {result.stderr}"
                logger.error(error_msg)
                raise DatabaseBackupError(error_msg)
            
            if not os.path.exists(dump_path):
                raise DatabaseBackupError("Dump file was not created")
            
            logger.info(f"Database dump created successfully: {dump_path}")
            return dump_path
            
        except subprocess.TimeoutExpired:
            error_msg = f"pg_dump timeout after {self.backup_timeout} seconds"
            logger.error(error_msg)
            raise DatabaseBackupError(error_msg)
        except Exception as e:
            error_msg = f"Failed to create database dump: {e}"
            logger.error(error_msg)
            raise DatabaseBackupError(error_msg)
    
    def get_backup_statistics(self) -> Dict:
        """
        Получает статистику по бэкапам.
        
        Returns:
            Dict: Статистика бэкапов
        """
        try:
            # Получаем последний успешный бэкап
            last_backup = BackupRecord.objects.filter(
                status='success'
            ).order_by('-created_at').first()
            
            # Подсчитываем общую статистику
            total_backups = BackupRecord.objects.count()
            successful_backups = BackupRecord.objects.filter(status='success').count()
            failed_backups = BackupRecord.objects.filter(status='failed').count()
            
            # Получаем размер всех успешных бэкапов
            total_size = sum(
                backup.file_size or 0 
                for backup in BackupRecord.objects.filter(status='success')
            )
            
            # Получаем информацию о локальном хранилище
            storage_info = self.email_backup_service.get_storage_info()
            
            return {
                'last_backup': {
                    'filename': last_backup.filename if last_backup else None,
                    'created_at': last_backup.created_at if last_backup else None,
                    'file_size_mb': last_backup.file_size_mb if last_backup else None,
                    'status': last_backup.status if last_backup else None
                },
                'statistics': {
                    'total_backups': total_backups,
                    'successful_backups': successful_backups,
                    'failed_backups': failed_backups,
                    'total_size_mb': round(total_size / (1024 * 1024), 2) if total_size else 0
                },
                'local_storage': storage_info
            }
            
        except Exception as e:
            logger.error(f"Failed to get backup statistics: {e}")
            return {
                'last_backup': None,
                'statistics': {
                    'total_backups': 0,
                    'successful_backups': 0,
                    'failed_backups': 0,
                    'total_size_mb': 0
                },
                'local_storage': {}
            }
    
    def list_backups(self) -> list:
        """
        Получает список всех бэкапов.
        
        Returns:
            list: Список записей о бэкапах
        """
        return list(BackupRecord.objects.all().order_by('-created_at'))
    
    def delete_backup(self, backup_id: str, user=None) -> bool:
        """
        Удаляет локальный бэкап и запись из базы данных.
        
        Args:
            backup_id: ID записи о бэкапе
            user: Пользователь, удаляющий бэкап
            
        Returns:
            bool: True если удаление успешно
        """
        try:
            backup_record = BackupRecord.objects.get(id=backup_id)
            
            # Удаляем локальный бэкап
            if backup_record.google_drive_file_id:
                # Получаем путь к файлу из поля google_drive_file_id (используем для совместимости)
                local_path = backup_record.google_drive_file_id
                success = self.email_backup_service.delete_backup()
                if not success:
                    logger.warning(f"Failed to delete local backup: {backup_id}")
            
            # Помечаем как удаленный в БД
            backup_record.status = 'deleted'
            backup_record.save()
            
            logger.info(f"Backup deleted successfully: {backup_record.filename}")
            return True
            
        except BackupRecord.DoesNotExist:
            logger.error(f"Backup record not found: {backup_id}")
            return False
        except Exception as e:
            logger.error(f"Failed to delete backup: {e}")
            return False
