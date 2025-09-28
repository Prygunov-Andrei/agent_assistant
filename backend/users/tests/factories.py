import factory
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile


def create_test_image():
    """Создает тестовое изображение"""
    image = Image.new('RGB', (100, 100), color='red')
    image_io = BytesIO()
    image.save(image_io, format='JPEG')
    image_io.seek(0)
    return SimpleUploadedFile(
        'test_image.jpg',
        image_io.getvalue(),
        content_type='image/jpeg'
    )


class AgentFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания тестовых агентов"""
    
    class Meta:
        model = 'users.Agent'
    
    username = factory.Sequence(lambda n: f'agent_{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    phone = factory.Sequence(lambda n: f'+{n:010d}')
    bio = factory.Faker('text', max_nb_chars=100)
    telegram_username = factory.LazyAttribute(lambda obj: f'@{obj.username[:10]}')  # Максимум 20 символов
    is_active = True
    
    @factory.post_generation
    def photo(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.photo = extracted
        else:
            self.photo = create_test_image()


class AdminAgentFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания тестовых админов"""
    
    class Meta:
        model = 'users.Agent'
    
    username = factory.Sequence(lambda n: f'admin_{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_staff = True
    is_superuser = True
    is_active = True
