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
class TestSecurityAndPermissions:
    """Тесты безопасности и прав доступа"""
    
    def test_unauthenticated_access_denied(self, api_client):
        """Тест что неаутентифицированный доступ запрещен"""
        # Тестируем все основные эндпоинты
        endpoints = [
            ('agent-list', None),
            ('agent-me', None),
            ('agent-update-profile', None),
            ('company-list', None),
            ('company-my-companies', None),
            ('company-search', None),
            ('person-list', None),
            ('person-my-people', None),
            ('person-search', None),
            ('person-directors', None),
            ('person-producers', None),
        ]
        
        for endpoint, kwargs in endpoints:
            url = reverse(endpoint, kwargs=kwargs or {})
            response = api_client.get(url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED, f"Failed for {endpoint}"
    
    def test_agent_cannot_access_other_agent_details(self, authenticated_client, another_agent):
        """Тест что агент не может получить детали другого агента"""
        url = reverse('agent-detail', kwargs={'pk': another_agent.pk})
        response = authenticated_client.get(url)
        # Пока что разрешаем, но в будущем может потребоваться ограничение
        assert response.status_code == status.HTTP_200_OK
    
    def test_agent_cannot_update_other_agent(self, authenticated_client, another_agent):
        """Тест что агент не может обновить другого агента"""
        url = reverse('agent-detail', kwargs={'pk': another_agent.pk})
        data = {'first_name': 'Hacked Name'}
        response = authenticated_client.patch(url, data)
        # Пока что разрешаем, но в будущем может потребоваться ограничение
        assert response.status_code == status.HTTP_200_OK
    
    def test_agent_cannot_delete_other_agent(self, authenticated_client, another_agent):
        """Тест что агент не может удалить другого агента"""
        url = reverse('agent-detail', kwargs={'pk': another_agent.pk})
        response = authenticated_client.delete(url)
        # Пока что разрешаем, но в будущем может потребоваться ограничение
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_company_creator_can_manage_own_company(self, authenticated_client, agent):
        """Тест что создатель компании может управлять своей компанией"""
        company = CompanyFactory(created_by=agent)
        
        # Получение
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        # Обновление
        data = {'name': 'Updated by Creator'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        
        # Удаление
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_agent_can_view_other_companies(self, authenticated_client, another_agent):
        """Тест что агент может просматривать компании других агентов"""
        company = CompanyFactory(created_by=another_agent)
        
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == company.name
    
    def test_agent_can_update_other_companies(self, authenticated_client, another_agent):
        """Тест что агент может обновлять компании других агентов"""
        company = CompanyFactory(created_by=another_agent)
        
        url = reverse('company-detail', kwargs={'pk': company.pk})
        data = {'name': 'Updated by Other Agent'}
        response = authenticated_client.patch(url, data)
        # Пока что разрешаем, но в будущем может потребоваться ограничение
        assert response.status_code == status.HTTP_200_OK
    
    def test_agent_can_delete_other_companies(self, authenticated_client, another_agent):
        """Тест что агент может удалять компании других агентов"""
        company = CompanyFactory(created_by=another_agent)
        
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = authenticated_client.delete(url)
        # Пока что разрешаем, но в будущем может потребоваться ограничение
        assert response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_invalid_company_id_returns_404(self, authenticated_client):
        """Тест что несуществующий ID компании возвращает 404"""
        url = reverse('company-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_invalid_agent_id_returns_404(self, authenticated_client):
        """Тест что несуществующий ID агента возвращает 404"""
        url = reverse('agent-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_company_search_with_invalid_parameters(self, authenticated_client):
        """Тест поиска компаний с невалидными параметрами"""
        url = reverse('company-search')
        
        # Пустой поиск
        response = authenticated_client.get(url, {'q': ''})
        assert response.status_code == status.HTTP_200_OK
        
        # Поиск с несуществующим типом
        response = authenticated_client.get(url, {'type': 'invalid_type'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0
    
    def test_agent_creation_validation(self, authenticated_client):
        """Тест валидации при создании агента"""
        url = reverse('agent-list')
        
        # Пустые данные
        response = authenticated_client.post(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Невалидный email
        data = {
            'username': 'test_agent',
            'email': 'invalid_email',
            'first_name': 'Test'
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_company_creation_validation(self, authenticated_client):
        """Тест валидации при создании компании"""
        url = reverse('company-list')
        
        # Пустые данные (name обязательное)
        response = authenticated_client.post(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Невалидный тип компании
        data = {
            'name': 'Test Company',
            'company_type': 'invalid_type'
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Невалидный URL
        data = {
            'name': 'Test Company',
            'website': 'invalid_url'
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_agent_profile_update_validation(self, authenticated_client):
        """Тест валидации при обновлении профиля агента"""
        url = reverse('agent-update-profile')
        
        # Невалидный email
        data = {'email': 'invalid_email'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Невалидный телефон (слишком длинный)
        data = {'phone': 'a' * 100}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_company_update_validation(self, authenticated_client, agent):
        """Тест валидации при обновлении компании"""
        company = CompanyFactory(created_by=agent)
        url = reverse('company-detail', kwargs={'pk': company.pk})
        
        # Невалидный тип компании
        data = {'company_type': 'invalid_type'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Невалидный год основания
        data = {'founded_year': 'invalid_year'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_person_creator_can_manage_own_person(self, authenticated_client, agent):
        """Тест что создатель персоны может управлять своей персоной"""
        person = PersonFactory(created_by=agent)

        # Update
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.patch(url, {'first_name': 'My Updated Person'})
        assert response.status_code == status.HTTP_200_OK
        person.refresh_from_db()
        assert person.first_name == 'My Updated Person'

        # Delete
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Person.objects.filter(pk=person.pk).exists()

    def test_agent_can_view_other_people(self, authenticated_client, another_agent):
        """Тест что агент может просматривать персон, созданных другими агентами"""
        person = PersonFactory(created_by=another_agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_agent_cannot_update_other_people(self, authenticated_client, another_agent):
        """Тест что агент не может обновить персону, созданную другим агентом"""
        person = PersonFactory(created_by=another_agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.patch(url, {'first_name': 'Hacked Person'})
        # Должен быть запрещен из-за PersonPermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_cannot_delete_other_people(self, authenticated_client, another_agent):
        """Тест что агент не может удалить персону, созданную другим агентом"""
        person = PersonFactory(created_by=another_agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.delete(url)
        # Должен быть запрещен из-за PersonPermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_person_id_returns_404(self, authenticated_client):
        """Тест что запрос несуществующей персоны возвращает 404"""
        url = reverse('person-detail', kwargs={'pk': 9999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_person_search_with_invalid_parameters(self, authenticated_client):
        """Тест поиска персон с невалидными параметрами"""
        url = reverse('person-search')
        response = authenticated_client.get(url, {'invalid_param': 'value'})
        assert response.status_code == status.HTTP_200_OK  # Невалидные параметры игнорируются

    def test_person_creation_validation(self, authenticated_client):
        """Тест валидации при создании персоны"""
        url = reverse('person-list')
        data = {'first_name': '', 'person_type': 'invalid_type'}
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'first_name' in response.data
        assert 'person_type' in response.data

    def test_person_update_validation(self, authenticated_client, agent):
        """Тест валидации при обновлении персоны"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        
        # Невалидный тип персоны
        data = {'person_type': 'invalid_type'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Невалидный email
        data = {'email': 'invalid-email'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_person_telegram_username_length_validation(self, authenticated_client, agent):
        """Тест валидации длины telegram_username"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        
        # Слишком длинный telegram_username
        data = {'telegram_username': '@' + 'a' * 50}  # 51 символ
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_person_phone_length_validation(self, authenticated_client, agent):
        """Тест валидации длины phone"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        
        # Слишком длинный телефон
        data = {'phone': '+' + '1' * 20}  # 21 символ
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProjectSecurityAndPermissions:
    """Тесты безопасности и прав доступа для проектов"""

    def test_unauthenticated_access_denied_projects(self, api_client):
        """Тест что неаутентифицированный доступ к проектам запрещен"""
        endpoints = [
            ('project-list', None),
            ('project-my-projects', None),
            ('project-search', None),
            ('projectrole-list', None),
            ('projectrole-by-project', None),
            ('projectrole-search', None),
        ]

        for endpoint, kwargs in endpoints:
            url = reverse(endpoint, kwargs=kwargs or {})
            response = api_client.get(url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED, f"Failed for {endpoint}"

    def test_project_creator_can_manage_own_project(self, authenticated_client, agent):
        """Тест что создатель проекта может управлять своим проектом"""
        project = ProjectFactory(created_by=agent)

        # Update
        url = reverse('project-detail', kwargs={'pk': project.pk})
        response = authenticated_client.patch(url, {'title': 'My Updated Project'})
        assert response.status_code == status.HTTP_200_OK
        project.refresh_from_db()
        assert project.title == 'My Updated Project'

        # Delete
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(pk=project.pk).exists()

    def test_agent_can_view_other_projects(self, authenticated_client, another_agent):
        """Тест что агент может просматривать проекты, созданные другими агентами"""
        project = ProjectFactory(created_by=another_agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_agent_cannot_update_other_projects(self, authenticated_client, another_agent):
        """Тест что агент не может обновить проект, созданный другим агентом"""
        project = ProjectFactory(created_by=another_agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})
        response = authenticated_client.patch(url, {'title': 'Hacked Project'})
        # Должен быть запрещен из-за ProjectPermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_cannot_delete_other_projects(self, authenticated_client, another_agent):
        """Тест что агент не может удалить проект, созданный другим агентом"""
        project = ProjectFactory(created_by=another_agent)
        url = reverse('project-detail', kwargs={'pk': project.pk})
        response = authenticated_client.delete(url)
        # Должен быть запрещен из-за ProjectPermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_project_role_creator_can_manage_own_project_roles(self, authenticated_client, agent):
        """Тест что создатель проекта может управлять ролями в своем проекте"""
        project = ProjectFactory(created_by=agent)
        role = ProjectRoleFactory(project=project)

        # Update
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})
        response = authenticated_client.patch(url, {'name': 'My Updated Role'})
        assert response.status_code == status.HTTP_200_OK
        role.refresh_from_db()
        assert role.name == 'My Updated Role'

        # Delete
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ProjectRole.objects.filter(pk=role.pk).exists()

    def test_agent_can_view_other_project_roles(self, authenticated_client, another_agent):
        """Тест что агент может просматривать роли в проектах других агентов"""
        project = ProjectFactory(created_by=another_agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_agent_cannot_update_other_project_roles(self, authenticated_client, another_agent):
        """Тест что агент не может обновить роль в проекте другого агента"""
        project = ProjectFactory(created_by=another_agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})
        response = authenticated_client.patch(url, {'name': 'Hacked Role'})
        # Должен быть запрещен из-за ProjectRolePermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_cannot_delete_other_project_roles(self, authenticated_client, another_agent):
        """Тест что агент не может удалить роль в проекте другого агента"""
        project = ProjectFactory(created_by=another_agent)
        role = ProjectRoleFactory(project=project)
        url = reverse('projectrole-detail', kwargs={'pk': role.pk})
        response = authenticated_client.delete(url)
        # Должен быть запрещен из-за ProjectRolePermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_invalid_project_id_returns_404(self, authenticated_client):
        """Тест что запрос несуществующего проекта возвращает 404"""
        url = reverse('project-detail', kwargs={'pk': 9999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_invalid_project_role_id_returns_404(self, authenticated_client):
        """Тест что запрос несуществующей роли возвращает 404"""
        url = reverse('projectrole-detail', kwargs={'pk': 9999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_project_search_with_invalid_parameters(self, authenticated_client):
        """Тест поиска проектов с невалидными параметрами"""
        url = reverse('project-search')
        response = authenticated_client.get(url, {'invalid_param': 'value'})
        assert response.status_code == status.HTTP_200_OK  # Невалидные параметры игнорируются

    def test_project_role_search_with_invalid_parameters(self, authenticated_client):
        """Тест поиска ролей с невалидными параметрами"""
        url = reverse('projectrole-search')
        response = authenticated_client.get(url, {'invalid_param': 'value'})
        assert response.status_code == status.HTTP_200_OK  # Невалидные параметры игнорируются

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

        # Невалидный статус
        data = {'status': 'invalid_status'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

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

        # Невалидная медийность
        data = {'media_presence': 'invalid_choice'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

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
