from django.contrib import admin
from .models import Person, PersonContactAddition


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


@admin.register(PersonContactAddition)
class PersonContactAdditionAdmin(admin.ModelAdmin):
    list_display = (
        'person',
        'contact_type',
        'contact_value',
        'is_confirmed',
        'is_rejected',
        'added_at',
        'reviewed_by'
    )
    list_filter = (
        'contact_type',
        'is_confirmed',
        'is_rejected',
        'added_at'
    )
    search_fields = (
        'person__first_name',
        'person__last_name',
        'contact_value'
    )
    readonly_fields = ('added_at', 'reviewed_at')
    
    fieldsets = (
        ('Информация о контакте', {
            'fields': (
                'person',
                'contact_type',
                'contact_value',
                'added_from_request'
            )
        }),
        ('Статус проверки', {
            'fields': (
                'is_confirmed',
                'is_rejected',
                'reviewed_by',
                'reviewed_at',
                'notes'
            )
        }),
        ('Системная информация', {
            'fields': ('added_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['confirm_additions', 'reject_additions']
    
    def confirm_additions(self, request, queryset):
        """Массовое подтверждение добавлений контактов"""
        for addition in queryset:
            addition.confirm(request.user)
        self.message_user(request, f"Подтверждено {queryset.count()} добавлений контактов")
    confirm_additions.short_description = "Подтвердить выбранные добавления"
    
    def reject_additions(self, request, queryset):
        """Массовое отклонение добавлений контактов"""
        for addition in queryset:
            addition.reject(request.user)
        self.message_user(request, f"Отклонено {queryset.count()} добавлений контактов")
    reject_additions.short_description = "Отклонить выбранные добавления"