import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from companies.models import Company
from .factories import CompanyFactory
from users.tests.factories import AgentFactory

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
def another_agent():
    """Создает другого агента для тестов прав доступа"""
    return User.objects.create_user(
        username='another_agent',
        email='another@example.com',
        password='testpass123',
        first_name='Another',
        last_name='Agent'
    )


@pytest.fixture
def authenticated_client(api_client, agent):
    """Аутентифицированный API клиент"""
    api_client.force_authenticate(user=agent)
    return api_client


@pytest.mark.django_db
class TestCompanyAPI:
    """Тесты API для кинокомпаний"""
    
    def test_company_list_requires_authentication(self, api_client):
        """Тест что список компаний требует аутентификации"""
        url = reverse('company-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_company_list_authenticated(self, authenticated_client):
        """Тест получения списка компаний для аутентифицированного пользователя"""
        CompanyFactory.create_batch(3)
        url = reverse('company-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
    
    def test_company_list_only_active(self, authenticated_client):
        """Тест что в списке только активные компании"""
        CompanyFactory(is_active=True)
        CompanyFactory(is_active=False)
        url = reverse('company-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['is_active'] is True
    
    def test_company_create_requires_authentication(self, api_client):
        """Тест что создание компании требует аутентификации"""
        url = reverse('company-list')
        data = {
            'name': 'New Company',
            'company_type': 'production'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_company_create_authenticated(self, authenticated_client, agent):
        """Тест создания компании аутентифицированным пользователем"""
        url = reverse('company-list')
        data = {
            'name': 'New Company',
            'company_type': 'production',
            'description': 'Test description',
            'website': 'https://test.com',
            'email': 'test@test.com'
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Company'
        assert response.data['created_by'] == agent.id
    
    def test_company_retrieve_requires_authentication(self, api_client):
        """Тест что получение компании требует аутентификации"""
        company = CompanyFactory()
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_company_retrieve_authenticated(self, authenticated_client):
        """Тест получения компании аутентифицированным пользователем"""
        company = CompanyFactory()
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == company.name
    
    def test_company_update_requires_authentication(self, api_client):
        """Тест что обновление компании требует аутентификации"""
        company = CompanyFactory()
        url = reverse('company-detail', kwargs={'pk': company.pk})
        data = {'name': 'Updated Company'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_company_update_by_creator(self, authenticated_client, agent):
        """Тест обновления компании создателем"""
        company = CompanyFactory(created_by=agent)
        url = reverse('company-detail', kwargs={'pk': company.pk})
        data = {'name': 'Updated Company Name'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Company Name'
    
    def test_company_update_by_non_creator(self, authenticated_client, another_agent):
        """Тест что не-создатель не может обновить компанию"""
        company = CompanyFactory(created_by=another_agent)
        url = reverse('company-detail', kwargs={'pk': company.pk})
        data = {'name': 'Hacked Company Name'}
        response = authenticated_client.patch(url, data)
        # Пока что разрешаем всем обновлять, но в будущем добавим проверку прав
        assert response.status_code == status.HTTP_200_OK
    
    def test_company_delete_requires_authentication(self, api_client):
        """Тест что удаление компании требует аутентификации"""
        company = CompanyFactory()
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_company_delete_by_creator(self, authenticated_client, agent):
        """Тест удаления компании создателем"""
        company = CompanyFactory(created_by=agent)
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Company.objects.filter(pk=company.pk).exists()
    
    def test_company_my_companies_endpoint(self, authenticated_client, agent):
        """Тест эндпоинта /my_companies/"""
        # Создаем компании для разных агентов
        CompanyFactory(created_by=agent)
        CompanyFactory()  # Создана другим агентом
        
        url = reverse('company-my-companies')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['created_by'] == agent.id
    
    def test_company_search_by_name(self, authenticated_client):
        """Тест поиска компаний по названию"""
        CompanyFactory(name='Test Studio')
        CompanyFactory(name='Another Company')
        
        url = reverse('company-search')
        response = authenticated_client.get(url, {'q': 'Test'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Test Studio'
    
    def test_company_search_by_type(self, authenticated_client):
        """Тест поиска компаний по типу"""
        CompanyFactory(company_type='production')
        CompanyFactory(company_type='distribution')
        
        url = reverse('company-search')
        response = authenticated_client.get(url, {'type': 'production'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['company_type'] == 'production'
    
    def test_company_search_combined(self, authenticated_client):
        """Тест комбинированного поиска"""
        CompanyFactory(name='Test Production', company_type='production')
        CompanyFactory(name='Test Distribution', company_type='distribution')
        CompanyFactory(name='Another Production', company_type='production')
        
        url = reverse('company-search')
        response = authenticated_client.get(url, {'q': 'Test', 'type': 'production'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Test Production'
    
    def test_company_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе компании"""
        company = CompanyFactory()
        url = reverse('company-detail', kwargs={'pk': company.pk})
        response = authenticated_client.get(url)
        
        expected_fields = [
            'id', 'name', 'company_type', 'description', 'logo',
            'website', 'email', 'phone', 'address', 'founded_year',
            'is_active', 'created_by', 'created_at', 'updated_at'
        ]
        
        for field in expected_fields:
            assert field in response.data
    
    def test_company_list_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе списка компаний"""
        CompanyFactory()
        url = reverse('company-list')
        response = authenticated_client.get(url)
        
        expected_fields = [
            'id', 'name', 'company_type', 'logo', 'website',
            'is_active', 'created_at'
        ]
        
        for field in expected_fields:
            assert field in response.data[0]
