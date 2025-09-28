from django.contrib.auth.models import AbstractUser
from django.db import models


class Agent(AbstractUser):
    """Модель Агента - расширенная модель пользователя"""
    
    photo = models.ImageField(
        upload_to='agents/photos/',
        blank=True,
        null=True,
        verbose_name='Фотография'
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Телефон'
    )
    
    bio = models.TextField(
        blank=True,
        default='',
        verbose_name='Биография'
    )
    
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Дата рождения'
    )
    
    telegram_username = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Telegram аккаунт'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Агент'
        verbose_name_plural = 'Агенты'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}" or self.username
    
    @property
    def full_name(self):
        """Полное имя агента"""
        return f"{self.first_name} {self.last_name}".strip() or self.username