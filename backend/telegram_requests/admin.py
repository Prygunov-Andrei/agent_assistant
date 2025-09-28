from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from core.admin import BaseModelAdmin
from .models import Request, RequestImage, RequestFile


@admin.register(Request)
class RequestAdmin(BaseModelAdmin):
    """Админка для запросов"""
    
    list_display = [
        'id', 'author_name', 'status', 'has_media', 'agent_name', 
        'created_at', 'original_created_at', 'processed_at'
    ]
    list_filter = [
        'status', 'has_images', 'has_files', 'agent', 'is_active',
        'created_at', 'original_created_at', 'processed_at'
    ]
    search_fields = ['text', 'author_name', 'telegram_message_id']
    readonly_fields = [
        'author_name', 'author_telegram_id', 'sender_telegram_id',
        'telegram_message_id', 'telegram_chat_id', 'media_group_id',
        'has_images', 'has_files', 'original_created_at', 'created_at',
        'updated_at', 'is_forwarded', 'has_media'
    ]
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'text', 'author_name', 'author_telegram_id', 'sender_telegram_id'
            )
        }),
        ('Telegram данные', {
            'fields': (
                'telegram_message_id', 'telegram_chat_id', 'media_group_id',
                'original_created_at', 'is_forwarded'
            ),
            'classes': ('collapse',)
        }),
        ('Медиафайлы', {
            'fields': ('has_images', 'has_files', 'has_media'),
            'classes': ('collapse',)
        }),
        ('Обработка', {
            'fields': (
                'status', 'agent', 'processed_at', 'response_text'
            )
        }),
        ('Системная информация', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    def agent_name(self, obj):
        """Отображение имени агента"""
        if obj.agent:
            return format_html(
                '<a href="{}">{}</a>',
                reverse('admin:users_agent_change', args=[obj.agent.id]),
                obj.agent.get_full_name()
            )
        return 'Не назначен'
    agent_name.short_description = 'Агент'
    agent_name.admin_order_field = 'agent__first_name'
    
    def has_media(self, obj):
        """Отображение наличия медиафайлов"""
        if obj.has_images and obj.has_files:
            return format_html(
                '<span style="color: blue;">📷📄 Изображения + Файлы</span>'
            )
        elif obj.has_images:
            return format_html('<span style="color: green;">📷 Изображения</span>')
        elif obj.has_files:
            return format_html('<span style="color: orange;">📄 Файлы</span>')
        return format_html('<span style="color: gray;">📝 Текст</span>')
    has_media.short_description = 'Медиафайлы'
    
    actions = ['mark_as_completed', 'mark_as_cancelled', 'assign_to_me']
    
    def mark_as_completed(self, request, queryset):
        """Отметить как выполненные"""
        from django.utils import timezone
        updated = queryset.update(
            status='completed',
            processed_at=timezone.now()
        )
        self.message_user(request, f'{updated} запросов отмечено как выполненные.')
    mark_as_completed.short_description = 'Отметить как выполненные'
    
    def mark_as_cancelled(self, request, queryset):
        """Отметить как отмененные"""
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} запросов отмечено как отмененные.')
    mark_as_cancelled.short_description = 'Отметить как отмененные'
    
    def assign_to_me(self, request, queryset):
        """Назначить себе"""
        updated = queryset.update(agent=request.user)
        self.message_user(request, f'{updated} запросов назначено вам.')
    assign_to_me.short_description = 'Назначить себе'


class RequestImageInline(admin.TabularInline):
    """Inline для изображений запроса"""
    model = RequestImage
    extra = 0
    readonly_fields = ['telegram_file_id', 'file_size', 'created_at']
    fields = ['image', 'telegram_file_id', 'file_size', 'caption', 'created_at']


class RequestFileInline(admin.TabularInline):
    """Inline для файлов запроса"""
    model = RequestFile
    extra = 0
    readonly_fields = ['telegram_file_id', 'file_size', 'created_at']
    fields = ['file', 'original_filename', 'telegram_file_id', 'file_size', 'mime_type', 'created_at']


# Обновляем RequestAdmin с inline'ами
RequestAdmin.inlines = [RequestImageInline, RequestFileInline]


@admin.register(RequestImage)
class RequestImageAdmin(BaseModelAdmin):
    """Админка для изображений запросов"""
    
    list_display = [
        'id', 'request_link', 'image_preview', 'file_size', 'created_at'
    ]
    list_filter = ['created_at', 'request__status']
    search_fields = ['request__author_name', 'caption', 'telegram_file_id']
    readonly_fields = ['telegram_file_id', 'file_size', 'created_at', 'updated_at']
    
    def request_link(self, obj):
        """Ссылка на запрос"""
        return format_html(
            '<a href="{}">Запрос #{}</a>',
            reverse('admin:telegram_requests_request_change', args=[obj.request.id]),
            obj.request.id
        )
    request_link.short_description = 'Запрос'
    request_link.admin_order_field = 'request__id'
    
    def image_preview(self, obj):
        """Превью изображения"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px;" />',
                obj.image.url
            )
        return 'Нет изображения'
    image_preview.short_description = 'Превью'


@admin.register(RequestFile)
class RequestFileAdmin(BaseModelAdmin):
    """Админка для файлов запросов"""
    
    list_display = [
        'id', 'request_link', 'original_filename', 'file_size_mb', 
        'mime_type', 'created_at'
    ]
    list_filter = ['mime_type', 'created_at', 'request__status']
    search_fields = [
        'request__author_name', 'original_filename', 'telegram_file_id'
    ]
    readonly_fields = [
        'telegram_file_id', 'file_size', 'created_at', 'updated_at', 'file_size_mb'
    ]
    
    def request_link(self, obj):
        """Ссылка на запрос"""
        return format_html(
            '<a href="{}">Запрос #{}</a>',
            reverse('admin:telegram_requests_request_change', args=[obj.request.id]),
            obj.request.id
        )
    request_link.short_description = 'Запрос'
    request_link.admin_order_field = 'request__id'
    
    def file_size_mb(self, obj):
        """Размер файла в мегабайтах"""
        return f"{obj.file_size_mb} MB"
    file_size_mb.short_description = 'Размер (MB)'
    file_size_mb.admin_order_field = 'file_size'