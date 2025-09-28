from django.db import models
from django.conf import settings


class Person(models.Model):
    """Модель для режиссеров, продюсеров и кастинг-директоров"""
    
    PERSON_TYPES = (
        ('director', 'Режиссер'),
        ('producer', 'Продюсер'),
        ('casting_director', 'Кастинг-директор'),
    )
    
    person_type = models.CharField(
        max_length=20,
        choices=PERSON_TYPES,
        verbose_name="Тип персоны"
    )
    
    first_name = models.CharField(
        max_length=100,
        verbose_name="Имя"
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name="Фамилия"
    )
    
    middle_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Отчество"
    )
    
    photo = models.ImageField(
        upload_to='people/photos/',
        blank=True,
        null=True,
        verbose_name="Фотография"
    )
    
    bio = models.TextField(
        blank=True,
        null=True,
        verbose_name="Биография"
    )
    
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Дата рождения"
    )
    
    nationality = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Национальность"
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Телефон"
    )
    
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email"
    )
    
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name="Личный сайт"
    )
    
    telegram_username = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Telegram"
    )
    
    kinopoisk_url = models.URLField(
        blank=True,
        null=True,
        verbose_name="Ссылка на Кинотеатр"
    )
    
    social_media = models.JSONField(
        blank=True,
        null=True,
        default=dict,
        verbose_name="Социальные сети"
    )
    
    awards = models.TextField(
        blank=True,
        null=True,
        verbose_name="Награды и достижения"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_people',
        verbose_name="Кто добавил"
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
        verbose_name = "Персона"
        verbose_name_plural = "Персоны"
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['person_type']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        if self.middle_name:
            return f"{self.last_name} {self.first_name} {self.middle_name}"
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name(self):
        """Полное имя персоны"""
        parts = [self.last_name, self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        return " ".join(parts)
    
    @property
    def short_name(self):
        """Краткое имя (Фамилия И.О.)"""
        if self.middle_name:
            return f"{self.last_name} {self.first_name[0]}.{self.middle_name[0]}."
        return f"{self.last_name} {self.first_name[0]}."