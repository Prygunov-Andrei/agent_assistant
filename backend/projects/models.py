from django.db import models
from django.conf import settings
from core.models import BaseReferenceModel, BaseModel


class ProjectType(BaseReferenceModel):
    """
    Модель типа проекта.
    
    Наследует от BaseReferenceModel все стандартные поля справочника.
    Используется для классификации проектов (фильм, сериал, документальный и т.д.).
    """
    
    class Meta(BaseReferenceModel.Meta):
        verbose_name = "Тип проекта"
        verbose_name_plural = "Типы проектов"


class Genre(BaseReferenceModel):
    """
    Модель жанра проекта.
    
    Наследует от BaseReferenceModel все стандартные поля справочника.
    Используется для классификации проектов по жанрам (драма, комедия, боевик и т.д.).
    """
    
    class Meta(BaseReferenceModel.Meta):
        verbose_name = "Жанр"
        verbose_name_plural = "Жанры"


class RoleType(BaseReferenceModel):
    """
    Модель типа роли в проекте.
    
    Наследует от BaseReferenceModel все стандартные поля справочника.
    Используется для классификации ролей (актер, актриса, статист и т.д.).
    """
    
    class Meta(BaseReferenceModel.Meta):
        verbose_name = "Тип роли"
        verbose_name_plural = "Типы ролей"


class ShoeSize(BaseReferenceModel):
    """
    Модель размера обуви.
    
    Наследует от BaseReferenceModel все стандартные поля справочника.
    Используется для указания размера обуви (российские, европейские размеры).
    """
    
    class Meta(BaseReferenceModel.Meta):
        verbose_name = "Размер обуви"
        verbose_name_plural = "Размеры обуви"


class Nationality(BaseReferenceModel):
    """
    Модель национальности.
    
    Наследует от BaseReferenceModel все стандартные поля справочника.
    Используется для указания национальности артиста или требований роли.
    """
    
    class Meta(BaseReferenceModel.Meta):
        verbose_name = "Национальность"
        verbose_name_plural = "Национальности"


