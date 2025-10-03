"""
Общая конфигурация для всех тестов
"""

import os
import sys
import django
from django.conf import settings

# Добавляем путь к проекту
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent_assistant.settings')
django.setup()

# Импорты для общих фикстур
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Фикстура для API клиента"""
    return APIClient()


@pytest.fixture
def authenticated_api_client(user):
    """Фикстура для аутентифицированного API клиента"""
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def user():
    """Фикстура для создания пользователя"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )


@pytest.fixture
def admin_user():
    """Фикстура для создания администратора"""
    return User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def agent():
    """Фикстура для создания агента"""
    from users.models import Agent
    return Agent.objects.create(
        username='testagent',
        email='agent@example.com',
        first_name='Test',
        last_name='Agent',
        phone='+1234567890'
    )


@pytest.fixture
def another_agent():
    """Фикстура для создания другого агента"""
    from users.models import Agent
    return Agent.objects.create(
        username='another_agent',
        email='another@example.com',
        first_name='Another',
        last_name='Agent',
        phone='+0987654321'
    )


@pytest.fixture
def authenticated_agent_client(agent):
    """Фикстура для аутентифицированного API клиента с агентом"""
    client = APIClient()
    client.force_authenticate(user=agent)
    return client


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    Автоматически включает доступ к базе данных для всех тестов
    """
    pass
