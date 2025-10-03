import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from datetime import datetime, timedelta
import pytz

from users.models import Agent
from telegram_requests.models import Request, RequestImage, RequestFile


class RequestFactory(DjangoModelFactory):
    """Фабрика для создания тестовых запросов"""
    
    class Meta:
        model = Request
    
    text = factory.Sequence(lambda n: f"Тестовый запрос #{n}")
    author_name = factory.Faker('name', locale='ru_RU')
    author_telegram_id = factory.Faker('random_int', min=100000000, max=999999999)
    sender_telegram_id = factory.Faker('random_int', min=100000000, max=999999999)
    telegram_message_id = factory.Faker('random_int', min=1, max=1000000)
    telegram_chat_id = factory.Faker('random_int', min=100000000, max=999999999)
    has_images = factory.Faker('boolean')
    has_files = factory.Faker('boolean')
    original_created_at = factory.LazyFunction(lambda: timezone.now() - timedelta(days=1))
    status = factory.Iterator(['pending', 'in_progress', 'completed', 'cancelled'])
    analysis_status = factory.Iterator(['new', 'analyzed', 'processed'])
    created_by = factory.SubFactory('tests.unit.users.factories.AgentFactory')
    agent = factory.SubFactory('tests.unit.users.factories.AgentFactory')
    processed_at = None
    response_text = factory.Faker('sentence', nb_words=10, locale='ru_RU')
    project = None


class PendingRequestFactory(RequestFactory):
    """Фабрика для запросов в статусе ожидания"""
    status = 'pending'
    analysis_status = 'new'
    agent = None
    processed_at = None
    response_text = ''
    project = None


class CompletedRequestFactory(RequestFactory):
    """Фабрика для выполненных запросов"""
    status = 'completed'
    analysis_status = 'processed'
    processed_at = factory.LazyFunction(lambda: timezone.now() - timedelta(hours=2))
    response_text = factory.Faker('sentence', nb_words=15, locale='ru_RU')
    project = None


class RequestWithMediaFactory(RequestFactory):
    """Фабрика для запросов с медиафайлами"""
    has_images = True
    has_files = True


class RequestImageFactory(DjangoModelFactory):
    """Фабрика для создания тестовых изображений запросов"""
    
    class Meta:
        model = RequestImage
    
    request = factory.SubFactory(RequestFactory)
    caption = factory.Faker('sentence', nb_words=5, locale='ru_RU')
    telegram_file_id = factory.Sequence(lambda n: f"BAADBAADrwADBREAAZ{str(n).zfill(10)}")
    file_size = factory.Faker('random_int', min=1024, max=10485760)  # 1KB - 10MB


class RequestFileFactory(DjangoModelFactory):
    """Фабрика для создания тестовых файлов запросов"""
    
    class Meta:
        model = RequestFile
    
    request = factory.SubFactory(RequestFactory)
    original_filename = factory.Sequence(lambda n: f"test_file_{n}.pdf")
    file_size = factory.Faker('random_int', min=1024, max=52428800)  # 1KB - 50MB
    mime_type = factory.Iterator(['application/pdf', 'application/msword', 'text/plain'])
    telegram_file_id = factory.Sequence(lambda n: f"BAADBAADrwADBREAAZ{str(n).zfill(10)}")


# Фабрики для специальных случаев тестирования
class TelegramWebhookDataFactory:
    """Фабрика для создания данных webhook от Telegram"""
    
    @staticmethod
    def create_text_message(forwarded=False):
        """Создает данные для текстового сообщения"""
        from_user = {
            'id': 123456789,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        message_data = {
            'from': from_user,
            'message_id': 987654321,
            'chat': {'id': from_user['id']},
            'text': 'Тестовое сообщение для webhook',
            'date': int((timezone.now() - timedelta(minutes=30)).timestamp())
        }
        
        if forwarded:
            message_data['forward_from'] = {
                'id': 987654321,
                'username': 'originaluser',
                'first_name': 'Original',
                'last_name': 'User'
            }
        
        return {'message': message_data}
    
    @staticmethod
    def create_photo_message():
        """Создает данные для сообщения с фотографией"""
        from_user = {
            'id': 123456789,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        message_data = {
            'from': from_user,
            'message_id': 987654321,
            'chat': {'id': from_user['id']},
            'text': 'Сообщение с фотографией',
            'date': int((timezone.now() - timedelta(minutes=30)).timestamp()),
            'photo': [
                {
                    'file_id': "BAADBAADrwADBREAAZ123456789",
                    'file_size': 1024000,
                    'width': 1280,
                    'height': 720
                }
            ]
        }
        
        return {'message': message_data}
    
    @staticmethod
    def create_document_message():
        """Создает данные для сообщения с документом"""
        from_user = {
            'id': 123456789,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        message_data = {
            'from': from_user,
            'message_id': 987654321,
            'chat': {'id': from_user['id']},
            'text': 'Сообщение с документом',
            'date': int((timezone.now() - timedelta(minutes=30)).timestamp()),
            'document': {
                'file_id': "BAADBAADrwADBREAAZ987654321",
                'file_name': "test_file_123.pdf",
                'file_size': 2048000,
                'mime_type': 'application/pdf'
            }
        }
        
        return {'message': message_data}
    
    @staticmethod
    def create_empty_message():
        """Создает данные для пустого сообщения (без текста)"""
        from_user = {
            'id': 123456789,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        message_data = {
            'from': from_user,
            'message_id': 987654321,
            'chat': {'id': from_user['id']},
            'date': int((timezone.now() - timedelta(minutes=30)).timestamp())
        }
        
        return {'message': message_data}