import factory
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from tests.unit.users.factories import AgentFactory
from tests.unit.companies.factories import CompanyFactory
from tests.unit.people.factories import PersonFactory


def create_test_reference_photo():
    """Создает тестовое фото референс"""
    image = Image.new('RGB', (300, 400), color='purple')
    image_io = BytesIO()
    image.save(image_io, format='JPEG')
    image_io.seek(0)
    return SimpleUploadedFile(
        "test_reference_photo.jpg",
        image_io.getvalue(),
        content_type='image/jpeg'
    )


def create_test_audition_file():
    """Создает тестовый файл проб"""
    content = b"Test audition file content"
    return SimpleUploadedFile(
        "test_audition.txt",
        content,
        content_type='text/plain'
    )


class ProjectTypeFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания типов проектов"""

    class Meta:
        model = 'projects.ProjectType'
        skip_postgeneration_save = True

    name = factory.Sequence(lambda n: f'Тип проекта {n}')
    description = factory.Faker('text', max_nb_chars=200)
    is_active = True


class GenreFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания жанров"""

    class Meta:
        model = 'projects.Genre'
        skip_postgeneration_save = True

    name = factory.Sequence(lambda n: f'Жанр {n}')
    description = factory.Faker('text', max_nb_chars=200)
    is_active = True


class RoleTypeFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания типов ролей"""

    class Meta:
        model = 'projects.RoleType'
        skip_postgeneration_save = True

    name = factory.Sequence(lambda n: f'Тип роли {n}')
    description = factory.Faker('text', max_nb_chars=200)
    is_active = True


class ProjectFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания проектов"""

    class Meta:
        model = 'projects.Project'
        skip_postgeneration_save = True

    title = factory.Sequence(lambda n: f'Проект {n}')
    project_type = factory.SubFactory(ProjectTypeFactory)
    status = factory.Iterator(['in_production', 'cancelled', 'completed'])
    description = factory.Faker('text', max_nb_chars=500)
    genre = factory.SubFactory(GenreFactory)
    premiere_date = factory.Faker('future_date', end_date='+30d')
    director = factory.SubFactory(PersonFactory, person_type='director')
    production_company = factory.SubFactory(CompanyFactory)
    is_active = True
    created_by = factory.SubFactory(AgentFactory)
    request = None
    project_type_raw = factory.Faker('word')

    @factory.post_generation
    def producers(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for producer in extracted:
                self.producers.add(producer)
        else:
            # Добавляем 1-2 случайных продюсера
            producers = PersonFactory.create_batch(2, person_type='producer')
            for producer in producers:
                self.producers.add(producer)


class ProjectRoleFactory(factory.django.DjangoModelFactory):
    """Фабрика для создания ролей в проектах"""

    class Meta:
        model = 'projects.ProjectRole'
        skip_postgeneration_save = True

    project = factory.SubFactory(ProjectFactory)
    name = factory.Sequence(lambda n: f'Роль {n}')
    role_type = factory.SubFactory(RoleTypeFactory)
    description = factory.Faker('text', max_nb_chars=300)
    media_presence = factory.Iterator(['yes', 'no', 'doesnt_matter'])
    clothing_size = factory.Iterator(['S', 'M', 'L', 'XL', 'XXL'])
    hairstyle = factory.Iterator(['Короткая', 'Длинная', 'Средняя', 'Лысая'])
    hair_color = factory.Iterator(['Блондин', 'Брюнет', 'Рыжий', 'Шатен'])
    eye_color = factory.Iterator(['Голубые', 'Карие', 'Зеленые', 'Серые'])
    height = factory.Iterator(['150-160', '160-170', '170-180', '180-190'])
    body_type = factory.Iterator(['Худощавое', 'Среднее', 'Крепкое', 'Полное'])
    reference_text = factory.Faker('text', max_nb_chars=200)
    special_conditions = factory.Faker('text', max_nb_chars=150)
    audition_requirements = factory.Faker('text', max_nb_chars=200)
    audition_text = factory.Faker('text', max_nb_chars=300)
    rate_per_shift = factory.Iterator(['5000', '10000', '15000', '20000'])
    rate_conditions = factory.Faker('text', max_nb_chars=100)
    shooting_dates = factory.Faker('text', max_nb_chars=100)
    shooting_location = factory.Faker('city')
    notes = factory.Faker('text', max_nb_chars=150)
    is_active = True
    skills_required = factory.LazyFunction(lambda: ['Актерское мастерство', 'Драма'])

    @factory.post_generation
    def reference_photo(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.reference_photo = extracted
        else:
            self.reference_photo = create_test_reference_photo()

    @factory.post_generation
    def audition_files(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.audition_files = extracted
        else:
            self.audition_files = create_test_audition_file()
    
    @factory.post_generation
    def suggested_artists(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for artist in extracted:
                self.suggested_artists.add(artist)


# Специализированные фабрики
class InProductionProjectFactory(ProjectFactory):
    """Фабрика для проектов в производстве"""
    status = 'in_production'


class CompletedProjectFactory(ProjectFactory):
    """Фабрика для завершенных проектов"""
    status = 'completed'


class CancelledProjectFactory(ProjectFactory):
    """Фабрика для отмененных проектов"""
    status = 'cancelled'


class ActorRoleFactory(ProjectRoleFactory):
    """Фабрика для актерских ролей"""
    role_type = factory.SubFactory(RoleTypeFactory, name='Актер')
    name = factory.Sequence(lambda n: f'Персонаж {n}')


class DirectorRoleFactory(ProjectRoleFactory):
    """Фабрика для режиссерских ролей"""
    role_type = factory.SubFactory(RoleTypeFactory, name='Режиссер')
    name = factory.Sequence(lambda n: f'Режиссер {n}')
