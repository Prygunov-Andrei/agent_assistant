from django.db import models
from django.conf import settings
import uuid


class BaseModel(models.Model):
    """
    Базовая абстрактная модель для всех основных сущностей проекта.
    
    Содержит общие поля, которые используются во всех моделях:
    - is_active: флаг активности объекта
    - created_by: ссылка на пользователя, создавшего объект
    - created_at: автоматически устанавливаемая дата создания
    - updated_at: автоматически обновляемая дата изменения
    """
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен",
        help_text="Активен ли объект в системе"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Создано пользователем",
        help_text="Пользователь, который создал этот объект"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания",
        help_text="Дата и время создания объекта"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
        help_text="Дата и время последнего обновления объекта"
    )
    
    class Meta:
        abstract = True
        # Общий индекс для оптимизации запросов по активности
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['created_by']),
        ]


class BaseReferenceModel(models.Model):
    """
    Базовая абстрактная модель для справочников.
    
    Используется для моделей типа ProjectType, Genre, RoleType и других
    справочных данных. Содержит стандартные поля:
    - name: название справочника (уникальное)
    - description: описание
    - is_active: флаг активности
    - created_at/updated_at: временные метки
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Название",
        help_text="Уникальное название элемента справочника"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание",
        help_text="Подробное описание элемента справочника"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен",
        help_text="Активен ли элемент справочника"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания",
        help_text="Дата и время создания элемента справочника"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления",
        help_text="Дата и время последнего обновления элемента справочника"
    )
    
    class Meta:
        abstract = True
        # Сортировка по названию для удобства отображения
        ordering = ['name']
        # Индекс для оптимизации поиска по названию
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        """
        Строковое представление объекта.
        Возвращает название элемента справочника.
        """
        return self.name


class BackupRecord(models.Model):
    """
    Модель для хранения информации о резервных копиях базы данных.
    
    Отслеживает все созданные бэкапы, их статус, размер и метаданные.
    """
    
    BACKUP_STATUS_CHOICES = [
        ('pending', 'В процессе'),
        ('success', 'Успешно'),
        ('failed', 'Ошибка'),
        ('deleted', 'Удален'),
    ]
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        verbose_name="ID бэкапа",
        help_text="Уникальный идентификатор бэкапа"
    )
    
    filename = models.CharField(
        max_length=255,
        verbose_name="Имя файла",
        help_text="Имя файла бэкапа"
    )
    
    file_size = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Размер файла (байт)",
        help_text="Размер файла бэкапа в байтах"
    )
    
    status = models.CharField(
        max_length=20,
        choices=BACKUP_STATUS_CHOICES,
        default='pending',
        verbose_name="Статус",
        help_text="Текущий статус бэкапа"
    )
    
    google_drive_file_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="ID файла в Google Drive",
        help_text="Идентификатор файла в Google Drive"
    )
    
    google_drive_url = models.URLField(
        null=True,
        blank=True,
        verbose_name="Ссылка на файл в Google Drive",
        help_text="Прямая ссылка на файл в Google Drive"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Создано пользователем",
        help_text="Пользователь, который создал бэкап"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания",
        help_text="Дата и время создания бэкапа"
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата завершения",
        help_text="Дата и время завершения создания бэкапа"
    )
    
    error_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Сообщение об ошибке",
        help_text="Текст ошибки, если бэкап не удался"
    )
    
    class Meta:
        verbose_name = "Запись о бэкапе"
        verbose_name_plural = "Записи о бэкапах"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.filename} ({self.get_status_display()})"
    
    @property
    def file_size_mb(self):
        """Возвращает размер файла в мегабайтах"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None
    
    @property
    def duration(self):
        """Возвращает время создания бэкапа в секундах"""
        if self.completed_at and self.created_at:
            return (self.completed_at - self.created_at).total_seconds()
        return None