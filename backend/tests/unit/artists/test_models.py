import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import date, timedelta

from artists.models import (
    SkillGroup, Skill, Education, Artist, ArtistSkill, 
    ArtistEducation, ArtistLink, ArtistPhoto
)
from .factories import (
    SkillGroupFactory, SkillFactory, EducationFactory, ArtistFactory,
    ArtistSkillFactory, ArtistEducationFactory, ArtistLinkFactory, ArtistPhotoFactory
)


class TestSkillGroupModel(TestCase):
    """Тесты для модели SkillGroup."""
    
    def test_skill_group_creation(self):
        """Тест создания группы навыков."""
        skill_group = SkillGroupFactory()
        assert skill_group.name is not None
        assert skill_group.is_active is True
        assert skill_group.created_by is not None
    
    def test_skill_group_str(self):
        """Тест строкового представления группы навыков."""
        skill_group = SkillGroupFactory(name="Театральные навыки")
        assert str(skill_group) == "Театральные навыки"
    
    def test_skill_group_unique_name(self):
        """Тест уникальности названия группы навыков."""
        SkillGroupFactory(name="Уникальная группа")
        with pytest.raises(IntegrityError):
            SkillGroupFactory(name="Уникальная группа")


class TestSkillModel(TestCase):
    """Тесты для модели Skill."""
    
    def test_skill_creation(self):
        """Тест создания навыка."""
        skill = SkillFactory()
        assert skill.name is not None
        assert skill.skill_group is not None
        assert skill.is_active is True
        assert skill.created_by is not None
    
    def test_skill_str(self):
        """Тест строкового представления навыка."""
        skill_group = SkillGroupFactory(name="Спорт")
        skill = SkillFactory(name="Футбол", skill_group=skill_group)
        assert str(skill) == "Спорт - Футбол"
    
    def test_skill_unique_in_group(self):
        """Тест уникальности навыка в группе."""
        skill_group = SkillGroupFactory()
        SkillFactory(name="Плавание", skill_group=skill_group)
        # Можно создать навык с тем же именем в другой группе
        other_group = SkillGroupFactory()
        SkillFactory(name="Плавание", skill_group=other_group)
        # Но нельзя создать в той же группе
        with pytest.raises(IntegrityError):
            SkillFactory(name="Плавание", skill_group=skill_group)


class TestEducationModel(TestCase):
    """Тесты для модели Education."""
    
    def test_education_creation(self):
        """Тест создания учебного заведения."""
        education = EducationFactory()
        assert education.institution_name is not None
        assert education.is_active is True
        assert education.created_by is not None
    
    def test_education_str(self):
        """Тест строкового представления учебного заведения."""
        education = EducationFactory(institution_name="МГУ")
        assert str(education) == "МГУ"
    
    def test_education_unique_name(self):
        """Тест уникальности названия учебного заведения."""
        EducationFactory(institution_name="Уникальный ВУЗ")
        with pytest.raises(IntegrityError):
            EducationFactory(institution_name="Уникальный ВУЗ")


class TestArtistModel(TestCase):
    """Тесты для модели Artist."""
    
    def test_artist_creation(self):
        """Тест создания артиста."""
        artist = ArtistFactory()
        assert artist.first_name is not None
        assert artist.last_name is not None
        assert artist.gender in ['male', 'female']
        assert artist.is_active is True
        assert artist.created_by is not None
    
    def test_artist_str(self):
        """Тест строкового представления артиста."""
        artist = ArtistFactory(
            first_name="Иван",
            last_name="Петров",
            stage_name="Иван Петров"
        )
        assert str(artist) == "Иван Петров (Иван Петров)"
        
        artist_no_stage = ArtistFactory(
            first_name="Мария",
            last_name="Сидорова",
            stage_name=None
        )
        assert str(artist_no_stage) == "Сидорова Мария"
    
    def test_artist_full_name(self):
        """Тест свойства full_name."""
        artist = ArtistFactory(
            first_name="Иван",
            last_name="Петров",
            middle_name="Сергеевич"
        )
        assert artist.full_name == "Петров Иван Сергеевич"
        
        artist_no_middle = ArtistFactory(
            first_name="Мария",
            last_name="Сидорова",
            middle_name=None
        )
        assert artist_no_middle.full_name == "Сидорова Мария"
    
    def test_artist_short_name(self):
        """Тест свойства short_name."""
        artist = ArtistFactory(
            first_name="Иван",
            last_name="Петров",
            middle_name="Сергеевич"
        )
        assert artist.short_name == "Петров И.С."
        
        artist_no_middle = ArtistFactory(
            first_name="Мария",
            last_name="Сидорова",
            middle_name=None
        )
        assert artist_no_middle.short_name == "Сидорова М."
    
    def test_artist_age_calculation(self):
        """Тест автоматического вычисления возраста."""
        today = date.today()
        birth_date = today - timedelta(days=365*25 + 100)  # 25 лет и 100 дней назад
        artist = ArtistFactory(birth_date=birth_date)
        artist.save()  # Триггерим вычисление возраста
        # Возраст может быть 24 или 25 в зависимости от точной даты
        assert artist.age in [24, 25]
    
    def test_artist_created_by_relationship(self):
        """Тест связи с создателем."""
        from tests.unit.users.factories import AgentFactory
        agent = AgentFactory()
        artist = ArtistFactory(created_by=agent)
        assert artist.created_by == agent
        # Проверяем обратную связь через related_name по умолчанию
        assert artist in agent.artist_set.all()


