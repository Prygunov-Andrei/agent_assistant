from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import Agent


@admin.register(Agent)
class AgentAdmin(BaseUserAdmin):
    """Админка для управления агентами"""
    
    list_display = [
        'username', 
        'email', 
        'first_name', 
        'last_name', 
        'photo_preview',
        'is_active', 
        'is_staff', 
        'date_joined'
    ]
    
    list_filter = [
        'is_active', 
        'is_staff', 
        'is_superuser', 
        'date_joined'
    ]
    
    search_fields = [
        'username', 
        'email', 
        'first_name', 
        'last_name',
        'telegram_username'
    ]
    
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Личная информация', {
            'fields': (
                'first_name', 
                'last_name', 
                'email', 
                'photo',
                'phone',
                'bio',
                'birth_date',
                'telegram_username'
            )
        }),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Важные даты', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login', 'created_at', 'updated_at']
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    
    def photo_preview(self, obj):
        """Превью фотографии в админке"""
        if obj.photo:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius: 50%;" />',
                obj.photo.url
            )
        return "Нет фото"
    
    photo_preview.short_description = "Фото"