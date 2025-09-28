from django.contrib import admin
from .models import Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        'full_name',
        'person_type',
        'nationality',
        'is_active',
        'created_by',
        'created_at'
    )
    list_filter = (
        'person_type',
        'is_active',
        'nationality',
        'created_at'
    )
    search_fields = (
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'phone',
        'nationality'
    )
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'person_type',
                'first_name',
                'last_name',
                'middle_name',
                'photo',
                'is_active'
            )
        }),
        ('Личная информация', {
            'fields': (
                'bio',
                'birth_date',
                'nationality',
                'phone',
                'email',
                'website'
            )
        }),
        ('Социальные сети', {
            'fields': (
                'telegram_username',
                'kinopoisk_url',
                'social_media'
            )
        }),
        ('Дополнительная информация', {
            'fields': ('awards',)
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
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # Only set created_by for new objects
            obj.created_by = request.user
        super().save_model(request, obj, form, change)