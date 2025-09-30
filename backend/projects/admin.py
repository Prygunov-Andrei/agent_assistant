from django.contrib import admin
from .models import ProjectType, Genre, RoleType, Project, ProjectRole


@admin.register(ProjectType)
class ProjectTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(RoleType)
class RoleTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


class ProjectRoleInline(admin.TabularInline):
    model = ProjectRole
    extra = 0
    fields = ('name', 'role_type', 'media_presence', 'is_active')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'project_type',
        'status',
        'genre',
        'director',
        'production_company',
        'request_link',
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
        ('LLM интеграция', {
            'fields': (
                'request',
                'project_type_raw'
            ),
            'classes': ('collapse',)
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
    filter_horizontal = ('producers',)
    inlines = [ProjectRoleInline]
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # Only set created_by for new objects
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def request_link(self, obj):
        """Ссылка на исходный запрос"""
        if obj.request:
            from django.utils.html import format_html
            from django.urls import reverse
            return format_html(
                '<a href="{}">Запрос #{}</a>',
                reverse('admin:telegram_requests_request_change', args=[obj.request.id]),
                obj.request.id
            )
        return 'Создан вручную'
    request_link.short_description = 'Исходный запрос'
    request_link.admin_order_field = 'request__id'


@admin.register(ProjectRole)
class ProjectRoleAdmin(admin.ModelAdmin):
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
        ('LLM интеграция', {
            'fields': (
                'suggested_artists',
                'skills_required'
            ),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('suggested_artists',)
