from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Company(models.Model):
    """Модель кинокомпании"""
    
    COMPANY_TYPES = [
        ('production', 'Кинопроизводство'),
        ('distribution', 'Дистрибуция'),
        ('studio', 'Студия'),
        ('network', 'Телесеть'),
        ('streaming', 'Стриминг-платформа'),
        ('other', 'Другое'),
    ]
    
    name = models.CharField(
        max_length=200,
        verbose_name="Название компании",
        help_text="Официальное название кинокомпании"
    )
    
    company_type = models.CharField(
        max_length=20,
        choices=COMPANY_TYPES,
        default='production',
        verbose_name="Тип компании",
        help_text="Основной тип деятельности компании"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание",
        help_text="Подробное описание компании"
    )
    
    logo = models.ImageField(
        upload_to='companies/logos/',
        blank=True,
        null=True,
        verbose_name="Логотип",
        help_text="Логотип компании"
    )
    
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name="Веб-сайт",
        help_text="Официальный сайт компании"
    )
    
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email",
        help_text="Контактный email"
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Телефон",
        help_text="Контактный телефон"
    )
    
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Адрес",
        help_text="Физический адрес компании"
    )
    
    founded_year = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Год основания",
        help_text="Год основания компании"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активна",
        help_text="Активна ли компания"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Создано агентом",
        help_text="Агент, который добавил компанию"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    
    class Meta:
        verbose_name = "Кинокомпания"
        verbose_name_plural = "Кинокомпании"
        ordering = ['name']
    
    def __str__(self):
        return self.name