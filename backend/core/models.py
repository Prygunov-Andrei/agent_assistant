from django.db import models
from django.conf import settings


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