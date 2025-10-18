from django.contrib import admin
from .models import BackupRecord


class BaseReferenceAdmin(admin.ModelAdmin):
    """
    Базовый Admin класс для справочных моделей.
    
    Предоставляет стандартную конфигурацию админ-панели для справочников:
    - Отображение основных полей в списке
    - Фильтрация по активности и дате создания
    - Поиск по названию и описанию
    - Сортировка по названию
    """
    
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


class BaseModelAdmin(admin.ModelAdmin):
    """
    Базовый Admin класс для основных моделей.
    
    Предоставляет стандартную конфигурацию админ-панели для основных сущностей:
    - Отображение основных полей в списке
    - Фильтрация по активности и дате создания
    - Автоматическое установление created_by при создании
    """
    
    list_display = ('__str__', 'is_active', 'created_by', 'created_at')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('is_active',)
        }),
        ('Системная информация', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """
        Автоматически устанавливает created_by при создании объекта.
        
        Args:
            request: HTTP запрос
            obj: объект модели для сохранения
            form: форма админ-панели
            change: флаг изменения существующего объекта
        """
        if not change:  # Только при создании нового объекта
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    """
    Admin класс для записей о резервных копиях.
    
    Предоставляет интерфейс для просмотра и управления бэкапами.
    """
    
    list_display = (
        'filename', 
        'status', 
        'file_size_mb', 
        'created_by', 
        'created_at', 
        'completed_at'
    )
    
    list_filter = (
        'status', 
        'created_at', 
        'completed_at',
        'created_by'
    )
    
    search_fields = (
        'filename', 
        'created_by__username',
        'error_message'
    )
    
    readonly_fields = (
        'id',
        'filename',
        'file_size',
        'file_size_mb',
        'status',
        'google_drive_file_id',
        'google_drive_url',
        'created_by',
        'created_at',
        'completed_at',
        'duration',
        'error_message'
    )
    
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'id',
                'filename',
                'status',
                'file_size',
                'file_size_mb',
                'duration'
            )
        }),
        ('Google Drive', {
            'fields': (
                'google_drive_file_id',
                'google_drive_url',
            ),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': (
                'created_by',
                'created_at',
                'completed_at',
            ),
            'classes': ('collapse',)
        }),
        ('Ошибки', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Запрещаем создание бэкапов через админку"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Запрещаем изменение бэкапов через админку"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Разрешаем удаление только администраторам"""
        return request.user.is_superuser