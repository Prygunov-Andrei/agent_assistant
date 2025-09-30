import pytest
from django.core.exceptions import ValidationError
from projects.models import ProjectType, Genre, RoleType, Project, ProjectRole
from .factories import (
    ProjectTypeFactory, GenreFactory, RoleTypeFactory,
    ProjectFactory, ProjectRoleFactory, InProductionProjectFactory,
    CompletedProjectFactory, CancelledProjectFactory, ActorRoleFactory
)
from users.tests.factories import AgentFactory
from companies.tests.factories import CompanyFactory
from people.tests.factories import PersonFactory


@pytest.mark.django_db
class TestProjectTypeModel:
    """Тесты для модели ProjectType"""

    def test_project_type_creation(self):
        """Тест создания типа проекта"""
        project_type = ProjectTypeFactory()
        assert project_type.pk is not None
        assert project_type.name is not None
        assert project_type.is_active is True

    def test_project_type_str_representation(self):
        """Тест строкового представления типа проекта"""
        project_type = ProjectTypeFactory(name='Фильм')
        assert str(project_type) == 'Фильм'

    def test_project_type_ordering(self):
        """Тест сортировки типов проектов"""
        ProjectTypeFactory(name='Сериал')
        ProjectTypeFactory(name='Фильм')
        ProjectTypeFactory(name='Документальный')

        types = ProjectType.objects.all()
        # Сортировка по алфавиту
        assert types[0].name == 'Документальный'
        assert types[1].name == 'Сериал'
        assert types[2].name == 'Фильм'

    def test_project_type_unique_name(self):
        """Тест уникальности названия типа проекта"""
        ProjectTypeFactory(name='Уникальный тип')
        with pytest.raises(Exception):  # IntegrityError
            ProjectTypeFactory(name='Уникальный тип')


@pytest.mark.django_db
class TestGenreModel:
    """Тесты для модели Genre"""

    def test_genre_creation(self):
        """Тест создания жанра"""
        genre = GenreFactory()
        assert genre.pk is not None
        assert genre.name is not None
        assert genre.is_active is True

    def test_genre_str_representation(self):
        """Тест строкового представления жанра"""
        genre = GenreFactory(name='Драма')
        assert str(genre) == 'Драма'

    def test_genre_ordering(self):
        """Тест сортировки жанров"""
        GenreFactory(name='Комедия')
        GenreFactory(name='Драма')
        GenreFactory(name='Триллер')

        genres = Genre.objects.all()
        assert genres[0].name == 'Драма'
        assert genres[1].name == 'Комедия'
        assert genres[2].name == 'Триллер'

    def test_genre_unique_name(self):
        """Тест уникальности названия жанра"""
        GenreFactory(name='Уникальный жанр')
        with pytest.raises(Exception):  # IntegrityError
            GenreFactory(name='Уникальный жанр')


@pytest.mark.django_db
class TestRoleTypeModel:
    """Тесты для модели RoleType"""

    def test_role_type_creation(self):
        """Тест создания типа роли"""
        role_type = RoleTypeFactory()
        assert role_type.pk is not None
        assert role_type.name is not None
        assert role_type.is_active is True

    def test_role_type_str_representation(self):
        """Тест строкового представления типа роли"""
        role_type = RoleTypeFactory(name='Актер')
        assert str(role_type) == 'Актер'

    def test_role_type_ordering(self):
        """Тест сортировки типов ролей"""
        RoleTypeFactory(name='Оператор')
        RoleTypeFactory(name='Актер')
        RoleTypeFactory(name='Композитор')

        types = RoleType.objects.all()
        assert types[0].name == 'Актер'
        assert types[1].name == 'Композитор'
        assert types[2].name == 'Оператор'

    def test_role_type_unique_name(self):
        """Тест уникальности названия типа роли"""
        RoleTypeFactory(name='Уникальный тип роли')
        with pytest.raises(Exception):  # IntegrityError
            RoleTypeFactory(name='Уникальный тип роли')


