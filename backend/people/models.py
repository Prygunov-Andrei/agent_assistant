from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


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
        blank=True,
        default='',
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
    
    # Старые поля (для обратной совместимости, будут удалены после миграции)
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Телефон (устаревшее)"
    )
    
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name="Email (устаревшее)"
    )
    
    telegram_username = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Telegram (устаревшее)"
    )
    
    # Новые поля для множественных контактов
    phones = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Телефоны",
        help_text="Массив телефонов (максимум 5)"
    )
    
    emails = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Email адреса",
        help_text="Массив email (максимум 5)"
    )
    
    telegram_usernames = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Telegram аккаунты",
        help_text="Массив Telegram username (максимум 5)"
    )
    
    website = models.URLField(
        blank=True,
        null=True,
        verbose_name="Личный сайт"
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
            # Индексы для поиска совпадений
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['telegram_username']),
            models.Index(fields=['first_name']),
            models.Index(fields=['last_name']),
            # Составные индексы для оптимизации поиска
            models.Index(fields=['person_type', 'is_active']),
            models.Index(fields=['first_name', 'last_name']),
        ]
    
    def __str__(self):
        return self.full_name
    
    def clean(self):
        """Валидация модели"""
        super().clean()
        
        # Проверка максимального количества контактов
        if isinstance(self.phones, list) and len(self.phones) > 5:
            raise ValidationError({'phones': 'Максимум 5 телефонов'})
        
        if isinstance(self.emails, list) and len(self.emails) > 5:
            raise ValidationError({'emails': 'Максимум 5 email адресов'})
        
        if isinstance(self.telegram_usernames, list) and len(self.telegram_usernames) > 5:
            raise ValidationError({'telegram_usernames': 'Максимум 5 Telegram аккаунтов'})
        
        # Проверка что массивы не содержат пустых значений
        if isinstance(self.phones, list):
            self.phones = [p for p in self.phones if p and str(p).strip()]
        
        if isinstance(self.emails, list):
            self.emails = [e for e in self.emails if e and str(e).strip()]
        
        if isinstance(self.telegram_usernames, list):
            self.telegram_usernames = [t for t in self.telegram_usernames if t and str(t).strip()]
    
    def save(self, *args, **kwargs):
        """Переопределяем save для вызова clean()"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def full_name(self):
        """Полное имя персоны"""
        parts = [self.last_name]
        if self.first_name:
            parts.append(self.first_name)
        if self.middle_name:
            parts.append(self.middle_name)
        return " ".join(parts)
    
    @property
    def short_name(self):
        """Краткое имя (Фамилия И.О.)"""
        parts = [self.last_name]
        
        if self.first_name:
            parts.append(f"{self.first_name[0]}.")
            
        if self.middle_name:
            parts.append(f"{self.middle_name[0]}.")
        
        return " ".join(parts)
    
    @property
    def primary_phone(self):
        """Основной телефон (первый в списке)"""
        if isinstance(self.phones, list) and len(self.phones) > 0:
            return self.phones[0]
        # Обратная совместимость со старым полем
        return self.phone or None
    
    @property
    def primary_email(self):
        """Основной email (первый в списке)"""
        if isinstance(self.emails, list) and len(self.emails) > 0:
            return self.emails[0]
        # Обратная совместимость со старым полем
        return self.email or None
    
    @property
    def primary_telegram(self):
        """Основной Telegram (первый в списке)"""
        if isinstance(self.telegram_usernames, list) and len(self.telegram_usernames) > 0:
            return self.telegram_usernames[0]
        # Обратная совместимость со старым полем
        return self.telegram_username or None
    
    def add_contact(self, contact_type, contact_value):
        """
        Добавить новый контакт, если его еще нет
        
        Args:
            contact_type: 'phone', 'email' или 'telegram'
            contact_value: значение контакта
            
        Returns:
            bool: True если контакт был добавлен, False если уже существует
        """
        contact_value = str(contact_value).strip()
        if not contact_value:
            return False
        
        if contact_type == 'phone':
            if not isinstance(self.phones, list):
                self.phones = []
            if contact_value not in self.phones and len(self.phones) < 5:
                self.phones.append(contact_value)
                return True
        elif contact_type == 'email':
            if not isinstance(self.emails, list):
                self.emails = []
            if contact_value not in self.emails and len(self.emails) < 5:
                self.emails.append(contact_value)
                return True
        elif contact_type == 'telegram':
            if not isinstance(self.telegram_usernames, list):
                self.telegram_usernames = []
            if contact_value not in self.telegram_usernames and len(self.telegram_usernames) < 5:
                self.telegram_usernames.append(contact_value)
                return True
        
        return False


class PersonContactAddition(models.Model):
    """Уведомление о добавлении нового контакта к персоне"""
    
    CONTACT_TYPES = (
        ('phone', 'Телефон'),
        ('email', 'Email'),
        ('telegram', 'Telegram'),
    )
    
    person = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name='contact_additions',
        verbose_name="Персона"
    )
    
    contact_type = models.CharField(
        max_length=20,
        choices=CONTACT_TYPES,
        verbose_name="Тип контакта"
    )
    
    contact_value = models.CharField(
        max_length=255,
        verbose_name="Значение контакта"
    )
    
    added_from_request = models.ForeignKey(
        'telegram_requests.Request',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='person_contact_additions',
        verbose_name="Добавлен из запроса"
    )
    
    added_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата добавления"
    )
    
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_contact_additions',
        verbose_name="Проверил"
    )
    
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата проверки"
    )
    
    is_confirmed = models.BooleanField(
        default=False,
        verbose_name="Подтверждено"
    )
    
    is_rejected = models.BooleanField(
        default=False,
        verbose_name="Отклонено"
    )
    
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Заметки"
    )
    
    class Meta:
        verbose_name = "Добавление контакта персоны"
        verbose_name_plural = "Добавления контактов персон"
        ordering = ['-added_at']
        indexes = [
            models.Index(fields=['person', 'is_confirmed']),
            models.Index(fields=['added_at']),
            models.Index(fields=['is_confirmed', 'is_rejected']),
        ]
    
    def __str__(self):
        return f"{self.get_contact_type_display()}: {self.contact_value} -> {self.person.full_name}"
    
    def confirm(self, user):
        """Подтвердить добавление контакта"""
        self.is_confirmed = True
        self.is_rejected = False
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        self.save()
    
    def reject(self, user, notes=None):
        """Отклонить добавление контакта"""
        self.is_rejected = True
        self.is_confirmed = False
        self.reviewed_by = user
        self.reviewed_at = timezone.now()
        if notes:
            self.notes = notes
        self.save()
        
        # Удаляем контакт из персоны
        contact_type_mapping = {
            'phone': 'phones',
            'email': 'emails',
            'telegram': 'telegram_usernames'
        }
        
        field_name = contact_type_mapping.get(self.contact_type)
        if field_name:
            contact_list = getattr(self.person, field_name, [])
            if isinstance(contact_list, list) and self.contact_value in contact_list:
                contact_list.remove(self.contact_value)
                setattr(self.person, field_name, contact_list)
                self.person.save()