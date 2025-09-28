import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from ..models import (
    SkillGroup, Skill, Education, Artist, ArtistSkill, 
    ArtistEducation, ArtistLink, ArtistPhoto
)
from .factories import (
    SkillGroupFactory, SkillFactory, EducationFactory, ArtistFactory,
    ArtistSkillFactory, ArtistEducationFactory, ArtistLinkFactory, ArtistPhotoFactory
)


class TestSkillGroupAPI(TestCase):
    """Тесты API для SkillGroup."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by  # Используем агента из фабрики
        self.client.force_authenticate(user=self.agent)
    
    def test_skill_group_list(self):
        """Тест получения списка групп навыков."""
        SkillGroupFactory.create_batch(3)
        url = reverse('skillgroup-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_skill_group_create(self):
        """Тест создания группы навыков."""
        url = reverse('skillgroup-list')
        data = {
            'name': 'Театральные навыки',
            'description': 'Навыки для театральных постановок'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert SkillGroup.objects.filter(name='Театральные навыки').exists()
    
    def test_skill_group_detail(self):
        """Тест получения детальной информации о группе навыков."""
        skill_group = SkillGroupFactory()
        url = reverse('skillgroup-detail', kwargs={'pk': skill_group.pk})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == skill_group.name


class TestSkillAPI(TestCase):
    """Тесты API для Skill."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_skill_list(self):
        """Тест получения списка навыков."""
        SkillFactory.create_batch(3)
        url = reverse('skill-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_skill_create(self):
        """Тест создания навыка."""
        skill_group = SkillGroupFactory()
        url = reverse('skill-list')
        data = {
            'skill_group': skill_group.pk,
            'name': 'Плавание',
            'description': 'Умение плавать'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Skill.objects.filter(name='Плавание').exists()
    
    def test_skill_by_group(self):
        """Тест получения навыков по группе."""
        skill_group = SkillGroupFactory()
        SkillFactory.create_batch(2, skill_group=skill_group)
        SkillFactory()  # Навык из другой группы
        
        url = reverse('skill-by-group', kwargs={'skill_group_id': skill_group.pk})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


class TestEducationAPI(TestCase):
    """Тесты API для Education."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_education_list(self):
        """Тест получения списка учебных заведений."""
        EducationFactory.create_batch(3)
        url = reverse('education-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_education_create(self):
        """Тест создания учебного заведения."""
        url = reverse('education-list')
        data = {
            'institution_name': 'МГУ',
            'description': 'Московский государственный университет'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Education.objects.filter(institution_name='МГУ').exists()


class TestArtistAPI(TestCase):
    """Тесты API для Artist."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_artist_list(self):
        """Тест получения списка артистов."""
        ArtistFactory.create_batch(3)
        url = reverse('artist-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 3  # Может быть больше из-за данных других тестов
    
    def test_artist_create(self):
        """Тест создания артиста."""
        url = reverse('artist-list')
        data = {
            'first_name': 'Иван',
            'last_name': 'Петров',
            'gender': 'male',
            'phone': '+7 999 123 45 67',
            'city': 'Москва'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Artist.objects.filter(first_name='Иван', last_name='Петров').exists()
    
    def test_artist_detail(self):
        """Тест получения детальной информации об артисте."""
        artist = ArtistFactory()
        url = reverse('artist-detail', kwargs={'pk': artist.pk})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == artist.first_name
    
    def test_artist_update(self):
        """Тест обновления артиста."""
        artist = ArtistFactory(created_by=self.agent)  # Создаем артиста от имени текущего агента
        url = reverse('artist-detail', kwargs={'pk': artist.pk})
        data = {
            'first_name': artist.first_name,
            'last_name': artist.last_name,
            'gender': artist.gender,
            'city': 'Санкт-Петербург'
        }
        response = self.client.put(url, data)
        assert response.status_code == status.HTTP_200_OK
        artist.refresh_from_db()
        assert artist.city == 'Санкт-Петербург'
    
    def test_artist_my_items(self):
        """Тест получения артистов текущего агента."""
        # Создаем артистов для разных агентов
        artist1 = ArtistFactory(created_by=self.agent)
        artist2 = ArtistFactory()  # Другой агент
        
        url = reverse('artist-my-items')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1  # Может быть больше из-за данных других тестов
        # Проверяем, что наш артист есть в списке
        artist_ids = [item['id'] for item in response.data]
        assert artist1.pk in artist_ids
    
    def test_artist_search_by_name(self):
        """Тест поиска артистов по имени."""
        ArtistFactory(first_name='Иван', last_name='Петров')
        ArtistFactory(first_name='Петр', last_name='Иванов')
        
        url = reverse('artist-search')
        response = self.client.get(url, {'name': 'Иван'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Иван Петров и Петр Иванов
    
    def test_artist_search_by_gender(self):
        """Тест поиска артистов по полу."""
        ArtistFactory.create_batch(2, gender='male')
        ArtistFactory(gender='female')
        
        url = reverse('artist-search')
        response = self.client.get(url, {'gender': 'male'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # Может быть больше из-за данных других тестов
        # Проверяем, что все найденные артисты мужского пола
        for artist_data in response.data:
            assert artist_data['gender'] == 'male'
    
    def test_artist_search_by_city(self):
        """Тест поиска артистов по городу."""
        ArtistFactory.create_batch(2, city='Москва')
        ArtistFactory(city='Санкт-Петербург')
        
        url = reverse('artist-search')
        response = self.client.get(url, {'city': 'Москва'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
    
    def test_artist_search_by_availability(self):
        """Тест поиска артистов по статусу доступности."""
        ArtistFactory.create_batch(2, availability_status=True)
        ArtistFactory(availability_status=False)
        
        url = reverse('artist-search')
        response = self.client.get(url, {'availability_status': 'true'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2  # Может быть больше из-за данных других тестов
        # Проверяем, что все найденные артисты доступны
        for artist_data in response.data:
            assert artist_data['availability_status'] is True
    
    def test_artist_search_by_age_range(self):
        """Тест поиска артистов по возрастному диапазону."""
        from datetime import date, timedelta
        # Создаем артистов с конкретными возрастами
        ArtistFactory(birth_date=date.today() - timedelta(days=365*25))  # 25 лет
        ArtistFactory(birth_date=date.today() - timedelta(days=365*30))  # 30 лет
        ArtistFactory(birth_date=date.today() - timedelta(days=365*35))  # 35 лет
        
        url = reverse('artist-search')
        response = self.client.get(url, {'age_min': 26, 'age_max': 34})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1  # Должен найти хотя бы одного 30-летнего
    
    def test_artist_by_skills(self):
        """Тест поиска артистов по навыкам."""
        skill1 = SkillFactory()
        skill2 = SkillFactory()
        
        artist1 = ArtistFactory()
        ArtistSkillFactory(artist=artist1, skill=skill1)
        ArtistSkillFactory(artist=artist1, skill=skill2)
        
        artist2 = ArtistFactory()
        ArtistSkillFactory(artist=artist2, skill=skill1)
        
        url = reverse('artist-by-skills')
        response = self.client.get(url, {'skill_ids': f'{skill1.pk},{skill2.pk}'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Только artist1 имеет оба навыка


class TestArtistSkillAPI(TestCase):
    """Тесты API для ArtistSkill."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_artist_skill_create(self):
        """Тест создания навыка артиста."""
        artist = ArtistFactory()
        skill = SkillFactory()
        url = reverse('artistskill-list')
        data = {
            'artist': artist.pk,
            'skill': skill.pk,
            'proficiency_level': 'intermediate'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert ArtistSkill.objects.filter(artist=artist, skill=skill).exists()
    
    def test_artist_skill_by_artist(self):
        """Тест получения навыков артиста."""
        artist = ArtistFactory()
        ArtistSkillFactory.create_batch(2, artist=artist)
        ArtistSkillFactory()  # Навык другого артиста
        
        url = reverse('artistskill-by-artist')
        response = self.client.get(url, {'artist_id': artist.pk})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2


class TestArtistEducationAPI(TestCase):
    """Тесты API для ArtistEducation."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_artist_education_create(self):
        """Тест создания образования артиста."""
        artist = ArtistFactory()
        education = EducationFactory()
        url = reverse('artisteducation-list')
        data = {
            'artist': artist.pk,
            'education': education.pk,
            'graduation_year': 2020
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert ArtistEducation.objects.filter(artist=artist, education=education).exists()


class TestArtistLinkAPI(TestCase):
    """Тесты API для ArtistLink."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_artist_link_create(self):
        """Тест создания ссылки артиста."""
        artist = ArtistFactory()
        url = reverse('artistlink-list')
        data = {
            'artist': artist.pk,
            'title': 'Визитка',
            'url': 'https://example.com',
            'description': 'Ссылка на визитку'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert ArtistLink.objects.filter(artist=artist, title='Визитка').exists()


class TestArtistPhotoAPI(TestCase):
    """Тесты API для ArtistPhoto."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent = ArtistFactory().created_by
        self.client.force_authenticate(user=self.agent)
    
    def test_artist_photo_create(self):
        """Тест создания фотографии артиста."""
        artist = ArtistFactory()
        url = reverse('artistphoto-list')
        
        # Для тестирования загрузки файла нужен специальный формат
        from django.core.files.uploadedfile import SimpleUploadedFile
        # Создаем минимальный валидный JPEG файл
        jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
        image_file = SimpleUploadedFile(
            "test_image.jpg",
            jpeg_data,
            content_type="image/jpeg"
        )
        
        data = {
            'artist': artist.pk,
            'photo': image_file,
            'is_main': True,
            'description': 'Основная фотография'
        }
        
        response = self.client.post(url, data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED
        assert ArtistPhoto.objects.filter(artist=artist, is_main=True).exists()


class TestArtistPermissions(TestCase):
    """Тесты разрешений для Artist."""
    
    def setUp(self):
        """Настройка тестов."""
        self.client = APIClient()
        self.agent1 = ArtistFactory().created_by
        self.agent2 = ArtistFactory().created_by
    
    def test_unauthenticated_access(self):
        """Тест доступа без аутентификации."""
        url = reverse('artist-list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_agent_can_only_edit_own_artists(self):
        """Тест того, что агент может редактировать только своих артистов."""
        artist1 = ArtistFactory(created_by=self.agent1)
        artist2 = ArtistFactory(created_by=self.agent2)
        
        # agent1 пытается редактировать своего артиста
        self.client.force_authenticate(user=self.agent1)
        url = reverse('artist-detail', kwargs={'pk': artist1.pk})
        data = {
            'first_name': artist1.first_name,
            'last_name': artist1.last_name,
            'gender': artist1.gender,
            'city': 'Новый город'
        }
        response = self.client.put(url, data)
        assert response.status_code == status.HTTP_200_OK
        
        # agent1 пытается редактировать артиста agent2
        url = reverse('artist-detail', kwargs={'pk': artist2.pk})
        response = self.client.put(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_agent_can_delete_only_own_artists(self):
        """Тест того, что агент может удалять только своих артистов."""
        artist1 = ArtistFactory(created_by=self.agent1)
        artist2 = ArtistFactory(created_by=self.agent2)
        
        # agent1 пытается удалить своего артиста
        self.client.force_authenticate(user=self.agent1)
        url = reverse('artist-detail', kwargs={'pk': artist1.pk})
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # agent1 пытается удалить артиста agent2
        url = reverse('artist-detail', kwargs={'pk': artist2.pk})
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