@pytest.mark.django_db
class TestProjectModel:
    """Тесты для модели Project"""

    def test_project_creation(self):
        """Тест создания проекта"""
        project = ProjectFactory()
        assert project.pk is not None
        assert project.title is not None
        assert project.project_type is not None
        assert project.genre is not None
        assert project.is_active is True
        assert project.created_by is not None

    def test_project_str_representation(self):
        """Тест строкового представления проекта"""
        project = ProjectFactory(title='Тестовый проект')
        assert str(project) == 'Тестовый проект'

    def test_project_status_choices(self):
        """Тест выбора статуса проекта"""
        in_production = InProductionProjectFactory()
        completed = CompletedProjectFactory()
        cancelled = CancelledProjectFactory()

        assert in_production.status == 'in_production'
        assert completed.status == 'completed'
        assert cancelled.status == 'cancelled'

    def test_project_director_relationship(self):
        """Тест связи с режиссером"""
        director = PersonFactory(person_type='director')
        project = ProjectFactory(director=director)
        assert project.director == director
        assert project.director.person_type == 'director'

    def test_project_producers_relationship(self):
        """Тест связи с продюсерами"""
        producer1 = PersonFactory(person_type='producer')
        producer2 = PersonFactory(person_type='producer')
        project = ProjectFactory()
        project.producers.add(producer1, producer2)

        assert producer1 in project.producers.all()
        assert producer2 in project.producers.all()
        assert project in producer1.produced_projects.all()
        assert project in producer2.produced_projects.all()

    def test_project_production_company_relationship(self):
        """Тест связи с продюсерской компанией"""
        company = CompanyFactory()
        project = ProjectFactory(production_company=company)
        assert project.production_company == company

    def test_project_created_by_relationship(self):
        """Тест связи с создателем"""
        agent = AgentFactory()
        project = ProjectFactory(created_by=agent)
        assert project.created_by == agent
        # Проверяем обратную связь через related_name по умолчанию
        assert project in agent.project_set.all()

    def test_project_roles_relationship(self):
        """Тест связи с ролями"""
        project = ProjectFactory()
        role1 = ProjectRoleFactory(project=project)
        role2 = ProjectRoleFactory(project=project)

        assert role1 in project.roles.all()
        assert role2 in project.roles.all()
        assert role1.project == project
        assert role2.project == project

    def test_project_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        project = ProjectFactory()
        assert project.created_at is not None

    def test_project_updated_at_auto_set(self):
        """Тест автоматической установки updated_at"""
        project = ProjectFactory()
        assert project.updated_at is not None

    def test_project_ordering(self):
        """Тест сортировки проектов"""
        project1 = ProjectFactory()
        project2 = ProjectFactory()
        project3 = ProjectFactory()

        projects = Project.objects.all()
        # Сортировка по -created_at (новые сначала)
        assert projects[0].created_at >= projects[1].created_at
        assert projects[1].created_at >= projects[2].created_at

    def test_project_required_fields(self):
        """Тест обязательных полей"""
        agent = AgentFactory()
        project_type = ProjectTypeFactory()
        genre = GenreFactory()
        project = Project.objects.create(
            title='Обязательные поля',
            project_type=project_type,
            genre=genre,
            created_by=agent
        )
        assert project.title == 'Обязательные поля'
        assert project.project_type == project_type
        assert project.genre == genre
        assert project.created_by == agent
        assert project.is_active is True  # default value

    def test_project_optional_fields(self):
        """Тест необязательных полей"""
        project = ProjectFactory(
            status='in_production',
            description='Тестовое описание',
            premiere_date='2024-12-31'
        )
        assert project.status == 'in_production'
        assert project.description == 'Тестовое описание'
        assert str(project.premiere_date) == '2024-12-31'
    
    def test_project_request_relationship(self):
        """Тест связи с исходным запросом"""
        from telegram_requests.tests.factories import RequestFactory
        
        # Создаем запрос
        request = RequestFactory()
        
        # Создаем проект с запросом
        project = ProjectFactory(request=request)
        assert project.request == request
        
        # Проверяем обратную связь через related_name
        assert request.created_project == project
    
    def test_project_request_relationship_null(self):
        """Тест связи с исходным запросом (null)"""
        project = ProjectFactory(request=None)
        assert project.request is None
    
    def test_project_type_raw_field(self):
        """Тест поля project_type_raw"""
        # Тест с пустым значением
        project = ProjectFactory(project_type_raw='')
        assert project.project_type_raw == ''
        
        # Тест с значением
        project = ProjectFactory(project_type_raw='фильм')
        assert project.project_type_raw == 'фильм'
        
        # Тест с None
        project = ProjectFactory(project_type_raw=None)
        assert project.project_type_raw is None


