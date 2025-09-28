from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """Админка для кинокомпаний"""
    
    list_display = [
        'name',
        'company_type',
        'website',
        'email',
        'is_active',
        'created_by',
        'created_at',
    ]
    
    list_filter = [
        'company_type',
        'is_active',
        'created_by',
        'created_at',
    ]
    
    search_fields = [
        'name',
        'description',
        'email',
        'website',
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'company_type', 'description', 'logo')
        }),
        ('Контактная информация', {
            'fields': ('website', 'email', 'phone', 'address')
        }),
        ('Дополнительная информация', {
            'fields': ('founded_year', 'is_active')
        }),
        ('Системная информация', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """Автоматически устанавливаем создателя при создании"""
        if not change:  # Если это создание нового объекта
            obj.created_by = request.user
        super().save_model(request, obj, form, change)