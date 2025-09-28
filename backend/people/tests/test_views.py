import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from people.models import Person
from .factories import PersonFactory, DirectorFactory, ProducerFactory, CastingDirectorFactory
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
class TestPersonAPI:
    """Тесты API для персон"""

    def test_person_list_requires_authentication(self, api_client):
        """Тест что список персон требует аутентификации"""
        url = reverse('person-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_person_list_authenticated(self, authenticated_client):
        """Тест получения списка персон для аутентифицированного пользователя"""
        PersonFactory.create_batch(3)
        url = reverse('person-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_person_list_only_active(self, authenticated_client):
        """Тест что в списке только активные персоны"""
        PersonFactory(is_active=True)
        PersonFactory(is_active=False)
        url = reverse('person-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['is_active'] is True

    def test_person_create_requires_authentication(self, api_client):
        """Тест что создание персоны требует аутентификации"""
        url = reverse('person-list')
        data = {
            'first_name': 'Иван',
            'last_name': 'Петров',
            'person_type': 'director'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_person_create_authenticated(self, authenticated_client, agent):
        """Тест создания персоны аутентифицированным пользователем"""
        url = reverse('person-list')
        data = {
            'first_name': 'Иван',
            'last_name': 'Петров',
            'person_type': 'director',
            'middle_name': 'Сергеевич',
            'bio': 'Известный режиссер'
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'Иван'
        assert response.data['last_name'] == 'Петров'
        assert response.data['created_by'] == agent.username

    def test_person_retrieve_requires_authentication(self, api_client):
        """Тест что получение персоны требует аутентификации"""
        person = PersonFactory()
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_person_retrieve_authenticated(self, authenticated_client):
        """Тест получения персоны аутентифицированным пользователем"""
        person = PersonFactory()
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == person.first_name

    def test_person_update_requires_authentication(self, api_client):
        """Тест что обновление персоны требует аутентификации"""
        person = PersonFactory()
        url = reverse('person-detail', kwargs={'pk': person.pk})
        data = {'first_name': 'Обновленное имя'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_person_update_by_creator(self, authenticated_client, agent):
        """Тест обновления персоны создателем"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        data = {'first_name': 'Обновленное имя'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        person.refresh_from_db()
        assert person.first_name == 'Обновленное имя'

    def test_person_update_by_non_creator(self, authenticated_client, another_agent):
        """Тест обновления персоны не-создателем"""
        person = PersonFactory(created_by=another_agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        data = {'first_name': 'Взломанное имя'}
        response = authenticated_client.patch(url, data)
        # Должен быть запрещен из-за PersonPermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_person_delete_requires_authentication(self, api_client):
        """Тест что удаление персоны требует аутентификации"""
        person = PersonFactory()
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_person_delete_by_creator(self, authenticated_client, agent):
        """Тест удаления персоны создателем"""
        person = PersonFactory(created_by=agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Person.objects.filter(pk=person.pk).exists()

    def test_person_delete_by_non_creator(self, authenticated_client, another_agent):
        """Тест удаления персоны не-создателем"""
        person = PersonFactory(created_by=another_agent)
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.delete(url)
        # Должен быть запрещен из-за PersonPermission
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_person_my_people_endpoint(self, authenticated_client, agent):
        """Тест эндпоинта 'my_people'"""
        PersonFactory(created_by=agent)
        PersonFactory(created_by=agent)
        PersonFactory()  # Person by another agent
        url = reverse('person-my-people')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert all(person['created_by'] == agent.username for person in response.data)

    def test_person_search_by_name(self, authenticated_client):
        """Тест поиска персон по имени"""
        PersonFactory(first_name='Иван', last_name='Петров', person_type='director')
        PersonFactory(first_name='Петр', last_name='Иванов', person_type='producer')
        PersonFactory(first_name='Анна', last_name='Сидорова', person_type='director')

        url = reverse('person-search')
        response = authenticated_client.get(url, {'name': 'Иван'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Иван Петров и Петр Иванов

    def test_person_search_by_type(self, authenticated_client):
        """Тест поиска персон по типу"""
        PersonFactory(first_name='Test', last_name='Director', person_type='director')
        PersonFactory(first_name='Test', last_name='Producer', person_type='producer')

        url = reverse('person-search')
        response = authenticated_client.get(url, {'person_type': 'director'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['person_type'] == 'director'

    def test_person_search_by_nationality(self, authenticated_client):
        """Тест поиска персон по национальности"""
        PersonFactory(nationality='Россия', person_type='director')
        PersonFactory(nationality='США', person_type='producer')

        url = reverse('person-search')
        response = authenticated_client.get(url, {'nationality': 'Россия'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['nationality'] == 'Россия'

    def test_person_directors_endpoint(self, authenticated_client):
        """Тест эндпоинта 'directors'"""
        DirectorFactory()
        ProducerFactory()
        DirectorFactory()

        url = reverse('person-directors')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert all(person['person_type'] == 'director' for person in response.data)

    def test_person_producers_endpoint(self, authenticated_client):
        """Тест эндпоинта 'producers'"""
        DirectorFactory()
        ProducerFactory()
        ProducerFactory()

        url = reverse('person-producers')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert all(person['person_type'] == 'producer' for person in response.data)

    def test_person_casting_directors_endpoint(self, authenticated_client):
        """Тест эндпоинта 'casting_directors'"""
        DirectorFactory()
        CastingDirectorFactory()
        CastingDirectorFactory()

        url = reverse('person-casting-directors')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert all(person['person_type'] == 'casting_director' for person in response.data)

    def test_person_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе персоны"""
        person = PersonFactory()
        url = reverse('person-detail', kwargs={'pk': person.pk})
        response = authenticated_client.get(url)

        expected_fields = [
            'id', 'person_type', 'first_name', 'last_name', 'middle_name',
            'full_name', 'short_name', 'photo', 'bio', 'birth_date',
            'nationality', 'phone', 'email', 'website', 'telegram_username',
            'kinopoisk_url', 'social_media', 'awards', 'is_active',
            'created_by', 'created_at', 'updated_at'
        ]

        for field in expected_fields:
            assert field in response.data

    def test_person_list_serializer_fields(self, authenticated_client):
        """Тест полей в сериализаторе списка персон"""
        PersonFactory()
        url = reverse('person-list')
        response = authenticated_client.get(url)

        expected_fields = [
            'id', 'person_type', 'first_name', 'last_name',
            'full_name', 'short_name', 'photo', 'nationality',
            'is_active', 'created_by', 'created_at'
        ]

        # Проверяем что есть данные
        assert len(response.data) > 0
        
        # Проверяем поля в первом элементе
        for field in expected_fields:
            assert field in response.data[0]