class Project(BaseModel):
    """
    Модель проекта.
    
    Наследует от BaseModel общие поля (is_active, created_by, created_at, updated_at).
    Представляет кинопроект со всеми связанными данными.
    """
    
    STATUS_CHOICES = (
        ('in_production', 'В производстве'),
        ('cancelled', 'Отменен или остановлен'),
        ('completed', 'Завершен'),
    )
    
    title = models.CharField(
        max_length=255,
        verbose_name="Название проекта",
        help_text="Официальное название проекта"
    )
    
    project_type = models.ForeignKey(
        ProjectType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Тип проекта",
        help_text="Тип проекта (фильм, сериал и т.д.)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        blank=True,
        null=True,
        verbose_name="Статус проекта",
        help_text="Текущий статус проекта"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание проекта",
        help_text="Подробное описание проекта"
    )
    
    genre = models.ForeignKey(
        Genre,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Жанр",
        help_text="Жанр проекта"
    )
    
    premiere_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Дата премьеры",
        help_text="Планируемая или состоявшаяся дата премьеры"
    )
    
    casting_director = models.ForeignKey(
        'people.Person',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'person_type': 'casting_director'},
        related_name='casting_projects',
        verbose_name="Кастинг-директор",
        help_text="Кастинг-директор проекта"
    )
    
    director = models.ForeignKey(
        'people.Person',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'person_type': 'director'},
        related_name='directed_projects',
        verbose_name="Режиссер",
        help_text="Режиссер проекта"
    )
    
    producers = models.ManyToManyField(
        'people.Person',
        limit_choices_to={'person_type': 'producer'},
        related_name='produced_projects',
        blank=True,
        verbose_name="Продюсеры",
        help_text="Продюсеры проекта"
    )
    
    production_company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Продюсерская компания",
        help_text="Компания, производящая проект"
    )
    
    # LLM интеграция
    request = models.OneToOneField(
        'telegram_requests.Request',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_project',
        verbose_name="Исходный запрос",
        help_text="Запрос, на основе которого создан проект"
    )
    project_type_raw = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Сырой тип проекта",
        help_text="Тип проекта, извлеченный LLM из текста запроса"
    )
    
    # Права использования (для рекламы)
    usage_rights_parsed = models.JSONField(
        blank=True,
        null=True,
        default=None,
        verbose_name="Права использования",
        help_text="Структурированная информация о правах для рекламы: {raw_text, types, duration, territory}"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Проект"
        verbose_name_plural = "Проекты"
        ordering = ['-created_at']
        indexes = BaseModel.Meta.indexes + [
            models.Index(fields=['status']),
            models.Index(fields=['project_type']),
            models.Index(fields=['genre']),
            models.Index(fields=['request']),
            # Индексы для поиска совпадений
            models.Index(fields=['title']),
            models.Index(fields=['description']),
            # Составные индексы для оптимизации поиска
            models.Index(fields=['is_active', 'status']),
            models.Index(fields=['title', 'is_active']),
            models.Index(fields=['project_type', 'is_active']),
        ]
    
    def __str__(self):
        """Строковое представление проекта."""
        return self.title


class ProjectRole(BaseModel):
    """
    Модель роли в проекте.
    
    Наследует от BaseModel общие поля (is_active, created_by, created_at, updated_at).
    Представляет конкретную роль в проекте с подробными характеристиками.
    """
    
    MEDIA_PRESENCE_CHOICES = (
        ('yes', 'Да'),
        ('no', 'Нет'),
        ('doesnt_matter', 'Неважно'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Мужчина'),
        ('female', 'Женщина'),
        ('boy', 'Мальчик'),
        ('girl', 'Девочка'),
        ('doesnt_matter', 'Не важно'),
    )
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='roles',
        verbose_name="Проект",
        help_text="Проект, к которому относится роль"
    )
    
    name = models.CharField(
        max_length=255,
        verbose_name="Название роли",
        help_text="Название роли в проекте"
    )
    
    role_type = models.ForeignKey(
        RoleType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Тип роли",
        help_text="Тип роли (актер, актриса и т.д.)"
    )
    
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание роли",
        help_text="Подробное описание роли"
    )
    
    # Внешность и характеристики
    media_presence = models.CharField(
        max_length=20,
        choices=MEDIA_PRESENCE_CHOICES,
        blank=True,
        null=True,
        verbose_name="Медийность",
        help_text="Требуется ли медийность для роли"
    )
    
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        verbose_name="Пол",
        help_text="Требуемый пол для роли"
    )
    
    age_min = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Минимальный возраст",
        help_text="Минимальный требуемый возраст для роли"
    )
    
    age_max = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name="Максимальный возраст",
        help_text="Максимальный требуемый возраст для роли"
    )
    
    clothing_size = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Размер одежды",
        help_text="Требуемый размер одежды"
    )
    
    shoe_size = models.ForeignKey(
        ShoeSize,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Размер обуви",
        help_text="Требуемый размер обуви"
    )
    
    nationality = models.ForeignKey(
        Nationality,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Национальность",
        help_text="Требуемая национальность для роли"
    )
    
    hairstyle = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Прическа",
        help_text="Требуемый тип прически"
    )
    
    hair_color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Цвет волос",
        help_text="Требуемый цвет волос"
    )
    
    eye_color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Цвет глаз",
        help_text="Требуемый цвет глаз"
    )
    
    height = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Рост",
        help_text="Требуемый рост"
    )
    
    body_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Телосложение",
        help_text="Требуемое телосложение"
    )
    
    # Референсы и материалы
    reference_photo = models.ImageField(
        upload_to='projects/roles/references/',
        blank=True,
        null=True,
        verbose_name="Фото референс",
        help_text="Референсное фото для роли"
    )
    
    reference_text = models.TextField(
        blank=True,
        null=True,
        verbose_name="Текстовый референс",
        help_text="Текстовое описание референса"
    )
    
    special_conditions = models.TextField(
        blank=True,
        null=True,
        verbose_name="Особые условия",
        help_text="Особые требования или условия для роли"
    )
    
    audition_requirements = models.TextField(
        blank=True,
        null=True,
        verbose_name="Требования к пробам",
        help_text="Что требуется для проб"
    )
    
    audition_text = models.TextField(
        blank=True,
        null=True,
        verbose_name="Текст проб текстом",
        help_text="Текстовый материал для проб"
    )
    
    audition_files = models.FileField(
        upload_to='projects/roles/auditions/',
        blank=True,
        null=True,
        verbose_name="Текст проб файлами",
        help_text="Файлы с материалом для проб"
    )
    
    # Рабочие условия
    rate_per_shift = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Ставка за смену",
        help_text="Ставка оплаты за смену"
    )
    
    rate_conditions = models.TextField(
        blank=True,
        null=True,
        verbose_name="Условия по ставке",
        help_text="Дополнительные условия оплаты"
    )
    
    shooting_dates = models.TextField(
        blank=True,
        null=True,
        verbose_name="Даты смен",
        help_text="Планируемые даты съемок"
    )
    
    shooting_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Место съемки",
        help_text="Место проведения съемок"
    )
    
    # Дополнительно
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Заметки",
        help_text="Дополнительные заметки по роли"
    )
    
    # LLM интеграция
    suggested_artists = models.ManyToManyField(
        'artists.Artist',
        related_name='suggested_roles',
        blank=True,
        verbose_name="Предложенные артисты",
        help_text="Артисты, предложенные LLM для этой роли"
    )
    skills_required = models.JSONField(
        default=list,
        blank=True,
        null=True,
        verbose_name="Требуемые навыки",
        help_text="Навыки, требуемые для роли (JSON массив)"
    )
    
    class Meta(BaseModel.Meta):
        verbose_name = "Роль в проекте"
        verbose_name_plural = "Роли в проектах"
        ordering = ['project', 'name']
        indexes = BaseModel.Meta.indexes + [
            models.Index(fields=['project']),
        ]
    
    def __str__(self):
        """Строковое представление роли в проекте."""
        return f"{self.project.title} - {self.name}"