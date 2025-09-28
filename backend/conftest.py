import os
import django
from django.conf import settings
import pytest

# Настройка Django для pytest
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent_assistant.settings')
django.setup()


@pytest.fixture
def api_client():
    """API клиент для тестирования"""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def django_client():
    """Django тестовый клиент"""
    from django.test import Client
    return Client()


@pytest.fixture
def agent():
    """Создает тестового агента"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_user(
        username='test_agent',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='Agent'
    )


@pytest.fixture
def admin_agent():
    """Создает тестового админа"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )


@pytest.fixture
def authenticated_client(api_client, agent):
    """Аутентифицированный API клиент"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    # Создаем JWT токен для агента
    refresh = RefreshToken.for_user(agent)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    return api_client


@pytest.fixture
def admin_client(api_client, admin_agent):
    """API клиент с правами админа"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    # Создаем JWT токен для админа
    refresh = RefreshToken.for_user(admin_agent)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    return api_client


@pytest.fixture
def company(agent):
    """Создает тестовую кинокомпанию"""
    from companies.models import Company
    return Company.objects.create(
        name='Test Company',
        company_type='production',
        description='Test description',
        created_by=agent
    )


@pytest.fixture
def another_agent():
    """Создает другого агента для тестов прав доступа"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_user(
        username='another_agent',
        email='another@example.com',
        password='testpass123',
        first_name='Another',
        last_name='Agent'
    )


@pytest.fixture
def person(agent):
    """Создает тестовую персону"""
    from people.models import Person
    return Person.objects.create(
        first_name='Иван',
        last_name='Петров',
        person_type='director',
        created_by=agent
    )

@pytest.fixture
def project_type():
    """Создает тестовый тип проекта"""
    from projects.models import ProjectType
    return ProjectType.objects.create(
        name='Фильм',
        description='Полнометражный фильм'
    )

@pytest.fixture
def genre():
    """Создает тестовый жанр"""
    from projects.models import Genre
    return Genre.objects.create(
        name='Драма',
        description='Драматический жанр'
    )

@pytest.fixture
def role_type():
    """Создает тестовый тип роли"""
    from projects.models import RoleType
    return RoleType.objects.create(
        name='Актер',
        description='Актерская роль'
    )

@pytest.fixture
def project(agent, project_type, genre):
    """Создает тестовый проект"""
    from projects.models import Project
    return Project.objects.create(
        title='Тестовый проект',
        project_type=project_type,
        genre=genre,
        created_by=agent
    )

@pytest.fixture
def project_role(project, role_type):
    """Создает тестовую роль в проекте"""
    from projects.models import ProjectRole
    return ProjectRole.objects.create(
        project=project,
        name='Тестовая роль',
        role_type=role_type
    )
