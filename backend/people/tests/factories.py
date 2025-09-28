import factory
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from users.tests.factories import AgentFactory


def create_test_photo():
    """Создает тестовое фото"""
    image = Image.new('RGB', (150, 150), color='green')
    image_io = BytesIO()
    image.save(image_io, format='JPEG')
    image_io.seek(0)
    return SimpleUploadedFile(
        "test_person_photo.jpg",
        image_io.getvalue(),
        content_type='image/jpeg'
    )


class PersonFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания тестовых персон"""

    class Meta:
        model = 'people.Person'

    person_type = factory.Iterator(['director', 'producer', 'casting_director'])
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    middle_name = factory.Faker('first_name')
    bio = factory.Faker('text', max_nb_chars=200)
    birth_date = factory.Faker('date_of_birth', minimum_age=18, maximum_age=80)
    nationality = factory.Faker('country')
    phone = factory.Sequence(lambda n: f'+{n:010d}')  # Короткий номер телефона
    email = factory.LazyAttribute(lambda obj: f'{obj.first_name.lower()}.{obj.last_name.lower()}@example.com')
    website = factory.Faker('url')
    # Учитываем прошлые ошибки с длиной telegram_username
    telegram_username = factory.LazyAttribute(lambda obj: f'@{obj.first_name[:5]}{obj.last_name[:5]}')
    kinopoisk_url = factory.Faker('url')
    social_media = factory.LazyFunction(lambda: {
        'instagram': '@test_instagram',
        'twitter': '@test_twitter',
    })
    awards = factory.Faker('text', max_nb_chars=100)
    is_active = True
    created_by = factory.SubFactory(AgentFactory, phone=factory.Sequence(lambda n: f'+{n:010d}'))

    @factory.post_generation
    def photo(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.photo = extracted
        else:
            self.photo = create_test_photo()


class DirectorFactory(PersonFactory):
    """Фабрика для создания режиссеров"""
    person_type = 'director'


class ProducerFactory(PersonFactory):
    """Фабрика для создания продюсеров"""
    person_type = 'producer'


class CastingDirectorFactory(PersonFactory):
    """Фабрика для создания кастинг-директоров"""
    person_type = 'casting_director'
