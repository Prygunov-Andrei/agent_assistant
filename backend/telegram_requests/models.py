from django.db import models
from django.conf import settings
from core.models import BaseModel


class Request(BaseModel):
    """Модель запроса от пользователей Telegram"""
    
    STATUS_CHOICES = [
        ('pending', 'Новый'),
        ('completed', 'Обработан'),
    ]
    
    ANALYSIS_STATUS_CHOICES = [
        ('new', 'Новый'),
        ('analyzed', 'Проанализирован'),
        ('processed', 'Обработан'),
    ]
    
    # Основные поля
    text = models.TextField(verbose_name="Текст запроса", help_text="Содержимое запроса от пользователя")
    
    # Автор и отправитель
    author_name = models.CharField(
        max_length=200, 
        verbose_name="Имя автора", 
        help_text="Имя автора оригинального сообщения"
    )
    author_telegram_id = models.BigIntegerField(
        null=True, 
        blank=True, 
        verbose_name="Telegram ID автора",
        help_text="ID автора в Telegram (если доступен)"
    )
    author_username = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Telegram username автора",
        help_text="Username автора в Telegram (например, @username)"
    )
    sender_telegram_id = models.BigIntegerField(
        verbose_name="Telegram ID отправителя",
        help_text="ID пользователя, который переслал сообщение в бот"
    )
    
    # Telegram данные
    telegram_message_id = models.BigIntegerField(
        verbose_name="ID сообщения в Telegram",
        help_text="Уникальный ID сообщения в Telegram"
    )
    telegram_chat_id = models.BigIntegerField(
        verbose_name="ID чата в Telegram",
        help_text="ID чата, из которого пришло сообщение"
    )
    media_group_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="ID группы медиа",
        help_text="ID группы медиа для групповых сообщений"
    )
    
    # Медиа флаги
    has_images = models.BooleanField(
        default=False,
        verbose_name="Содержит изображения",
        help_text="Указывает, есть ли в запросе изображения"
    )
    has_files = models.BooleanField(
        default=False,
        verbose_name="Содержит файлы",
        help_text="Указывает, есть ли в запросе файлы"
    )
    
    # Временные метки
    original_created_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата создания сообщения",
        help_text="Дата и время создания оригинального сообщения в Telegram"
    )
    
    # Статус и обработка
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="Статус",
        help_text="Текущий статус обработки запроса"
    )
    agent = models.ForeignKey(
        'users.Agent', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='processed_requests',
        verbose_name="Агент",
        help_text="Агент, который обрабатывает данный запрос"
    )
    processed_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="Дата обработки",
        help_text="Дата и время начала обработки запроса агентом"
    )
    response_text = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Ответ агента",
        help_text="Текст ответа агента на запрос"
    )
    
    # LLM интеграция
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_requests',
        verbose_name="Проект",
        help_text="Проект, созданный на основе этого запроса"
    )
    analysis_status = models.CharField(
        max_length=20,
        choices=ANALYSIS_STATUS_CHOICES,
        default='new',
        verbose_name="Статус анализа",
        help_text="Статус анализа запроса через LLM"
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Запрос"
        verbose_name_plural = "Запросы"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['agent']),
            models.Index(fields=['sender_telegram_id']),
            models.Index(fields=['author_telegram_id']),
            models.Index(fields=['telegram_message_id']),
            models.Index(fields=['original_created_at']),
            models.Index(fields=['analysis_status']),
            models.Index(fields=['project']),
            *BaseModel.Meta.indexes
        ]

    def __str__(self):
        return f"Запрос от {self.author_name} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"

    @property
    def is_forwarded(self):
        """Проверяет, является ли запрос пересланным сообщением"""
        return self.author_telegram_id != self.sender_telegram_id

    @property
    def has_media(self):
        """Проверяет, содержит ли запрос медиафайлы"""
        return self.has_images or self.has_files


