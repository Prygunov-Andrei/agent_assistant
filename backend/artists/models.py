from django.db import models
from django.utils import timezone
from core.models import BaseModel


class SkillGroup(BaseModel):
    """Модель группы навыков."""
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Название группы",
        help_text="Уникальное название группы навыков"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание группы",
        help_text="Подробное описание группы навыков"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Группа навыков"
        verbose_name_plural = "Группы навыков"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Skill(BaseModel):
    """Модель навыка."""
    
    skill_group = models.ForeignKey(
        SkillGroup,
        on_delete=models.CASCADE,
        related_name='skills',
        verbose_name="Группа навыков",
        help_text="Группа, к которой относится навык"
    )
    
    name = models.CharField(
        max_length=100,
        verbose_name="Название навыка",
        help_text="Название конкретного навыка"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание навыка",
        help_text="Подробное описание навыка"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Навык"
        verbose_name_plural = "Навыки"
        ordering = ['skill_group__name', 'name']
        unique_together = ['skill_group', 'name']
    
    def __str__(self):
        return f"{self.skill_group.name} - {self.name}"


class Education(BaseModel):
    """Модель учебного заведения."""
    
    institution_name = models.CharField(
        max_length=200,
        unique=True,
        verbose_name="Название учебного заведения",
        help_text="Полное название учебного заведения"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание заведения",
        help_text="Подробное описание учебного заведения"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Учебное заведение"
        verbose_name_plural = "Учебные заведения"
        ordering = ['institution_name']
    
    def __str__(self):
        return self.institution_name


class Artist(BaseModel):
    """Модель артиста."""
    
    GENDER_CHOICES = (
        ('male', 'Мужской'),
        ('female', 'Женский'),
    )
    
    # Основная информация
    first_name = models.CharField(
        max_length=100,
        verbose_name="Имя",
        help_text="Имя артиста"
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name="Фамилия",
        help_text="Фамилия артиста"
    )
    
    middle_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Отчество",
        help_text="Отчество артиста"
    )
    
    stage_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        verbose_name="Сценическое имя",
        help_text="Сценическое имя артиста"
    )
    
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        verbose_name="Пол",
        help_text="Пол артиста"
    )
    
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Дата рождения",
        help_text="Дата рождения артиста"
    )
    
    age = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Возраст",
        help_text="Возраст артиста (вычисляется автоматически)"
    )
    
    media_presence = models.BooleanField(
        default=False,
        verbose_name="Медийность",
        help_text="Имеет ли артист медийное присутствие"
    )
    
    main_photo = models.ImageField(
        upload_to='artists/photos/main/',
        blank=True,
        null=True,
        verbose_name="Основная фотография",
        help_text="Основная фотография артиста"
    )
    
    bio = models.TextField(
        blank=True,
        null=True,
        verbose_name="Биография",
        help_text="Биография артиста"
    )
    
    # Физические характеристики
    height = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Рост (см)",
        help_text="Рост артиста в сантиметрах"
    )
    
    weight = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Вес (кг)",
        help_text="Вес артиста в килограммах"
    )
    
    body_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Телосложение",
        help_text="Тип телосложения артиста"
    )
    
    hair_color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Цвет волос",
        help_text="Цвет волос артиста"
    )
    
    hairstyle = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Прическа",
        help_text="Тип прически артиста"
    )
    
    eye_color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Цвет глаз",
        help_text="Цвет глаз артиста"
    )
    
    clothing_size = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Размер одежды",
        help_text="Размер одежды артиста"
    )
    
    shoe_size = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Размер обуви",
        help_text="Размер обуви артиста"
    )
    
    nationality = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Национальность",
        help_text="Национальность артиста"
    )
    
    # Контакты
    phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Основной телефон",
        help_text="Основной номер телефона артиста"
    )
    
    backup_phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Запасной телефон",
        help_text="Запасной номер телефона артиста"
    )
    
    email = models.EmailField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Email",
        help_text="Электронная почта артиста"
    )
    
    telegram_username = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Telegram",
        help_text="Имя пользователя в Telegram"
    )
    
    city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Город проживания",
        help_text="Город, где проживает артист"
    )
    
    # Рабочие характеристики
    availability_status = models.BooleanField(
        default=True,
        verbose_name="Статус доступности",
        help_text="Доступен ли артист для работы"
    )
    
    rate_per_day = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Ставка за день",
        help_text="Ставка оплаты за рабочий день"
    )
    
    travel_availability = models.BooleanField(
        default=False,
        verbose_name="Готовность к переездам",
        help_text="Готов ли артист к работе в других городах"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Артист"
        verbose_name_plural = "Артисты"
        ordering = ['last_name', 'first_name']
        indexes = BaseModel.Meta.indexes + [
            models.Index(fields=['gender']),
            models.Index(fields=['age']),
            models.Index(fields=['availability_status']),
            models.Index(fields=['city']),
        ]
    
    def save(self, *args, **kwargs):
        """Автоматически вычисляет возраст при сохранении."""
        if self.birth_date:
            today = timezone.now().date()
            self.age = today.year - self.birth_date.year - (
                (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
        super().save(*args, **kwargs)
    
    def __str__(self):
        if self.stage_name:
            return f"{self.stage_name} ({self.first_name} {self.last_name})"
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name(self):
        """Полное имя артиста."""
        parts = [self.last_name, self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        return " ".join(parts)
    
    @property
    def short_name(self):
        """Краткое имя артиста."""
        if self.middle_name:
            return f"{self.last_name} {self.first_name[0]}.{self.middle_name[0]}."
        return f"{self.last_name} {self.first_name[0]}."


class ArtistSkill(models.Model):
    """Модель навыка артиста."""
    
    PROFICIENCY_CHOICES = (
        ('beginner', 'Начинающий'),
        ('intermediate', 'Средний'),
        ('advanced', 'Продвинутый'),
        ('expert', 'Эксперт'),
    )
    
    artist = models.ForeignKey(
        Artist,
        on_delete=models.CASCADE,
        related_name='skills',
        verbose_name="Артист",
        help_text="Артист, обладающий навыком"
    )
    
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        verbose_name="Навык",
        help_text="Навык артиста"
    )
    
    proficiency_level = models.CharField(
        max_length=20,
        choices=PROFICIENCY_CHOICES,
        default='beginner',
        verbose_name="Уровень владения",
        help_text="Уровень владения навыком"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата добавления"
    )
    
    class Meta:
        verbose_name = "Навык артиста"
        verbose_name_plural = "Навыки артистов"
        unique_together = ['artist', 'skill']
        ordering = ['skill__skill_group__name', 'skill__name']
    
    def __str__(self):
        return f"{self.artist.short_name} - {self.skill.name} ({self.get_proficiency_level_display()})"


class ArtistEducation(models.Model):
    """Модель образования артиста."""
    
    artist = models.ForeignKey(
        Artist,
        on_delete=models.CASCADE,
        related_name='education',
        verbose_name="Артист",
        help_text="Артист, получивший образование"
    )
    
    education = models.ForeignKey(
        Education,
        on_delete=models.CASCADE,
        verbose_name="Учебное заведение",
        help_text="Учебное заведение"
    )
    
    graduation_year = models.PositiveIntegerField(
        verbose_name="Год окончания",
        help_text="Год окончания учебного заведения"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата добавления"
    )
    
    class Meta:
        verbose_name = "Образование артиста"
        verbose_name_plural = "Образование артистов"
        unique_together = ['artist', 'education']
        ordering = ['-graduation_year']
    
    def __str__(self):
        return f"{self.artist.short_name} - {self.education.institution_name} ({self.graduation_year})"


class ArtistLink(models.Model):
    """Модель ссылки артиста."""
    
    artist = models.ForeignKey(
        Artist,
        on_delete=models.CASCADE,
        related_name='links',
        verbose_name="Артист",
        help_text="Артист, к которому относится ссылка"
    )
    
    title = models.CharField(
        max_length=100,
        verbose_name="Название ссылки",
        help_text="Название или описание ссылки"
    )
    
    url = models.URLField(
        max_length=500,
        verbose_name="URL ссылки",
        help_text="Адрес ссылки"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание ссылки",
        help_text="Подробное описание ссылки"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    
    class Meta:
        verbose_name = "Ссылка артиста"
        verbose_name_plural = "Ссылки артистов"
        ordering = ['title']
    
    def __str__(self):
        return f"{self.artist.short_name} - {self.title}"


class ArtistPhoto(models.Model):
    """Модель фотографии артиста."""
    
    artist = models.ForeignKey(
        Artist,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name="Артист",
        help_text="Артист, к которому относится фотография"
    )
    
    photo = models.ImageField(
        upload_to='artists/photos/additional/',
        verbose_name="Фотография",
        help_text="Фотография артиста"
    )
    
    is_main = models.BooleanField(
        default=False,
        verbose_name="Основная фотография",
        help_text="Является ли основной фотографией"
    )
    
    description = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Описание фотографии",
        help_text="Описание фотографии"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата загрузки"
    )
    
    class Meta:
        verbose_name = "Фотография артиста"
        verbose_name_plural = "Фотографии артистов"
        ordering = ['-is_main', '-created_at']
    
    def __str__(self):
        main_text = " (основная)" if self.is_main else ""
        return f"{self.artist.short_name} - фото{main_text}"
