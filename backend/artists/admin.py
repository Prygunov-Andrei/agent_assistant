from django.contrib import admin
from django.utils.html import format_html
from .models import (
    SkillGroup, Skill, Education, Artist, ArtistSkill, 
    ArtistEducation, ArtistLink, ArtistPhoto
)
from core.admin import BaseReferenceAdmin, BaseModelAdmin


class SkillGroupAdmin(BaseReferenceAdmin):
    """Admin класс для модели SkillGroup."""
    
    list_display = BaseReferenceAdmin.list_display + ('skills_count',)
    search_fields = BaseReferenceAdmin.search_fields + ('name', 'description')
    
    def skills_count(self, obj):
        """Количество навыков в группе."""
        return obj.skills.filter(is_active=True).count()
    skills_count.short_description = "Количество навыков"


class SkillAdmin(BaseReferenceAdmin):
    """Admin класс для модели Skill."""
    
    list_display = ('name', 'skill_group', 'is_active', 'created_at', 'updated_at')
    list_filter = ('skill_group', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'skill_group__name')
    ordering = ('skill_group__name', 'name')
    
    # Поля для формы редактирования
    fieldsets = (
        ('Основная информация', {
            'fields': ('skill_group', 'name', 'description', 'is_active')
        }),
    )


class EducationAdmin(BaseReferenceAdmin):
    """Admin класс для модели Education."""
    
    list_display = ('institution_name', 'is_active', 'artists_count', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('institution_name', 'description')
    ordering = ('institution_name',)
    
    def artists_count(self, obj):
        """Количество артистов с этим образованием."""
        return obj.artisteducation_set.filter(artist__is_active=True).count()
    artists_count.short_description = "Количество артистов"


class ArtistSkillInline(admin.TabularInline):
    """Inline для навыков артиста."""
    
    model = ArtistSkill
    extra = 1
    fields = ('skill', 'proficiency_level')


class ArtistEducationInline(admin.TabularInline):
    """Inline для образования артиста."""
    
    model = ArtistEducation
    extra = 1
    fields = ('education', 'graduation_year')


class ArtistLinkInline(admin.TabularInline):
    """Inline для ссылок артиста."""
    
    model = ArtistLink
    extra = 1
    fields = ('title', 'url', 'description')


class ArtistPhotoInline(admin.TabularInline):
    """Inline для фотографий артиста."""
    
    model = ArtistPhoto
    extra = 1
    fields = ('photo', 'is_main', 'description')


class ArtistAdmin(BaseModelAdmin):
    """Admin класс для модели Artist."""
    
    list_display = BaseModelAdmin.list_display + (
        'full_name', 'stage_name', 'gender', 'age', 'city', 
        'availability_status', 'media_presence', 'created_by'
    )
    list_filter = BaseModelAdmin.list_filter + (
        'gender', 'availability_status', 'media_presence', 
        'travel_availability', 'city'
    )
    search_fields = BaseModelAdmin.search_fields + (
        'first_name', 'last_name', 'middle_name', 'stage_name',
        'phone', 'email', 'city'
    )
    
    # Поля, которые будут отображаться в форме редактирования
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'first_name', 'last_name', 'middle_name', 'stage_name',
                'gender', 'birth_date', 'age', 'media_presence', 'bio', 'is_active'
            )
        }),
        ('Физические характеристики', {
            'fields': (
                'height', 'weight', 'body_type', 'hair_color', 'hairstyle',
                'eye_color', 'clothing_size', 'shoe_size', 'nationality'
            )
        }),
        ('Контакты', {
            'fields': (
                'phone', 'backup_phone', 'email', 'telegram_username', 'city'
            )
        }),
        ('Рабочие характеристики', {
            'fields': (
                'availability_status', 'rate_per_day', 'travel_availability'
            )
        }),
        ('Фотографии', {
            'fields': ('main_photo',),
            'classes': ('collapse',),
        }),
        ('Системная информация', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    # Inline формы для связанных объектов
    inlines = [ArtistSkillInline, ArtistEducationInline, ArtistLinkInline, ArtistPhotoInline]
    
    readonly_fields = BaseModelAdmin.readonly_fields + ('age',)
    
    def full_name(self, obj):
        """Полное имя артиста."""
        return obj.full_name
    full_name.short_description = "Полное имя"
    
    def get_queryset(self, request):
        """Оптимизация запросов с предзагрузкой связанных объектов."""
        return super().get_queryset(request).select_related('created_by')


class ArtistSkillAdmin(admin.ModelAdmin):
    """Admin класс для модели ArtistSkill."""
    
    list_display = ('artist', 'skill', 'proficiency_level', 'created_at')
    list_filter = ('proficiency_level', 'skill__skill_group', 'created_at')
    search_fields = ('artist__first_name', 'artist__last_name', 'skill__name')
    ordering = ('artist__last_name', 'skill__skill_group__name', 'skill__name')
    
    def get_queryset(self, request):
        """Оптимизация запросов с предзагрузкой связанных объектов."""
        return super().get_queryset(request).select_related(
            'artist', 'skill', 'skill__skill_group'
        )


class ArtistEducationAdmin(admin.ModelAdmin):
    """Admin класс для модели ArtistEducation."""
    
    list_display = ('artist', 'education', 'graduation_year', 'created_at')
    list_filter = ('graduation_year', 'created_at')
    search_fields = (
        'artist__first_name', 'artist__last_name', 
        'education__institution_name'
    )
    ordering = ('-graduation_year', 'artist__last_name')
    
    def get_queryset(self, request):
        """Оптимизация запросов с предзагрузкой связанных объектов."""
        return super().get_queryset(request).select_related('artist', 'education')


class ArtistLinkAdmin(admin.ModelAdmin):
    """Admin класс для модели ArtistLink."""
    
    list_display = ('artist', 'title', 'url', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('artist__first_name', 'artist__last_name', 'title', 'url')
    ordering = ('artist__last_name', 'title')
    
    def get_queryset(self, request):
        """Оптимизация запросов с предзагрузкой связанных объектов."""
        return super().get_queryset(request).select_related('artist')


class ArtistPhotoAdmin(admin.ModelAdmin):
    """Admin класс для модели ArtistPhoto."""
    
    list_display = ('artist', 'photo_preview', 'is_main', 'description', 'created_at')
    list_filter = ('is_main', 'created_at')
    search_fields = ('artist__first_name', 'artist__last_name', 'description')
    ordering = ('artist__last_name', '-is_main', '-created_at')
    
    def photo_preview(self, obj):
        """Превью фотографии."""
        if obj.photo:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius: 50%;" />',
                obj.photo.url
            )
        return "Нет фото"
    photo_preview.short_description = "Превью"
    
    def get_queryset(self, request):
        """Оптимизация запросов с предзагрузкой связанных объектов."""
        return super().get_queryset(request).select_related('artist')


# Регистрация моделей в админ-панели
admin.site.register(SkillGroup, SkillGroupAdmin)
admin.site.register(Skill, SkillAdmin)
admin.site.register(Education, EducationAdmin)
admin.site.register(Artist, ArtistAdmin)
admin.site.register(ArtistSkill, ArtistSkillAdmin)
admin.site.register(ArtistEducation, ArtistEducationAdmin)
admin.site.register(ArtistLink, ArtistLinkAdmin)
admin.site.register(ArtistPhoto, ArtistPhotoAdmin)