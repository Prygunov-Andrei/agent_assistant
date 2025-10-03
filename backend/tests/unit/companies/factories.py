import factory
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile


def create_test_logo():
    """Создает тестовый логотип"""
    image = Image.new('RGB', (200, 200), color='blue')
    image_io = BytesIO()
    image.save(image_io, format='PNG')
    image_io.seek(0)
    return SimpleUploadedFile(
        'test_logo.png',
        image_io.getvalue(),
        content_type='image/png'
    )


class CompanyFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания тестовых кинокомпаний"""
    
    class Meta:
        model = 'companies.Company'
        skip_postgeneration_save = True
    
    name = factory.Faker('company')
    company_type = factory.Iterator(['production', 'distribution', 'studio', 'network', 'streaming'])
    description = factory.Faker('text', max_nb_chars=500)
    website = factory.Faker('url')
    email = factory.Faker('email')
    phone = factory.Sequence(lambda n: f'+{n:010d}')
    address = factory.Faker('address')
    founded_year = factory.Faker('year')
    is_active = True
    created_by = factory.SubFactory('tests.unit.users.factories.AgentFactory', phone=factory.Sequence(lambda n: f'+{n:010d}'))
    
    @factory.post_generation
    def logo(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.logo = extracted
        else:
            self.logo = create_test_logo()