class TestArtistSkillModel(TestCase):
    """Тесты для модели ArtistSkill."""
    
    def test_artist_skill_creation(self):
        """Тест создания навыка артиста."""
        artist_skill = ArtistSkillFactory()
        assert artist_skill.artist is not None
        assert artist_skill.skill is not None
        assert artist_skill.proficiency_level in ['beginner', 'intermediate', 'advanced', 'expert']
        assert artist_skill.created_at is not None
    
    def test_artist_skill_str(self):
        """Тест строкового представления навыка артиста."""
        artist = ArtistFactory(first_name="Иван", last_name="Петров")
        skill = SkillFactory(name="Плавание")
        artist_skill = ArtistSkillFactory(
            artist=artist,
            skill=skill,
            proficiency_level='advanced'
        )
        assert "Петров И" in str(artist_skill)
        assert "Плавание" in str(artist_skill)
        assert "Продвинутый" in str(artist_skill)
    
    def test_artist_skill_unique(self):
        """Тест уникальности комбинации артист-навык."""
        artist = ArtistFactory()
        skill = SkillFactory()
        ArtistSkillFactory(artist=artist, skill=skill)
        # Нельзя создать дубликат
        with pytest.raises(IntegrityError):
            ArtistSkillFactory(artist=artist, skill=skill)


class TestArtistEducationModel(TestCase):
    """Тесты для модели ArtistEducation."""
    
    def test_artist_education_creation(self):
        """Тест создания образования артиста."""
        artist_education = ArtistEducationFactory()
        assert artist_education.artist is not None
        assert artist_education.education is not None
        assert 1990 <= artist_education.graduation_year <= 2023
        assert artist_education.created_at is not None
    
    def test_artist_education_str(self):
        """Тест строкового представления образования артиста."""
        artist = ArtistFactory(first_name="Иван", last_name="Петров")
        education = EducationFactory(institution_name="МГУ")
        artist_education = ArtistEducationFactory(
            artist=artist,
            education=education,
            graduation_year=2020
        )
        assert "Петров И" in str(artist_education)
        assert "МГУ" in str(artist_education)
        assert "2020" in str(artist_education)
    
    def test_artist_education_unique(self):
        """Тест уникальности комбинации артист-образование."""
        artist = ArtistFactory()
        education = EducationFactory()
        ArtistEducationFactory(artist=artist, education=education)
        # Нельзя создать дубликат
        with pytest.raises(IntegrityError):
            ArtistEducationFactory(artist=artist, education=education)


class TestArtistLinkModel(TestCase):
    """Тесты для модели ArtistLink."""
    
    def test_artist_link_creation(self):
        """Тест создания ссылки артиста."""
        artist_link = ArtistLinkFactory()
        assert artist_link.artist is not None
        assert artist_link.title is not None
        assert artist_link.url is not None
        assert artist_link.created_at is not None
    
    def test_artist_link_str(self):
        """Тест строкового представления ссылки артиста."""
        artist = ArtistFactory(first_name="Иван", last_name="Петров")
        artist_link = ArtistLinkFactory(artist=artist, title="Визитка")
        assert "Петров И" in str(artist_link)
        assert "Визитка" in str(artist_link)


class TestArtistPhotoModel(TestCase):
    """Тесты для модели ArtistPhoto."""
    
    def test_artist_photo_creation(self):
        """Тест создания фотографии артиста."""
        artist_photo = ArtistPhotoFactory()
        assert artist_photo.artist is not None
        assert artist_photo.photo is not None
        assert artist_photo.created_at is not None
    
    def test_artist_photo_str(self):
        """Тест строкового представления фотографии артиста."""
        artist = ArtistFactory(first_name="Иван", last_name="Петров")
        artist_photo = ArtistPhotoFactory(artist=artist, is_main=True)
        assert "Петров И" in str(artist_photo)
        assert "основная" in str(artist_photo)
        
        artist_photo_not_main = ArtistPhotoFactory(artist=artist, is_main=False)
        assert "Петров И" in str(artist_photo_not_main)
        assert "основная" not in str(artist_photo_not_main)
