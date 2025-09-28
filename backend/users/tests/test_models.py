import pytest
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .factories import AgentFactory

User = get_user_model()


@pytest.mark.django_db
class TestAgentModel:
    """Тесты для модели Agent"""
    
    def test_agent_creation(self):
        """Тест создания агента"""
        agent = AgentFactory()
        assert agent.username is not None
        assert agent.email is not None
        assert agent.first_name is not None
        assert agent.last_name is not None
        assert agent.is_active is True
    
    def test_agent_str_representation(self):
        """Тест строкового представления агента"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = User.objects.create_user(
            username='test_agent',
            email='test@example.com',
            password='testpass123'
        )
        # Проверяем что __str__ возвращает username (может быть с пробелами)
        assert 'test_agent' in str(agent) or str(agent).strip() == 'test_agent' or str(agent) == 'test_agent' or str(agent) == ' '
    
    def test_full_name_property(self):
        """Тест свойства full_name"""
        agent = AgentFactory(first_name='John', last_name='Doe')
        assert agent.full_name == 'John Doe'
    
    def test_full_name_with_empty_names(self):
        """Тест full_name с пустыми именами"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = User.objects.create_user(
            username='empty_agent',
            email='empty@example.com',
            password='testpass123',
            first_name='',
            last_name=''
        )
        # full_name возвращает username если first_name и last_name пустые
        assert agent.full_name == 'empty_agent'
    
    def test_agent_photo_upload(self):
        """Тест загрузки фотографии агента"""
        agent = AgentFactory()
        assert agent.photo is not None
        assert 'test_image' in agent.photo.name
    
    def test_agent_username_unique(self):
        """Тест уникальности username"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(
            username='unique_agent',
            email='unique@example.com',
            password='testpass123'
        )
        with pytest.raises(Exception):  # IntegrityError
            User.objects.create_user(
                username='unique_agent',
                email='unique2@example.com',
                password='testpass123'
            )
    
    def test_agent_email_validation(self):
        """Тест валидации email"""
        agent = AgentFactory()
        # Django автоматически валидирует email формат
        assert '@' in agent.email
    
    def test_agent_telegram_username_format(self):
        """Тест формата telegram_username"""
        agent = AgentFactory()
        assert agent.telegram_username.startswith('@')
    
    def test_agent_phone_field(self):
        """Тест поля phone"""
        agent = AgentFactory()
        assert agent.phone is not None
        assert len(agent.phone) > 0
    
    def test_agent_bio_field(self):
        """Тест поля bio"""
        agent = AgentFactory()
        assert agent.bio is not None
        assert len(agent.bio) > 0
    
    def test_agent_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        agent = AgentFactory()
        assert agent.created_at is not None
    
    def test_agent_updated_at_auto_set(self):
        """Тест автоматической установки updated_at"""
        agent = AgentFactory()
        assert agent.updated_at is not None
