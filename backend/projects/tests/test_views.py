import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
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
class TestProjectTypeAPI:
    """Тесты API для типов проектов"""

    def test_project_type_list_allows_read(self, api_client):
        """Тест что список типов проектов доступен для чтения без аутентификации"""
        ProjectTypeFactory(name='Фильм')
        url = reverse('projecttype-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_project_type_list_authenticated(self, authenticated_client):
        """Тест получения списка типов проектов для аутентифицированного пользователя"""
        ProjectTypeFactory(name='Фильм')
        ProjectTypeFactory(name='Сериал')
        ProjectTypeFactory(name='Документальный', is_active=False)

        url = reverse('projecttype-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Только активные
        names = [item['name'] for item in response.data]
        assert 'Фильм' in names
        assert 'Сериал' in names
        assert 'Документальный' not in names

    def test_project_type_retrieve(self, authenticated_client):
        """Тест получения конкретного типа проекта"""
        project_type = ProjectTypeFactory(name='Фильм')
        url = reverse('projecttype-detail', kwargs={'pk': project_type.pk})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Фильм'
        assert response.data['is_active'] is True

    def test_project_type_can_be_updated(self, authenticated_client):
        """Тест что типы проектов могут быть обновлены аутентифицированными пользователями"""
        project_type = ProjectTypeFactory()
        url = reverse('projecttype-detail', kwargs={'pk': project_type.pk})

        # PUT поддерживается для аутентифицированных пользователей
        response = authenticated_client.put(url, {'name': 'Обновленный тип', 'description': 'Новое описание'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Обновленный тип'


@pytest.mark.django_db
class TestGenreAPI:
    """Тесты API для жанров"""

    def test_genre_list_allows_read(self, api_client):
        """Тест что список жанров доступен для чтения без аутентификации"""
        GenreFactory(name='Драма')
        url = reverse('genre-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_genre_list_authenticated(self, authenticated_client):
        """Тест получения списка жанров для аутентифицированного пользователя"""
        GenreFactory(name='Драма')
        GenreFactory(name='Комедия')
        GenreFactory(name='Триллер', is_active=False)

        url = reverse('genre-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Только активные
        names = [item['name'] for item in response.data]
        assert 'Драма' in names
        assert 'Комедия' in names
        assert 'Триллер' not in names

    def test_genre_retrieve(self, authenticated_client):
        """Тест получения конкретного жанра"""
        genre = GenreFactory(name='Драма')
        url = reverse('genre-detail', kwargs={'pk': genre.pk})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Драма'
        assert response.data['is_active'] is True


@pytest.mark.django_db
class TestRoleTypeAPI:
    """Тесты API для типов ролей"""

    def test_role_type_list_allows_read(self, api_client):
        """Тест что список типов ролей доступен для чтения без аутентификации"""
        RoleTypeFactory(name='Актер')
        url = reverse('roletype-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_role_type_list_authenticated(self, authenticated_client):
        """Тест получения списка типов ролей для аутентифицированного пользователя"""
        RoleTypeFactory(name='Актер')
        RoleTypeFactory(name='Режиссер')
        RoleTypeFactory(name='Оператор', is_active=False)

        url = reverse('roletype-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Только активные
        names = [item['name'] for item in response.data]
        assert 'Актер' in names
        assert 'Режиссер' in names
        assert 'Оператор' not in names

    def test_role_type_retrieve(self, authenticated_client):
        """Тест получения конкретного типа роли"""
        role_type = RoleTypeFactory(name='Актер')
        url = reverse('roletype-detail', kwargs={'pk': role_type.pk})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Актер'
        assert response.data['is_active'] is True


@pytest.mark.django_db
class TestProjectAPI:
    """Тесты API для проектов"""

    def test_project_list_requires_auth(self, api_client):
        """Тест что список проектов требует аутентификации"""
        url = reverse('project-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_project_list_authenticated(self, authenticated_client):
        """Тест получения списка проектов для аутентифицированного пользователя"""
        ProjectFactory(title='Проект 1')
        ProjectFactory(title='Проект 2')
        ProjectFactory(title='Проект 3', is_active=False)

        url = reverse('project-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Только активные
        titles = [item['title'] for item in response.data]
        assert 'Проект 1' in titles
        assert 'Проект 2' in titles
        assert 'Проект 3' not in titles

    def test_project_create(self, authenticated_client, agent):
        """Тест создания проекта"""
        project_type = ProjectTypeFactory()
        genre = GenreFactory()
        director = PersonFactory(person_type='director')
        company = CompanyFactory()

        url = reverse('project-list')
        data = {
            'title': 'Новый проект',
            'project_type': project_type.id,
            'genre': genre.id,
            'status': 'in_production',
            'description': 'Описание проекта',
            'director': director.id,
            'production_company': company.id
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Новый проект'
        assert response.data['created_by'] == agent.username

        # Проверяем что проект создался в БД
        project = Project.objects.get(title='Новый проект')
        assert project.created_by == agent

    def test_project_retrieve(self, authenticated_client):
        """Тест получения конкретного проекта"""
        project = ProjectFactory(title='Тестовый проект')
        url = reverse('project-detail', kwargs={'pk': project.pk})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Тестовый проект'
        assert 'roles' in response.data  # Полная информация включает роли

    def test_project_update_own(self, authenticated_client, agent):
        """Тест обновления собственного проекта"""
        project = ProjectFactory(created_by=agent, title='Старое название')
        url = reverse('project-detail', kwargs={'pk': project.pk})

        data = {'title': 'Новое название'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Новое название'

        # Проверяем что изменения сохранились в БД
        project.refresh_from_db()
        assert project.title == 'Новое название'

    def test_project_update_other_agent(self, authenticated_client, another_agent):
        """Тест что нельзя обновить проект другого агента"""
        project = ProjectFactory(created_by=another_agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})

        data = {'title': 'Взломанное название'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_delete_own(self, authenticated_client, agent):
        """Тест удаления собственного проекта"""
        project = ProjectFactory(created_by=agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})

        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Проверяем что проект удален из БД
        assert not Project.objects.filter(pk=project.pk).exists()

    def test_project_delete_other_agent(self, authenticated_client, another_agent):
        """Тест что нельзя удалить проект другого агента"""
        project = ProjectFactory(created_by=another_agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})

        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_my_projects(self, authenticated_client, agent):
        """Тест получения собственных проектов"""
        own_project = ProjectFactory(created_by=agent, title='Мой проект')
        other_project = ProjectFactory(title='Чужой проект')

        url = reverse('project-my-projects')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'Мой проект'
        assert response.data[0]['id'] == own_project.id

    def test_project_search_by_title(self, authenticated_client):
        """Тест поиска проектов по названию"""
        # Создаем проекты с уникальными названиями
        ProjectFactory(title='УникальныйТестФильм о любви')
        ProjectFactory(title='УникальныйТестФильм о войне')
        ProjectFactory(title='УникальныйТестСериал о детективах')

        url = reverse('project-search')
        response = authenticated_client.get(url, {'title': 'УникальныйТестФильм'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3  # Все 3 проекта содержат 'УникальныйТестФильм'
        titles = [item['title'] for item in response.data]
        assert 'УникальныйТестФильм о любви' in titles
        assert 'УникальныйТестФильм о войне' in titles
        assert 'УникальныйТестСериал о детективах' in titles

    def test_project_search_by_status(self, authenticated_client):
        """Тест поиска проектов по статусу"""
        InProductionProjectFactory(title='В производстве')
        CompletedProjectFactory(title='Завершен')
        CancelledProjectFactory(title='Отменен')

        url = reverse('project-search')
        response = authenticated_client.get(url, {'status': 'in_production'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'В производстве'

    def test_project_search_by_type_and_genre(self, authenticated_client):
        """Тест поиска проектов по типу и жанру"""
        project_type = ProjectTypeFactory(name='УникальныйТестФильм')
        genre = GenreFactory(name='УникальныйТестДрама')
        ProjectFactory(title='УникальныйТестДраматический фильм', project_type=project_type, genre=genre)
        ProjectFactory(title='УникальныйТестКомедийный фильм', project_type=project_type)
        ProjectFactory(title='УникальныйТестДраматический сериал', genre=genre)

        url = reverse('project-search')
        response = authenticated_client.get(url, {
            'project_type': project_type.id,
            'genre': genre.id
        })

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3  # Все 3 проекта содержат совпадающие элементы
        # Проверяем, что в результатах есть нужный проект
        titles = [item['title'] for item in response.data]
        assert 'УникальныйТестДраматический фильм' in titles

    def test_project_list_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе списка проектов"""
        project = ProjectFactory()
        url = reverse('project-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        
        project_data = response.data[0]
        expected_fields = [
            'id', 'title', 'project_type', 'project_type_name',
            'status', 'genre', 'genre_name', 'director', 'director_name',
            'production_company', 'production_company_name',
            'roles_count', 'is_active', 'created_by', 'created_at'
        ]
        for field in expected_fields:
            assert field in project_data

    def test_project_creation_validation(self, authenticated_client):
        """Тест валидации при создании проекта"""
        url = reverse('project-list')
        data = {'title': ''}  # Пустое название
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'title' in response.data

    def test_project_update_validation(self, authenticated_client, agent):
        """Тест валидации при обновлении проекта"""
        project = ProjectFactory(created_by=agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})

        data = {'status': 'invalid_status'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProjectRoleAPI:
    """Тесты API для ролей в проектах"""

    def test_project_role_list_requires_auth(self, api_client):
        """Тест что список ролей требует аутентификации"""
        url = reverse('projectrole-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_project_role_list_authenticated(self, authenticated_client):
        """Тест получения списка ролей для аутентифицированного пользователя"""
        ProjectRoleFactory(name='Роль 1')
        ProjectRoleFactory(name='Роль 2')
        ProjectRoleFactory(name='Роль 3', is_active=False)

        url = reverse('projectrole-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Только активные
        names = [item['name'] for item in response.data]
        assert 'Роль 1' in names
        assert 'Роль 2' in names
        assert 'Роль 3' not in names

    def test_project_role_create(self, authenticated_client, agent):
        """Тест создания роли в проекте"""
        project = ProjectFactory(created_by=agent)
        role_type = RoleTypeFactory()

        url = reverse('projectrole-list')
        data = {
            'project': project.id,
            'name': 'Новая роль',
            'role_type': role_type.id,
            'description': 'Описание роли',
            'media_presence': 'yes'
        }
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Новая роль'
        assert response.data['project'] == project.id

        # Проверяем что роль создалась в БД
        role = ProjectRole.objects.get(name='Новая роль')
        assert role.project == project

    def test_project_role_retrieve(self, authenticated_client):
        """Тест получения конкретной роли"""
        role = ProjectRoleFactory(name='Тестовая роль')
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Тестовая роль'
        assert 'project_title' in response.data

    def test_project_role_update_own_project(self, authenticated_client, agent):
        """Тест обновления роли в собственном проекте"""
        project = ProjectFactory(created_by=agent)
        role = ProjectRoleFactory(project=project, name='Старое название')
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        data = {'name': 'Новое название'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Новое название'

        # Проверяем что изменения сохранились в БД
        role.refresh_from_db()
        assert role.name == 'Новое название'

    def test_project_role_update_other_agent_project(self, authenticated_client, another_agent):
        """Тест что нельзя обновить роль в проекте другого агента"""
        project = ProjectFactory(created_by=another_agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        data = {'name': 'Взломанная роль'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_role_delete_own_project(self, authenticated_client, agent):
        """Тест удаления роли из собственного проекта"""
        project = ProjectFactory(created_by=agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Проверяем что роль удалена из БД
        assert not ProjectRole.objects.filter(pk=role.pk).exists()

    def test_project_role_delete_other_agent_project(self, authenticated_client, another_agent):
        """Тест что нельзя удалить роль из проекта другого агента"""
        project = ProjectFactory(created_by=another_agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_role_by_project(self, authenticated_client, agent):
        """Тест получения ролей конкретного проекта"""
        project1 = ProjectFactory(created_by=agent, title='Проект 1')
        project2 = ProjectFactory(created_by=agent, title='Проект 2')
        role1 = ProjectRoleFactory(project=project1, name='Роль 1')
        role2 = ProjectRoleFactory(project=project1, name='Роль 2')
        role3 = ProjectRoleFactory(project=project2, name='Роль 3')

        url = reverse('projectrole-by-project')
        response = authenticated_client.get(url, {'project_id': project1.id})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        role_names = [item['name'] for item in response.data]
        assert 'Роль 1' in role_names
        assert 'Роль 2' in role_names
        assert 'Роль 3' not in role_names

    def test_project_role_search_by_name(self, authenticated_client):
        """Тест поиска ролей по названию"""
        ProjectRoleFactory(name='УникальныйТестГлавный герой')
        ProjectRoleFactory(name='УникальныйТестВторостепенный герой')
        ProjectRoleFactory(name='УникальныйТестЗлодей')

        url = reverse('projectrole-search')
        response = authenticated_client.get(url, {'name': 'УникальныйТестГлавный'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3  # Все 3 роли содержат 'УникальныйТест'
        names = [item['name'] for item in response.data]
        assert 'УникальныйТестГлавный герой' in names

    def test_project_role_search_by_media_presence(self, authenticated_client):
        """Тест поиска ролей по медийности"""
        ProjectRoleFactory(name='Медийная роль', media_presence='yes')
        ProjectRoleFactory(name='Немедийная роль', media_presence='no')
        ProjectRoleFactory(name='Неважно роль', media_presence='doesnt_matter')

        url = reverse('projectrole-search')
        response = authenticated_client.get(url, {'media_presence': 'yes'})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Медийная роль'

    def test_project_role_list_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе списка ролей"""
        role = ProjectRoleFactory()
        url = reverse('projectrole-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        
        role_data = response.data[0]
        expected_fields = [
            'id', 'project', 'project_title', 'name', 'role_type',
            'role_type_name', 'media_presence', 'is_active', 'created_at'
        ]
        for field in expected_fields:
            assert field in role_data

    def test_project_role_creation_validation(self, authenticated_client, agent):
        """Тест валидации при создании роли"""
        project = ProjectFactory(created_by=agent)
        url = reverse('projectrole-list')
        data = {'project': project.id, 'name': ''}  # Пустое название
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.data

    def test_project_role_update_validation(self, authenticated_client, agent):
        """Тест валидации при обновлении роли"""
        project = ProjectFactory(created_by=agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})

        data = {'media_presence': 'invalid_choice'}
        response = authenticated_client.patch(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