@pytest.mark.django_db
class TestProjectRoleModel:
    """Тесты для модели ProjectRole"""

    def test_project_role_creation(self):
        """Тест создания роли в проекте"""
        role = ProjectRoleFactory()
        assert role.pk is not None
        assert role.name is not None
        assert role.project is not None
        assert role.is_active is True

    def test_project_role_str_representation(self):
        """Тест строкового представления роли"""
        project = ProjectFactory(title='Тестовый проект')
        role = ProjectRoleFactory(project=project, name='Главный герой')
        assert str(role) == 'Тестовый проект - Главный герой'

    def test_project_role_media_presence_choices(self):
        """Тест выбора медийности"""
        role_yes = ProjectRoleFactory(media_presence='yes')
        role_no = ProjectRoleFactory(media_presence='no')
        role_doesnt_matter = ProjectRoleFactory(media_presence='doesnt_matter')

        assert role_yes.media_presence == 'yes'
        assert role_no.media_presence == 'no'
        assert role_doesnt_matter.media_presence == 'doesnt_matter'

    def test_project_role_project_relationship(self):
        """Тест связи с проектом"""
        project = ProjectFactory()
        role = ProjectRoleFactory(project=project)
        assert role.project == project
        assert role in project.roles.all()

    def test_project_role_type_relationship(self):
        """Тест связи с типом роли"""
        role_type = RoleTypeFactory()
        role = ProjectRoleFactory(role_type=role_type)
        assert role.role_type == role_type

    def test_project_role_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        role = ProjectRoleFactory()
        assert role.created_at is not None

    def test_project_role_updated_at_auto_set(self):
        """Тест автоматической установки updated_at"""
        role = ProjectRoleFactory()
        assert role.updated_at is not None

    def test_project_role_ordering(self):
        """Тест сортировки ролей"""
        project = ProjectFactory()
        role1 = ProjectRoleFactory(project=project, name='Роль A')
        role2 = ProjectRoleFactory(project=project, name='Роль B')
        role3 = ProjectRoleFactory(project=project, name='Роль C')

        roles = ProjectRole.objects.filter(project=project)
        assert roles[0].name == 'Роль A'
        assert roles[1].name == 'Роль B'
        assert roles[2].name == 'Роль C'

    def test_project_role_required_fields(self):
        """Тест обязательных полей"""
        project = ProjectFactory()
        role = ProjectRole.objects.create(
            project=project,
            name='Обязательная роль'
        )
        assert role.project == project
        assert role.name == 'Обязательная роль'
        assert role.is_active is True  # default value

    def test_project_role_optional_fields(self):
        """Тест необязательных полей"""
        role = ProjectRoleFactory(
            description='Описание роли',
            media_presence='yes',
            clothing_size='M',
            hairstyle='Короткая',
            hair_color='Блондин',
            eye_color='Голубые',
            height='170-180',
            body_type='Среднее',
            reference_text='Текстовый референс',
            special_conditions='Особые условия',
            audition_requirements='Требования к пробам',
            audition_text='Текст проб',
            rate_per_shift='10000',
            rate_conditions='Условия по ставке',
            shooting_dates='2024-01-01 - 2024-01-10',
            shooting_location='Москва',
            notes='Заметки'
        )
        assert role.description == 'Описание роли'
        assert role.media_presence == 'yes'
        assert role.clothing_size == 'M'
        assert role.hairstyle == 'Короткая'
        assert role.hair_color == 'Блондин'
        assert role.eye_color == 'Голубые'
        assert role.height == '170-180'
        assert role.body_type == 'Среднее'
        assert role.reference_text == 'Текстовый референс'
        assert role.special_conditions == 'Особые условия'
        assert role.audition_requirements == 'Требования к пробам'
        assert role.audition_text == 'Текст проб'
        assert role.rate_per_shift == '10000'
        assert role.rate_conditions == 'Условия по ставке'
        assert role.shooting_dates == '2024-01-01 - 2024-01-10'
        assert role.shooting_location == 'Москва'
        assert role.notes == 'Заметки'

    def test_project_role_photo_upload(self):
        """Тест загрузки фото референса"""
        role = ProjectRoleFactory()
        assert role.reference_photo is not None
        assert 'test_reference_photo' in role.reference_photo.name

    def test_project_role_audition_file_upload(self):
        """Тест загрузки файла проб"""
        role = ProjectRoleFactory()
        assert role.audition_files is not None
        assert 'test_audition' in role.audition_files.name
    
    def test_project_role_suggested_artists_relationship(self):
        """Тест связи с предложенными артистами"""
        from artists.tests.factories import ArtistFactory
        
        # Создаем артистов
        artist1 = ArtistFactory()
        artist2 = ArtistFactory()
        
        # Создаем роль с предложенными артистами
        role = ProjectRoleFactory()
        role.suggested_artists.add(artist1, artist2)
        
        # Проверяем связи
        assert artist1 in role.suggested_artists.all()
        assert artist2 in role.suggested_artists.all()
        assert role in artist1.suggested_roles.all()
        assert role in artist2.suggested_roles.all()
    
    def test_project_role_suggested_artists_empty(self):
        """Тест пустого списка предложенных артистов"""
        role = ProjectRoleFactory()
        assert role.suggested_artists.count() == 0
    
    def test_project_role_skills_required_field(self):
        """Тест поля skills_required"""
        # Тест с пустым списком
        role = ProjectRoleFactory(skills_required=[])
        assert role.skills_required == []
        
        # Тест с навыками
        skills = ['Актерское мастерство', 'Драма', 'Комедия']
        role = ProjectRoleFactory(skills_required=skills)
        assert role.skills_required == skills
        
        # Тест с None
        role = ProjectRoleFactory(skills_required=None)
        assert role.skills_required is None
    
    def test_project_role_skills_required_default(self):
        """Тест дефолтного значения skills_required"""
        role = ProjectRoleFactory(skills_required=[])
        assert role.skills_required == []
