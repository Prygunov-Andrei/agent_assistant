import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from .factories import AgentFactory

User = get_user_model()


@pytest.fixture
def api_client():
    """API клиент для тестирования"""
    return APIClient()


@pytest.fixture
def agent():
    """Создает тестового агента"""
    return User.objects.create_user(
        username='test_agent',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='Agent'
    )


@pytest.fixture
def authenticated_client(api_client, agent):
    """Аутентифицированный API клиент"""
    api_client.force_authenticate(user=agent)
    return api_client


@pytest.mark.django_db
class TestAgentAPI:
    """Тесты API для агентов"""
    
    def test_agent_list_requires_authentication(self, api_client):
        """Тест что список агентов требует аутентификации"""
        url = reverse('agent-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_agent_list_authenticated(self, authenticated_client):
        """Тест получения списка агентов для аутентифицированного пользователя"""
        # Создаем 3 новых агента (плюс уже есть 1 в фикстуре)
        AgentFactory.create_batch(3)
        url = reverse('agent-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 4  # 3 новых + 1 из фикстуры
    
    def test_agent_list_only_active(self, authenticated_client):
        """Тест что в списке только активные агенты"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Создаем активного агента
        User.objects.create_user(
            username='active_agent',
            email='active@example.com',
            password='testpass123',
            is_active=True
        )
        # Создаем неактивного агента
        User.objects.create_user(
            username='inactive_agent',
            email='inactive@example.com',
            password='testpass123',
            is_active=False
        )
        url = reverse('agent-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Должен быть только 1 активный агент (плюс тот что в фикстуре)
        active_agents = [agent for agent in response.data if agent['is_active']]
        assert len(active_agents) == 2  # 1 новый + 1 из фикстуры
    
    def test_agent_create_requires_authentication(self, api_client):
        """Тест что создание агента требует аутентификации"""
        url = reverse('agent-list')
        data = {
            'username': 'new_agent',
            'email': 'new@example.com',
            'password': 'testpass123'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_agent_create_authenticated(self, authenticated_client):
        """Тест создания агента аутентифицированным пользователем"""
        url = reverse('agent-list')
        data = {
            'username': 'new_agent',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'Agent',
            'phone': '+1234567890'
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['username'] == 'new_agent'
        assert response.data['email'] == 'new@example.com'
    
    def test_agent_retrieve_requires_authentication(self, api_client):
        """Тест что получение агента требует аутентификации"""
        agent = AgentFactory()
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_agent_retrieve_authenticated(self, authenticated_client):
        """Тест получения агента аутентифицированным пользователем"""
        agent = AgentFactory()
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == agent.username
    
    def test_agent_update_requires_authentication(self, api_client):
        """Тест что обновление агента требует аутентификации"""
        agent = AgentFactory()
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        data = {'first_name': 'Updated'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_agent_update_authenticated(self, authenticated_client):
        """Тест обновления агента аутентифицированным пользователем"""
        agent = AgentFactory()
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        data = {'first_name': 'Updated Name'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated Name'
    
    def test_agent_delete_requires_authentication(self, api_client):
        """Тест что удаление агента требует аутентификации"""
        agent = AgentFactory()
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_agent_delete_authenticated(self, authenticated_client):
        """Тест удаления агента аутентифицированным пользователем"""
        agent = AgentFactory()
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=agent.pk).exists()
    
    def test_agent_me_endpoint(self, authenticated_client, agent):
        """Тест эндпоинта /me/"""
        url = reverse('agent-me')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == agent.username
    
    def test_agent_update_profile_endpoint(self, authenticated_client, agent):
        """Тест эндпоинта обновления профиля"""
        url = reverse('agent-update-profile')
        data = {'first_name': 'Updated Profile'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == 'Updated Profile'
        
        # Проверяем что данные сохранились в БД
        agent.refresh_from_db()
        assert agent.first_name == 'Updated Profile'
    
    def test_agent_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе агента"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = User.objects.create_user(
            username='test_agent_serializer',
            email='test_serializer@example.com',
            password='testpass123'
        )
        url = reverse('agent-detail', kwargs={'pk': agent.pk})
        response = authenticated_client.get(url)
        
        expected_fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'photo', 'phone', 'bio', 'birth_date',
            'telegram_username', 'is_active', 'date_joined',
            'last_login', 'created_at', 'updated_at'
        ]
        
        for field in expected_fields:
            assert field in response.data
    
    def test_agent_list_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе списка агентов"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(
            username='test_agent_list',
            email='test_list@example.com',
            password='testpass123'
        )
        url = reverse('agent-list')
        response = authenticated_client.get(url)
        
        expected_fields = [
            'id', 'username', 'first_name', 'last_name',
            'full_name', 'photo', 'is_active', 'created_at'
        ]
        
        for field in expected_fields:
            assert field in response.data[0]
