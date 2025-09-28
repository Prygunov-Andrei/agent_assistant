import factory
from factory.django import DjangoModelFactory
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from ..models import (
    SkillGroup, Skill, Education, Artist, ArtistSkill, 
    ArtistEducation, ArtistLink, ArtistPhoto
)

User = get_user_model()


class SkillGroupFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов SkillGroup."""
    
    class Meta:
        model = SkillGroup
    
    name = factory.Sequence(lambda n: f"Группа навыков {n}")
    description = factory.Faker('text', max_nb_chars=200)
    is_active = True
    created_by = factory.SubFactory('users.tests.factories.AgentFactory')


class SkillFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов Skill."""
    
    class Meta:
        model = Skill
    
    skill_group = factory.SubFactory(SkillGroupFactory)
    name = factory.Sequence(lambda n: f"Навык {n}")
    description = factory.Faker('text', max_nb_chars=200)
    is_active = True
    created_by = factory.SubFactory('users.tests.factories.AgentFactory')


class EducationFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов Education."""
    
    class Meta:
        model = Education
    
    institution_name = factory.Sequence(lambda n: f"Учебное заведение {n}")
    description = factory.Faker('text', max_nb_chars=300)
    is_active = True
    created_by = factory.SubFactory('users.tests.factories.AgentFactory')


class ArtistFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов Artist."""
    
    class Meta:
        model = Artist
    
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    middle_name = factory.Faker('first_name')
    stage_name = factory.LazyAttribute(lambda obj: f"{obj.first_name} {obj.last_name}")
    gender = factory.Faker('random_element', elements=['male', 'female'])
    birth_date = factory.Faker('date_of_birth', minimum_age=18, maximum_age=65)
    media_presence = factory.Faker('boolean')
    bio = factory.Faker('text', max_nb_chars=500)
    
    # Физические характеристики
    height = factory.Faker('random_int', min=150, max=200)
    weight = factory.Faker('random_int', min=50, max=120)
    body_type = factory.Faker('random_element', elements=['Стройное', 'Спортивное', 'Крупное'])
    hair_color = factory.Faker('random_element', elements=['Блондин', 'Брюнет', 'Рыжий', 'Шатен'])
    hairstyle = factory.Faker('random_element', elements=['Короткая', 'Длинная', 'Средняя'])
    eye_color = factory.Faker('random_element', elements=['Голубые', 'Карие', 'Зеленые', 'Серые'])
    clothing_size = factory.Faker('random_element', elements=['S', 'M', 'L', 'XL'])
    shoe_size = factory.Faker('random_element', elements=['36', '38', '40', '42', '44'])
    nationality = factory.Faker('random_element', elements=['Русский', 'Украинец', 'Белорус', 'Татарин'])
    
    # Контакты
    phone = factory.Faker('phone_number')
    backup_phone = factory.Faker('phone_number')
    email = factory.Faker('email')
    telegram_username = factory.Faker('user_name')
    city = factory.Faker('city')
    
    # Рабочие характеристики
    availability_status = factory.Faker('boolean')
    rate_per_day = factory.Faker('random_element', elements=['5000', '10000', '15000', '20000'])
    travel_availability = factory.Faker('boolean')
    
    is_active = True
    created_by = factory.SubFactory('users.tests.factories.AgentFactory')


class ArtistSkillFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов ArtistSkill."""
    
    class Meta:
        model = ArtistSkill
    
    artist = factory.SubFactory(ArtistFactory)
    skill = factory.SubFactory(SkillFactory)
    proficiency_level = factory.Faker('random_element', elements=[
        'beginner', 'intermediate', 'advanced', 'expert'
    ])


class ArtistEducationFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов ArtistEducation."""
    
    class Meta:
        model = ArtistEducation
    
    artist = factory.SubFactory(ArtistFactory)
    education = factory.SubFactory(EducationFactory)
    graduation_year = factory.Faker('random_int', min=1990, max=2023)


class ArtistLinkFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов ArtistLink."""
    
    class Meta:
        model = ArtistLink
    
    artist = factory.SubFactory(ArtistFactory)
    title = factory.Faker('random_element', elements=[
        'Визитка', 'Портфолио', 'Рабочие документы', 'Социальные сети'
    ])
    url = factory.Faker('url')
    description = factory.Faker('text', max_nb_chars=100)


class ArtistPhotoFactory(DjangoModelFactory):
    """Фабрика для создания тестовых объектов ArtistPhoto."""
    
    class Meta:
        model = ArtistPhoto
    
    artist = factory.SubFactory(ArtistFactory)
    photo = factory.django.ImageField(color='blue', width=200, height=200)
    is_main = factory.Faker('boolean')
    description = factory.Faker('text', max_nb_chars=100)
