from rest_framework import serializers
from .models import (
    SkillGroup, Skill, Education, Artist, ArtistSkill, 
    ArtistEducation, ArtistLink, ArtistPhoto
)
from core.serializers import BaseReferenceSerializer, BaseModelSerializer, BaseListSerializer


class SkillGroupSerializer(BaseReferenceSerializer):
    """Сериализатор для модели SkillGroup."""
    
    skills_count = serializers.SerializerMethodField(
        help_text="Количество навыков в группе"
    )
    
    class Meta(BaseReferenceSerializer.Meta):
        model = SkillGroup
        fields = BaseReferenceSerializer.Meta.fields + ['skills_count']
    
    def get_skills_count(self, obj):
        """Возвращает количество активных навыков в группе."""
        return obj.skills.filter(is_active=True).count()


class SkillSerializer(BaseReferenceSerializer):
    """Сериализатор для модели Skill."""
    
    skill_group_name = serializers.ReadOnlyField(
        source='skill_group.name',
        help_text="Название группы навыков"
    )
    
    class Meta(BaseReferenceSerializer.Meta):
        model = Skill
        fields = BaseReferenceSerializer.Meta.fields + [
            'skill_group', 'skill_group_name'
        ]
        extra_kwargs = {
            'skill_group': {'help_text': 'ID группы навыков'},
        }


