import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from companies.models import Company
from people.models import Person
from projects.models import Project, ProjectRole
from users.tests.factories import AgentFactory
from companies.tests.factories import CompanyFactory
from people.tests.factories import PersonFactory
from projects.tests.factories import ProjectFactory, ProjectRoleFactory

User = get_user_model()


@pytest.mark.django_db
class TestAgentCompanyIntegration:
    """Интеграционные тесты между агентами и кинокомпаниями"""
    
    def test_agent_can_create_company(self, authenticated_client, agent):
        """Тест что агент может создать кинокомпанию"""
        url = reverse('company-list')
        data = {
            'name': 'Agent Studio',
            'company_type': 'production',
            'description': 'Studio created by agent',
            'website': 'https://agentstudio.com',
            'email': 'info@agentstudio.com'
        }
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Agent Studio'
        assert response.data['created_by'] == agent.id
        
        # Проверяем что компания создалась в БД
        company = Company.objects.get(name='Agent Studio')
        assert company.created_by == agent
    
    def test_agent_can_view_own_companies(self, authenticated_client, agent):
        """Тест что агент может просматривать свои компании"""
        # Создаем компании для разных агентов
        own_company = CompanyFactory(created_by=agent)
        other_company = CompanyFactory()
        
        # Проверяем эндпоинт моих компаний
        url = reverse('company-my-companies')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == own_company.id
        assert response.data[0]['name'] == own_company.name
    
    def test_agent_can_update_own_company(self, authenticated_client, agent):
        """Тест что агент может обновлять свою компанию"""
        company = CompanyFactory(created_by=agent)
        url = reverse('company-detail', kwargs={'pk': company.pk})
        
        data = {
            'name': 'Updated Company Name',
            'description': 'Updated description'
        }
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Company Name'
        assert response.data['description'] == 'Updated description'
        
        # Проверяем что изменения сохранились в БД
        company.refresh_from_db()
        assert company.name == 'Updated Company Name'
        assert company.description == 'Updated description'
    
    def test_agent_can_delete_own_company(self, authenticated_client, agent):
        """Тест что агент может удалить свою компанию"""
        company = CompanyFactory(created_by=agent)
        url = reverse('company-detail', kwargs={'pk': company.pk})
        
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Проверяем что компания удалена из БД
        assert not Company.objects.filter(pk=company.pk).exists()
    
    def test_agent_can_search_companies(self, authenticated_client):
        """Тест что агент может искать компании"""
        # Создаем тестовые компании
        CompanyFactory(name='Hollywood Studio', company_type='production')
        CompanyFactory(name='Netflix', company_type='streaming')
        CompanyFactory(name='Warner Bros', company_type='studio')
        
        # Поиск по названию
        url = reverse('company-search')
        response = authenticated_client.get(url, {'q': 'Studio'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Hollywood Studio'
        
        # Поиск по типу
        response = authenticated_client.get(url, {'type': 'streaming'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Netflix'
    
    def test_agent_profile_management(self, authenticated_client, agent):
        """Тест управления профилем агента"""
        # Получаем профиль
        url = reverse('agent-me')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == agent.username
        
        # Обновляем профиль
        update_url = reverse('agent-update-profile')
        data = {
            'first_name': 'Updated First',
            'last_name': 'Updated Last',
            'phone': '+1234567890',
            'bio': 'Updated bio'
        }
        response = authenticated_client.patch(update_url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated First'
        assert response.data['last_name'] == 'Updated Last'
        assert response.data['phone'] == '+1234567890'
        assert response.data['bio'] == 'Updated bio'
        
        # Проверяем что изменения сохранились в БД
        agent.refresh_from_db()
        assert agent.first_name == 'Updated First'
        assert agent.last_name == 'Updated Last'
        assert agent.phone == '+1234567890'
        assert agent.bio == 'Updated bio'
    
    def test_company_creation_auto_sets_created_by(self, authenticated_client, agent):
        """Тест что при создании компании автоматически устанавливается created_by"""
        url = reverse('company-list')
        data = {
            'name': 'Auto Created Company',
            'company_type': 'production'
        }
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created_by'] == agent.id
        
        # Проверяем в БД
        company = Company.objects.get(name='Auto Created Company')
        assert company.created_by == agent
    
    def test_company_list_shows_all_active_companies(self, authenticated_client):
        """Тест что список компаний показывает все активные компании"""
        # Создаем компании разных агентов
        CompanyFactory(name='Company 1', is_active=True)
        CompanyFactory(name='Company 2', is_active=True)
        CompanyFactory(name='Company 3', is_active=False)  # Неактивная
        
        url = reverse('company-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2  # Только активные
        
        company_names = [company['name'] for company in response.data['results']]
        assert 'Company 1' in company_names
        assert 'Company 2' in company_names
        assert 'Company 3' not in company_names


@pytest.mark.django_db
class TestAgentPersonIntegration:
    """Интеграционные тесты между агентами и персонами"""
    
    def test_agent_can_create_person(self, authenticated_client, agent):
        """Тест что агент может создать персону"""
        url = reverse('person-list')
        data = {
            'first_name': 'Иван',
            'last_name': 'Петров',
            'person_type': 'director',
            'middle_name': 'Сергеевич',
            'bio': 'Известный режиссер',
            'nationality': 'Россия'
        }
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'Иван'
        assert response.data['last_name'] == 'Петров'
        assert response.data['created_by'] == agent.username
        
        # Проверяем что персона создалась в БД
        person = Person.objects.get(first_name='Иван', last_name='Петров')
        assert person.created_by == agent
    
    def test_agent_can_view_own_people(self, authenticated_client, agent):
        """Тест что агент может просматривать своих персон"""
        # Создаем персон для разных агентов
        own_person = PersonFactory(created_by=agent)
        other_person = PersonFactory()
        
        # Проверяем эндпоинт моих персон
        url = reverse('person-my-people')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == own_person.id
        assert response.data[0]['first_name'] == own_person.first_name
    
    def test_agent_can_update_own_person(self, authenticated_client, agent):
        """Тест что агент может обновлять свою персону"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        
        data = {
            'first_name': 'Обновленное имя',
            'bio': 'Обновленная биография'
        }
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Обновленное имя'
        assert response.data['bio'] == 'Обновленная биография'
        
        # Проверяем что изменения сохранились в БД
        person.refresh_from_db()
        assert person.first_name == 'Обновленное имя'
        assert person.bio == 'Обновленная биография'
    
    def test_agent_can_delete_own_person(self, authenticated_client, agent):
        """Тест что агент может удалить свою персону"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Проверяем что персона удалена из БД
        assert not Person.objects.filter(pk=person.pk).exists()
    
    def test_agent_can_search_people(self, authenticated_client):
        """Тест что агент может искать персон"""
        # Создаем тестовых персон
        PersonFactory(first_name='Иван', last_name='Петров', person_type='director')
        PersonFactory(first_name='Петр', last_name='Иванов', person_type='producer')
        PersonFactory(first_name='Анна', last_name='Сидорова', person_type='director')
        
        # Поиск по имени
        url = reverse('person-search')
        response = authenticated_client.get(url, {'name': 'Иван'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Иван Петров и Петр Иванов
        
        # Поиск по типу
        response = authenticated_client.get(url, {'person_type': 'director'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Два режиссера
    
    def test_person_creation_auto_sets_created_by(self, authenticated_client, agent):
        """Тест что при создании персоны автоматически устанавливается created_by"""
        url = reverse('person-list')
        data = {
            'first_name': 'Авто',
            'last_name': 'Создан',
            'person_type': 'producer'
        }
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created_by'] == agent.username
        
        # Проверяем в БД
        person = Person.objects.get(first_name='Авто', last_name='Создан')
        assert person.created_by == agent
    
    def test_person_list_shows_all_active_people(self, authenticated_client):
        """Тест что список персон показывает все активные персоны"""
        # Создаем персон разных агентов
        PersonFactory(first_name='Персона 1', is_active=True)
        PersonFactory(first_name='Персона 2', is_active=True)
        PersonFactory(first_name='Персона 3', is_active=False)  # Неактивная
        
        url = reverse('person-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2  # Только активные
        
        person_names = [person['first_name'] for person in response.data['results']]
        assert 'Персона 1' in person_names
        assert 'Персона 2' in person_names
        assert 'Персона 3' not in person_names


@pytest.mark.django_db
class TestAgentProjectIntegration:
    """Интеграционные тесты между агентами и проектами"""

    def test_agent_can_create_project(self, authenticated_client, agent):
        """Тест что агент может создать проект"""
        from projects.models import ProjectType, Genre
        
        # Создаем необходимые справочники
        project_type = ProjectType.objects.create(name='Фильм')
        genre = Genre.objects.create(name='Драма')
        
        url = reverse('project-list')
        data = {
            'title': 'Новый фильм',
            'project_type': project_type.id,
            'genre': genre.id,
            'status': 'in_production',
            'description': 'Описание фильма'
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Новый фильм'
        assert response.data['created_by'] == agent.username

        # Проверяем что проект создался в БД
        project = Project.objects.get(title='Новый фильм')
        assert project.created_by == agent

    def test_agent_can_view_own_projects(self, authenticated_client, agent):
        """Тест что агент может просматривать свои проекты"""
        # Создаем проекты для разных агентов
        own_project = ProjectFactory(created_by=agent)
        other_project = ProjectFactory()

        # Проверяем эндпоинт моих проектов
        url = reverse('project-my-projects')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == own_project.id
        assert response.data[0]['title'] == own_project.title

    def test_agent_can_update_own_project(self, authenticated_client, agent):
        """Тест что агент может обновлять свой проект"""
        project = ProjectFactory(created_by=agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})

        data = {
            'title': 'Обновленное название',
            'description': 'Обновленное описание'
        }
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Обновленное название'
        assert response.data['description'] == 'Обновленное описание'

        # Проверяем что изменения сохранились в БД
        project.refresh_from_db()
        assert project.title == 'Обновленное название'
        assert project.description == 'Обновленное описание'

    def test_agent_can_delete_own_project(self, authenticated_client, agent):
        """Тест что агент может удалить свой проект"""
        project = ProjectFactory(created_by=agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})

        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Проверяем что проект удален из БД
        assert not Project.objects.filter(pk=project.pk).exists()

    def test_agent_can_search_projects(self, authenticated_client):
        """Тест что агент может искать проекты"""
        # Создаем тестовые проекты
        ProjectFactory(title='Фильм о любви', status='in_production')
        ProjectFactory(title='Фильм о войне', status='completed')
        ProjectFactory(title='Сериал о детективах', status='in_production')

        # Поиск по названию
        url = reverse('project-search')
        response = authenticated_client.get(url, {'title': 'Фильм'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # Два или больше фильмов

        # Поиск по статусу
        response = authenticated_client.get(url, {'status': 'in_production'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Два проекта в производстве

    def test_project_creation_auto_sets_created_by(self, authenticated_client, agent):
        """Тест что при создании проекта автоматически устанавливается created_by"""
        from projects.models import ProjectType, Genre
        
        project_type = ProjectType.objects.create(name='Фильм')
        genre = Genre.objects.create(name='Драма')
        
        url = reverse('project-list')
        data = {
            'title': 'Авто проект',
            'project_type': project_type.id,
            'genre': genre.id
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['created_by'] == agent.username

        # Проверяем в БД
        project = Project.objects.get(title='Авто проект')
        assert project.created_by == agent

    def test_project_list_shows_all_active_projects(self, authenticated_client):
        """Тест что список проектов показывает все активные проекты"""
        # Создаем проекты разных агентов
        ProjectFactory(title='Проект 1', is_active=True)
        ProjectFactory(title='Проект 2', is_active=True)
        ProjectFactory(title='Проект 3', is_active=False)  # Неактивный

        url = reverse('project-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2  # Только активные

        project_titles = [project['title'] for project in response.data['results']]
        assert 'Проект 1' in project_titles
        assert 'Проект 2' in project_titles
        assert 'Проект 3' not in project_titles


@pytest.mark.django_db
class TestProjectRoleIntegration:
    """Интеграционные тесты для ролей в проектах"""

    def test_agent_can_create_role_in_own_project(self, authenticated_client, agent):
        """Тест что агент может создать роль в своем проекте"""
        from projects.models import ProjectType, Genre, RoleType
        
        project_type = ProjectType.objects.create(name='Фильм')
        genre = Genre.objects.create(name='Драма')
        role_type = RoleType.objects.create(name='Актер')
        
        project = Project.objects.create(
            title='Тестовый проект',
            project_type=project_type,
            genre=genre,
            created_by=agent
        )
        
        url = reverse('projectrole-list')
        data = {
            'project': project.id,
            'name': 'Главный герой',
            'role_type': role_type.id,
            'description': 'Описание роли',
            'media_presence': 'yes'
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Главный герой'
        assert response.data['project'] == project.id

        # Проверяем что роль создалась в БД
        role = ProjectRole.objects.get(name='Главный герой')
        assert role.project == project

    def test_agent_can_view_roles_in_own_project(self, authenticated_client, agent):
        """Тест что агент может просматривать роли в своем проекте"""
        project = ProjectFactory(created_by=agent)
        role1 = ProjectRoleFactory(project=project, name='Роль 1')
        role2 = ProjectRoleFactory(project=project, name='Роль 2')

        url = reverse('projectrole-by-project')
        response = authenticated_client.get(url, {'project_id': project.id})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        role_names = [role['name'] for role in response.data]
        assert 'Роль 1' in role_names
        assert 'Роль 2' in role_names

    def test_agent_can_update_role_in_own_project(self, authenticated_client, agent):
        """Тест что агент может обновлять роль в своем проекте"""
        project = ProjectFactory(created_by=agent)
        role = ProjectRoleFactory(project=project, name='Старая роль')
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        data = {
            'name': 'Новая роль',
            'description': 'Обновленное описание'
        }
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Новая роль'
        assert response.data['description'] == 'Обновленное описание'

        # Проверяем что изменения сохранились в БД
        role.refresh_from_db()
        assert role.name == 'Новая роль'
        assert role.description == 'Обновленное описание'

    def test_agent_can_delete_role_in_own_project(self, authenticated_client, agent):
        """Тест что агент может удалить роль из своего проекта"""
        project = ProjectFactory(created_by=agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Проверяем что роль удалена из БД
        assert not ProjectRole.objects.filter(pk=role.pk).exists()

    def test_agent_cannot_manage_roles_in_other_project(self, authenticated_client, another_agent):
        """Тест что агент не может управлять ролями в проекте другого агента"""
        project = ProjectFactory(created_by=another_agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        # Попытка обновить роль
        data = {'name': 'Взломанная роль'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Попытка удалить роль
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_role_search(self, authenticated_client):
        """Тест поиска ролей"""
        ProjectRoleFactory(name='Главный герой', media_presence='yes')
        ProjectRoleFactory(name='Второстепенный герой', media_presence='no')
        ProjectRoleFactory(name='Злодей', media_presence='yes')

        url = reverse('projectrole-search')
        
        # Поиск по названию
        response = authenticated_client.get(url, {'name': 'герой'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

        # Поиск по медийности
        response = authenticated_client.get(url, {'media_presence': 'yes'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
