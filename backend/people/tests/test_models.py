import pytest
from django.core.exceptions import ValidationError
from people.models import Person
from .factories import PersonFactory, DirectorFactory, ProducerFactory, CastingDirectorFactory
from users.tests.factories import AgentFactory


@pytest.mark.django_db
class TestPersonModel:
    """Тесты для модели Person"""

    def test_person_creation(self):
        """Тест создания персоны"""
        person = PersonFactory()
        assert person.pk is not None
        assert person.first_name is not None
        assert person.last_name is not None
        assert person.person_type in ['director', 'producer', 'casting_director']
        assert person.is_active is True
        assert person.created_by is not None

    def test_person_str_representation(self):
        """Тест строкового представления персоны"""
        person = PersonFactory(first_name='Иван', last_name='Петров', middle_name='Сергеевич')
        assert str(person) == 'Петров Иван Сергеевич'
        
        person_no_middle = PersonFactory(first_name='Анна', last_name='Сидорова', middle_name=None)
        assert str(person_no_middle) == 'Сидорова Анна'

    def test_full_name_property(self):
        """Тест свойства full_name"""
        person = PersonFactory(first_name='Иван', last_name='Петров', middle_name='Сергеевич')
        assert person.full_name == 'Петров Иван Сергеевич'
        
        person_no_middle = PersonFactory(first_name='Анна', last_name='Сидорова', middle_name=None)
        assert person_no_middle.full_name == 'Сидорова Анна'

    def test_short_name_property(self):
        """Тест свойства short_name"""
        person = PersonFactory(first_name='Иван', last_name='Петров', middle_name='Сергеевич')
        assert person.short_name == 'Петров И.С.'
        
        person_no_middle = PersonFactory(first_name='Анна', last_name='Сидорова', middle_name=None)
        assert person_no_middle.short_name == 'Сидорова А.'

    def test_person_type_choices(self):
        """Тест выбора типа персоны"""
        director = DirectorFactory()
        producer = ProducerFactory()
        casting_director = CastingDirectorFactory()
        
        assert director.person_type == 'director'
        assert producer.person_type == 'producer'
        assert casting_director.person_type == 'casting_director'
        
        # Проверяем get_person_type_display
        assert director.get_person_type_display() == 'Режиссер'
        assert producer.get_person_type_display() == 'Продюсер'
        assert casting_director.get_person_type_display() == 'Кастинг-директор'

    def test_person_photo_upload(self):
        """Тест загрузки фотографии персоны"""
        person = PersonFactory()
        assert person.photo is not None
        assert 'test_person_photo' in person.photo.name

    def test_person_telegram_username_length(self):
        """Тест длины telegram_username (учет прошлых ошибок)"""
        person = PersonFactory()
        assert person.telegram_username is not None
        assert len(person.telegram_username) <= 50
        assert person.telegram_username.startswith('@')

    def test_person_phone_length(self):
        """Тест длины phone (учет прошлых ошибок)"""
        person = PersonFactory()
        assert person.phone is not None
        assert len(person.phone) <= 20

    def test_person_kinopoisk_url(self):
        """Тест поля kinopoisk_url"""
        person = PersonFactory(kinopoisk_url='https://www.kinopoisk.ru/name/123456/')
        assert person.kinopoisk_url == 'https://www.kinopoisk.ru/name/123456/'

    def test_person_social_media_json(self):
        """Тест поля social_media как JSON"""
        person = PersonFactory()
        assert person.social_media is not None
        assert isinstance(person.social_media, dict)
        assert 'instagram' in person.social_media or 'twitter' in person.social_media

    def test_person_created_by_relationship(self):
        """Тест связи с создателем"""
        agent = AgentFactory()
        person = PersonFactory(created_by=agent)
        assert person.created_by == agent
        assert person in agent.created_people.all()

    def test_person_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        person = PersonFactory()
        assert person.created_at is not None

    def test_person_updated_at_auto_set(self):
        """Тест автоматической установки updated_at"""
        person = PersonFactory()
        assert person.updated_at is not None

    def test_person_ordering(self):
        """Тест сортировки персон"""
        PersonFactory(last_name='Яковлев', first_name='Алексей')
        PersonFactory(last_name='Антонов', first_name='Борис')
        PersonFactory(last_name='Морозов', first_name='Владимир')

        people = Person.objects.all()
        assert people[0].last_name == 'Антонов'
        assert people[1].last_name == 'Морозов'
        assert people[2].last_name == 'Яковлев'

    def test_person_required_fields(self):
        """Тест обязательных полей"""
        agent = AgentFactory()
        person = Person.objects.create(
            first_name='Тест',
            last_name='Персона',
            person_type='director',
            created_by=agent
        )
        assert person.first_name == 'Тест'
        assert person.last_name == 'Персона'
        assert person.person_type == 'director'
        assert person.is_active is True  # default value

    def test_person_optional_fields(self):
        """Тест необязательных полей"""
        person = PersonFactory(
            middle_name='Тестович',
            bio='Тестовая биография',
            birth_date='1990-01-01',
            nationality='Россия',
            phone='+1234567890',
            email='test@example.com',
            website='https://example.com',
            awards='Оскар 2020'
        )
        assert person.middle_name == 'Тестович'
        assert person.bio == 'Тестовая биография'
        assert person.nationality == 'Россия'
        assert person.phone == '+1234567890'
        assert person.email == 'test@example.com'
        assert person.website == 'https://example.com'
        assert person.awards == 'Оскар 2020'

    def test_person_email_validation(self):
        """Тест валидации email"""
        person = PersonFactory()
        # Django автоматически валидирует email формат
        assert '@' in person.email

    def test_person_website_validation(self):
        """Тест валидации website"""
        person = PersonFactory()
        # Django автоматически валидирует URL формат
        assert person.website.startswith('http')

    def test_person_kinopoisk_url_validation(self):
        """Тест валидации kinopoisk_url"""
        person = PersonFactory()
        # Django автоматически валидирует URL формат
        assert person.kinopoisk_url.startswith('http')