class EducationSerializer(BaseReferenceSerializer):
    """Сериализатор для модели Education."""
    
    artists_count = serializers.SerializerMethodField(
        help_text="Количество артистов с этим образованием"
    )
    
    class Meta(BaseReferenceSerializer.Meta):
        model = Education
        fields = ['id', 'institution_name', 'description', 'is_active', 'created_at', 'updated_at', 'artists_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_artists_count(self, obj):
        """Возвращает количество артистов с этим образованием."""
        return obj.artisteducation_set.filter(artist__is_active=True).count()


class ArtistSkillSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ArtistSkill."""
    
    skill_name = serializers.ReadOnlyField(
        source='skill.name',
        help_text="Название навыка"
    )
    skill_group_name = serializers.ReadOnlyField(
        source='skill.skill_group.name',
        help_text="Название группы навыков"
    )
    proficiency_level_display = serializers.ReadOnlyField(
        source='get_proficiency_level_display',
        help_text="Текстовое представление уровня владения"
    )
    
    class Meta:
        model = ArtistSkill
        fields = [
            'id', 'artist', 'skill', 'skill_name', 'skill_group_name',
            'proficiency_level', 'proficiency_level_display', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'artist': {'help_text': 'ID артиста'},
            'skill': {'help_text': 'ID навыка'},
            'proficiency_level': {'help_text': 'Уровень владения навыком (beginner, intermediate, advanced, expert)'},
        }


class ArtistEducationSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ArtistEducation."""
    
    education_name = serializers.ReadOnlyField(
        source='education.institution_name',
        help_text="Название учебного заведения"
    )
    
    class Meta:
        model = ArtistEducation
        fields = [
            'id', 'artist', 'education', 'education_name',
            'graduation_year', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'artist': {'help_text': 'ID артиста'},
            'education': {'help_text': 'ID учебного заведения'},
            'graduation_year': {'help_text': 'Год окончания учебного заведения'},
        }


class ArtistLinkSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ArtistLink."""
    
    class Meta:
        model = ArtistLink
        fields = [
            'id', 'artist', 'title', 'url', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'artist': {'help_text': 'ID артиста'},
            'title': {'help_text': 'Название ссылки'},
            'url': {'help_text': 'URL ссылки'},
            'description': {'help_text': 'Описание ссылки'},
        }


class ArtistPhotoSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ArtistPhoto."""
    
    class Meta:
        model = ArtistPhoto
        fields = [
            'id', 'artist', 'photo', 'is_main', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'artist': {'help_text': 'ID артиста'},
            'photo': {'help_text': 'Фотография артиста'},
            'is_main': {'help_text': 'Является ли основной фотографией'},
            'description': {'help_text': 'Описание фотографии'},
        }


class ArtistSerializer(BaseModelSerializer):
    """Сериализатор для модели Artist."""
    
    # Вычисляемые поля
    full_name = serializers.ReadOnlyField(
        help_text="Полное имя артиста"
    )
    short_name = serializers.ReadOnlyField(
        help_text="Краткое имя артиста"
    )
    gender_display = serializers.ReadOnlyField(
        source='get_gender_display',
        help_text="Текстовое представление пола"
    )
    availability_status_display = serializers.SerializerMethodField(
        help_text="Текстовое представление статуса доступности"
    )
    
    # Связанные объекты
    skills = ArtistSkillSerializer(many=True, read_only=True, help_text="Навыки артиста")
    education = ArtistEducationSerializer(many=True, read_only=True, help_text="Образование артиста")
    links = ArtistLinkSerializer(many=True, read_only=True, help_text="Ссылки артиста")
    photos = ArtistPhotoSerializer(many=True, read_only=True, help_text="Фотографии артиста")
    
    class Meta(BaseModelSerializer.Meta):
        model = Artist
        fields = BaseModelSerializer.Meta.fields + [
            # Основная информация
            'first_name', 'last_name', 'middle_name', 'stage_name',
            'full_name', 'short_name', 'gender', 'gender_display',
            'birth_date', 'age', 'media_presence', 'main_photo', 'bio',
            
            # Физические характеристики
            'height', 'weight', 'body_type', 'hair_color', 'hairstyle',
            'eye_color', 'clothing_size', 'shoe_size', 'nationality',
            
            # Контакты
            'phone', 'backup_phone', 'email', 'telegram_username', 'city',
            
            # Рабочие характеристики
            'availability_status', 'availability_status_display',
            'rate_per_day', 'travel_availability',
            
            # Связанные объекты
            'skills', 'education', 'links', 'photos',
        ]
        extra_kwargs = {
            'first_name': {'help_text': 'Имя артиста'},
            'last_name': {'help_text': 'Фамилия артиста'},
            'middle_name': {'help_text': 'Отчество артиста'},
            'stage_name': {'help_text': 'Сценическое имя артиста'},
            'gender': {'help_text': 'Пол артиста (male, female)'},
            'birth_date': {'help_text': 'Дата рождения артиста'},
            'media_presence': {'help_text': 'Имеет ли артист медийное присутствие'},
            'main_photo': {'help_text': 'Основная фотография артиста'},
            'bio': {'help_text': 'Биография артиста'},
            'height': {'help_text': 'Рост артиста в сантиметрах'},
            'weight': {'help_text': 'Вес артиста в килограммах'},
            'body_type': {'help_text': 'Тип телосложения артиста'},
            'hair_color': {'help_text': 'Цвет волос артиста'},
            'hairstyle': {'help_text': 'Тип прически артиста'},
            'eye_color': {'help_text': 'Цвет глаз артиста'},
            'clothing_size': {'help_text': 'Размер одежды артиста'},
            'shoe_size': {'help_text': 'Размер обуви артиста'},
            'nationality': {'help_text': 'Национальность артиста'},
            'phone': {'help_text': 'Основной номер телефона артиста'},
            'backup_phone': {'help_text': 'Запасной номер телефона артиста'},
            'email': {'help_text': 'Электронная почта артиста'},
            'telegram_username': {'help_text': 'Имя пользователя в Telegram'},
            'city': {'help_text': 'Город, где проживает артист'},
            'availability_status': {'help_text': 'Доступен ли артист для работы'},
            'rate_per_day': {'help_text': 'Ставка оплаты за рабочий день'},
            'travel_availability': {'help_text': 'Готов ли артист к работе в других городах'},
        }
    
    def get_availability_status_display(self, obj):
        """Возвращает текстовое представление статуса доступности."""
        return "Доступен" if obj.availability_status else "Не доступен"


class ArtistListSerializer(BaseListSerializer):
    """Упрощенный сериализатор для списка моделей Artist."""
    
    # Вычисляемые поля
    full_name = serializers.ReadOnlyField(
        help_text="Полное имя артиста"
    )
    gender_display = serializers.ReadOnlyField(
        source='get_gender_display',
        help_text="Текстовое представление пола"
    )
    availability_status_display = serializers.SerializerMethodField(
        help_text="Текстовое представление статуса доступности"
    )
    
    # Связанные объекты
    skills = serializers.SerializerMethodField(
        help_text="Список навыков артиста"
    )
    skills_count = serializers.SerializerMethodField(
        help_text="Количество навыков артиста"
    )
    education_count = serializers.SerializerMethodField(
        help_text="Количество образований артиста"
    )
    links_count = serializers.SerializerMethodField(
        help_text="Количество ссылок артиста"
    )
    photos_count = serializers.SerializerMethodField(
        help_text="Количество фотографий артиста"
    )
    
    
    class Meta(BaseListSerializer.Meta):
        model = Artist
        fields = BaseListSerializer.Meta.fields + [
            # Основная информация
            'first_name', 'last_name', 'stage_name', 'full_name',
            'gender', 'gender_display', 'age', 'media_presence', 'main_photo',
            
            # Физические характеристики
            'height', 'weight', 'city',
            
            # Рабочие характеристики
            'availability_status', 'availability_status_display',
            'travel_availability',
            
            # Связанные объекты и счетчики
            'skills', 'skills_count', 'education_count', 'links_count', 'photos_count',
        ]
    
    def get_availability_status_display(self, obj):
        """Возвращает текстовое представление статуса доступности."""
        return "Доступен" if obj.availability_status else "Не доступен"
    
    def get_skills(self, obj):
        """Возвращает список навыков артиста."""
        skills = []
        for artist_skill in obj.skills.all():
            skills.append({
                'id': artist_skill.skill.id,
                'name': artist_skill.skill.name,
                'skill_group': artist_skill.skill.skill_group.name,
                'proficiency_level': artist_skill.proficiency_level,
                'proficiency_level_display': artist_skill.get_proficiency_level_display(),
            })
        return skills
    
    def get_skills_count(self, obj):
        """Возвращает количество навыков артиста."""
        return obj.skills.count()
    
    def get_education_count(self, obj):
        """Возвращает количество образований артиста."""
        if hasattr(obj, '_prefetched_objects_cache') and 'education' in obj._prefetched_objects_cache:
            return len(obj.education.all())
        return obj.education.count()
    
    def get_links_count(self, obj):
        """Возвращает количество ссылок артиста."""
        if hasattr(obj, '_prefetched_objects_cache') and 'links' in obj._prefetched_objects_cache:
            return len(obj.links.all())
        return obj.links.count()
    
    def get_photos_count(self, obj):
        """Возвращает количество фотографий артиста."""
        if hasattr(obj, '_prefetched_objects_cache') and 'photos' in obj._prefetched_objects_cache:
            return len(obj.photos.all())
        return obj.photos.count()