class RequestImage(BaseModel):
    """Модель изображения в запросе"""
    
    request = models.ForeignKey(
        Request, 
        on_delete=models.CASCADE, 
        related_name='images',
        verbose_name="Запрос",
        help_text="Запрос, к которому относится изображение"
    )
    image = models.ImageField(
        upload_to='requests/images/%Y/%m/%d/',
        verbose_name="Изображение",
        help_text="Файл изображения"
    )
    thumbnail = models.ImageField(
        upload_to='requests/thumbnails/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name="Миниатюра",
        help_text="Миниатюра изображения для быстрой загрузки"
    )
    telegram_file_id = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        verbose_name="ID файла в Telegram",
        help_text="Уникальный ID файла в Telegram API"
    )
    file_size = models.BigIntegerField(
        null=True, 
        blank=True,
        verbose_name="Размер файла",
        help_text="Размер файла в байтах"
    )
    caption = models.TextField(
        blank=True, 
        null=True,
        verbose_name="Подпись",
        help_text="Подпись к изображению"
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Изображение запроса"
        verbose_name_plural = "Изображения запросов"
        ordering = ['request', 'created_at']
        indexes = [
            models.Index(fields=['request']),
            models.Index(fields=['telegram_file_id']),
            *BaseModel.Meta.indexes
        ]

    def __str__(self):
        return f"Изображение для запроса {self.request.id}"
    
    @property
    def file_size_mb(self):
        """Возвращает размер файла в мегабайтах"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0
    
    def process_image(self):
        """Обрабатывает изображение: создает миниатюру и оптимизирует"""
        from .image_processing import image_processing_service
        
        if not self.image:
            return
        
        try:
            # Создаем миниатюру
            thumbnail_file = image_processing_service.create_thumbnail(self.image)
            if thumbnail_file:
                # Сохраняем миниатюру
                thumbnail_name = f"thumb_{self.image.name.split('/')[-1]}"
                self.thumbnail.save(thumbnail_name, thumbnail_file, save=False)
            
            # Оптимизируем основное изображение
            optimized_file = image_processing_service.optimize_image(
                self.image,
                max_size=(1200, 1200),
                quality=85
            )
            
            if optimized_file:
                # Сохраняем оптимизированное изображение
                optimized_name = f"opt_{self.image.name.split('/')[-1]}"
                self.image.save(optimized_name, optimized_file, save=False)
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Ошибка обработки изображения {self.id}: {str(e)}")
    
    def save(self, *args, **kwargs):
        """Переопределяем save для обработки изображения"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Обрабатываем изображение только для новых записей
        if is_new and self.image:
            self.process_image()
            # Сохраняем еще раз после обработки
            super().save(update_fields=['image', 'thumbnail'])


class RequestFile(BaseModel):
    """Модель файла в запросе"""
    
    request = models.ForeignKey(
        Request, 
        on_delete=models.CASCADE, 
        related_name='files',
        verbose_name="Запрос",
        help_text="Запрос, к которому относится файл"
    )
    file = models.FileField(
        upload_to='requests/files/%Y/%m/%d/',
        verbose_name="Файл",
        help_text="Загруженный файл"
    )
    original_filename = models.CharField(
        max_length=255,
        verbose_name="Оригинальное имя файла",
        help_text="Имя файла, как оно было в Telegram"
    )
    file_size = models.BigIntegerField(
        verbose_name="Размер файла",
        help_text="Размер файла в байтах"
    )
    mime_type = models.CharField(
        max_length=100,
        verbose_name="MIME тип",
        help_text="MIME тип файла"
    )
    telegram_file_id = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        verbose_name="ID файла в Telegram",
        help_text="Уникальный ID файла в Telegram API"
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Файл запроса"
        verbose_name_plural = "Файлы запросов"
        ordering = ['request', 'created_at']
        indexes = [
            models.Index(fields=['request']),
            models.Index(fields=['telegram_file_id']),
            models.Index(fields=['mime_type']),
            *BaseModel.Meta.indexes
        ]

    def __str__(self):
        return f"{self.original_filename} для запроса {self.request.id}"

    def save(self, *args, **kwargs):
        """Переопределяем save для автоматического вычисления размера файла"""
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except (OSError, IOError):
                # Если не удается получить размер файла, устанавливаем 0
                self.file_size = 0
        super().save(*args, **kwargs)

    @property
    def file_size_mb(self):
        """Возвращает размер файла в мегабайтах"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0