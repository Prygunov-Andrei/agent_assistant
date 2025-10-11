"""
Тесты для API персон (День 13.2)
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from people.models import Person
from projects.models import Project, ProjectType, Genre

User = get_user_model()


@pytest.fixture
def api_client():
    """API клиент для тестов"""
    return APIClient()


@pytest.fixture
def user(db):
    """Тестовый пользователь"""
    return User.objects.create_user(
        username='testuser',
        email='test@test.com',
        password='testpass123'
    )


@pytest.fixture
def another_user(db):
    """Другой тестовый пользователь"""
    return User.objects.create_user(
        username='anotheruser',
        email='another@test.com',
        password='testpass123'
    )


@pytest.fixture
def project_type(db):
    """Тип проекта для тестов"""
    return ProjectType.objects.create(name='Фильм', is_active=True)


@pytest.fixture
def genre(db):
    """Жанр для тестов"""
    return Genre.objects.create(name='Драма', is_active=True)


@pytest.fixture
def casting_director(db, user):
    """Тестовый кастинг-директор"""
    return Person.objects.create(
        person_type='casting_director',
        first_name='Иван',
        last_name='Иванов',
        middle_name='Иванович',
        phone='+7 (999) 123-45-67',
        email='ivan@test.com',
        telegram_username='@ivan',
        created_by=user
    )


@pytest.fixture
def director(db, user):
    """Тестовый режиссер"""
    return Person.objects.create(
        person_type='director',
        first_name='Петр',
        last_name='Петров',
        phone='+7 (999) 111-11-11',
        email='petr@test.com',
        created_by=user
    )


@pytest.fixture
def producer(db, user):
    """Тестовый продюсер"""
    return Person.objects.create(
        person_type='producer',
        first_name='Сидор',
        last_name='Сидоров',
        phone='+7 (999) 222-22-22',
        email='sidor@test.com',
        created_by=user
    )


@pytest.mark.django_db
class TestPersonCRUD:
    """Тесты CRUD операций для персон"""
    
    def test_create_person(self, api_client, user):
        """Тест создания персоны"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-list')
        data = {
            'person_type': 'director',
            'first_name': 'Тест',
            'last_name': 'Тестов',
            'phone': '+7 (999) 999-99-99',
            'email': 'test@example.com'
        }
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['first_name'] == 'Тест'
        assert response.data['last_name'] == 'Тестов'
        assert response.data['person_type'] == 'director'
    
    def test_get_person(self, api_client, user, casting_director):
        """Тест получения персоны"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-detail', kwargs={'pk': casting_director.pk})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['full_name'] == 'Иванов Иван Иванович'
        assert response.data['person_type'] == 'casting_director'
    
    def test_update_person(self, api_client, user, casting_director):
        """Тест обновления персоны"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-detail', kwargs={'pk': casting_director.pk})
        data = {
            'person_type': 'casting_director',
            'first_name': 'Иван',
            'last_name': 'Иванов',
            'phone': '+7 (999) 000-00-00'
        }
        
        response = api_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['phone'] == '+7 (999) 000-00-00'
    
    def test_delete_person_by_owner(self, api_client, user, casting_director):
        """Тест удаления персоны её создателем"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-detail', kwargs={'pk': casting_director.pk})
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Person.objects.filter(pk=casting_director.pk).exists()
    
    def test_cannot_delete_person_by_non_owner(self, api_client, another_user, casting_director):
        """Тест: нельзя удалить персону не её создателем"""
        api_client.force_authenticate(user=another_user)
        
        url = reverse('person-detail', kwargs={'pk': casting_director.pk})
        response = api_client.delete(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Person.objects.filter(pk=casting_director.pk).exists()


@pytest.mark.django_db
class TestPersonProjects:
    """Тесты получения проектов персоны"""
    
    def test_get_person_projects(self, api_client, user, casting_director, project_type, genre):
        """Тест получения проектов персоны"""
        # Создаем проекты с кастинг-директором
        project1 = Project.objects.create(
            title='Проект 1',
            project_type=project_type,
            genre=genre,
            casting_director=casting_director,
            created_by=user
        )
        project2 = Project.objects.create(
            title='Проект 2',
            project_type=project_type,
            genre=genre,
            casting_director=casting_director,
            created_by=user
        )
        
        api_client.force_authenticate(user=user)
        
        url = reverse('person-projects', kwargs={'pk': casting_director.pk})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]['title'] in ['Проект 1', 'Проект 2']


@pytest.mark.django_db
class TestPersonSearch:
    """Тесты расширенного поиска персон"""
    
    def test_search_by_name(self, api_client, user, casting_director, director, producer):
        """Тест поиска по имени"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-search')
        response = api_client.get(url, {'name': 'Иванов'})
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['last_name'] == 'Иванов'
    
    def test_search_by_phone(self, api_client, user, casting_director):
        """Тест поиска по телефону"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-search')
        response = api_client.get(url, {'phone': '123-45-67'})
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['phone'] == '+7 (999) 123-45-67'
    
    def test_search_by_person_type(self, api_client, user, casting_director, director):
        """Тест поиска по типу персоны"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-search')
        response = api_client.get(url, {'person_type': 'director'})
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert len(results) == 1
        assert results[0]['person_type'] == 'director'
    
    def test_search_with_sorting(self, api_client, user, casting_director, director):
        """Тест поиска с сортировкой"""
        api_client.force_authenticate(user=user)
        
        url = reverse('person-search')
        response = api_client.get(url, {'sort': 'full_name'})
        
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert len(results) >= 2
        # Проверяем сортировку по ФИО
        assert results[0]['last_name'] <= results[1]['last_name']


@pytest.mark.django_db
class TestPersonPagination:
    """Тесты пагинации"""
    
    def test_pagination(self, api_client, user):
        """Тест пагинации списка персон"""
        api_client.force_authenticate(user=user)
        
        # Создаем 25 персон
        for i in range(25):
            Person.objects.create(
                person_type='director',
                first_name=f'Тест{i}',
                last_name=f'Тестов{i}',
                created_by=user
            )
        
        url = reverse('person-search')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'results' in response.data
        assert response.data['count'] == 25
        assert len(response.data['results']) == 20  # page_size = 20
        
        # Проверяем вторую страницу
        response2 = api_client.get(url, {'page': 2})
        assert len(response2.data['results']) == 5

