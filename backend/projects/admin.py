from django.contrib import admin
from .models import ProjectType, Genre, RoleType, Project, ProjectRole
from core.admin import BaseReferenceAdmin, BaseModelAdmin


@admin.register(ProjectType)
class ProjectTypeAdmin(BaseReferenceAdmin):
    """
    Админ-панель для типов проектов.
    
    Наследует от BaseReferenceAdmin стандартную конфигурацию
    для справочных моделей.
    """
    pass


@admin.register(Genre)
class GenreAdmin(BaseReferenceAdmin):
    """
    Админ-панель для жанров.
    
    Наследует от BaseReferenceAdmin стандартную конфигурацию
    для справочных моделей.
    """
    pass


@admin.register(RoleType)
class RoleTypeAdmin(BaseReferenceAdmin):
    """
    Админ-панель для типов ролей.
    
    Наследует от BaseReferenceAdmin стандартную конфигурацию
    для справочных моделей.
    """
    pass


class ProjectRoleInline(admin.TabularInline):
    """
    Inline админ-панель для ролей в проекте.
    
    Позволяет управлять ролями прямо из админ-панели проекта.
    """
    model = ProjectRole
    extra = 0  # Не показывать дополнительные пустые формы
    fields = ('name', 'role_type', 'media_presence', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Project)
class ProjectAdmin(BaseModelAdmin):
    """
    Админ-панель для проектов.
    
    Наследует от BaseModelAdmin базовую конфигурацию и добавляет
    специфичные для проектов настройки отображения и фильтрации.
    """
    
    list_display = (
        'title',
        'project_type',
        'status',
        'genre',
        'director',
        'production_company',
        'is_active',
        'created_by',
        'created_at'
    )
    list_filter = (
        'project_type',
        'status',
        'genre',
        'is_active',
        'created_at'
    )
    search_fields = (
        'title',
        'description',
        'director__first_name',
        'director__last_name',
        'production_company__name'
    )
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'title',
                'project_type',
                'status',
                'description',
                'genre',
                'premiere_date',
                'is_active'
            )
        }),
        ('Команда', {
            'fields': (
                'director',
                'producers',
                'production_company'
            )
        }),
        ('Системная информация', {
            'fields': (
                'created_by',
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    filter_horizontal = ('producers',)  # Удобный виджет для ManyToMany поля
    inlines = [ProjectRoleInline]  # Встроенное управление ролями


@admin.register(ProjectRole)
class ProjectRoleAdmin(BaseModelAdmin):
    """
    Админ-панель для ролей в проектах.
    
    Наследует от BaseModelAdmin базовую конфигурацию и добавляет
    специфичные для ролей настройки отображения и фильтрации.
    """
    
    list_display = (
        'name',
        'project',
        'role_type',
        'media_presence',
        'is_active',
        'created_at'
    )
    list_filter = (
        'project',
        'role_type',
        'media_presence',
        'is_active',
        'created_at'
    )
    search_fields = (
        'name',
        'project__title',
        'description',
        'reference_text'
    )
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'project',
                'name',
                'role_type',
                'description',
                'is_active'
            )
        }),
        ('Внешность и характеристики', {
            'fields': (
                'media_presence',
                'clothing_size',
                'hairstyle',
                'hair_color',
                'eye_color',
                'height',
                'body_type'
            )
        }),
        ('Референсы и материалы', {
            'fields': (
                'reference_photo',
                'reference_text',
                'special_conditions',
                'audition_requirements',
                'audition_text',
                'audition_files'
            )
        }),
        ('Рабочие условия', {
            'fields': (
                'rate_per_shift',
                'rate_conditions',
                'shooting_dates',
                'shooting_location'
            )
        }),
        ('Дополнительно', {
            'fields': ('notes',)
        }),
        ('Системная информация', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )