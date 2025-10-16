"""
Тесты для функциональности множественных контактов персон
"""
import pytest
from django.core.exceptions import ValidationError
from people.models import Person, PersonContactAddition
from people.contact_manager import person_contact_manager
from tests.factories.people_factory import PersonFactory
from tests.factories.user_factory import UserFactory


@pytest.mark.django_db
class TestPersonMultipleContacts:
    """Тесты модели Person с множественными контактами"""
    
    def test_person_can_have_multiple_phones(self):
        """Тест: персона может иметь несколько телефонов"""
        person = PersonFactory(
            phones=['+7-111-111-11-11', '+7-222-222-22-22', '+7-333-333-33-33']
        )
        
        assert len(person.phones) == 3
        assert '+7-111-111-11-11' in person.phones
        assert '+7-222-222-22-22' in person.phones
        assert '+7-333-333-33-33' in person.phones
    
    def test_person_can_have_multiple_emails(self):
        """Тест: персона может иметь несколько email"""
        person = PersonFactory(
            emails=['email1@example.com', 'email2@example.com', 'email3@example.com']
        )
        
        assert len(person.emails) == 3
        assert 'email1@example.com' in person.emails
    
    def test_person_can_have_multiple_telegrams(self):
        """Тест: персона может иметь несколько Telegram"""
        person = PersonFactory(
            telegram_usernames=['@user1', '@user2', '@user3']
        )
        
        assert len(person.telegram_usernames) == 3
        assert '@user1' in person.telegram_usernames
    
    def test_person_max_5_phones(self):
        """Тест: максимум 5 телефонов"""
        # Создаем персону без сохранения
        user = UserFactory()
        person = Person(
            person_type='director',
            first_name='Иван',
            last_name='Иванов',
            phones=['+7-111', '+7-222', '+7-333', '+7-444', '+7-555', '+7-666'],
            created_by=user
        )
        
        with pytest.raises(ValidationError) as exc_info:
            person.full_clean()
        
        assert 'phones' in exc_info.value.message_dict
    
    def test_person_max_5_emails(self):
        """Тест: максимум 5 email"""
        # Создаем персону без сохранения
        user = UserFactory()
        person = Person(
            person_type='producer',
            first_name='Петр',
            last_name='Петров',
            emails=['e1@test.com', 'e2@test.com', 'e3@test.com', 
                   'e4@test.com', 'e5@test.com', 'e6@test.com'],
            created_by=user
        )
        
        with pytest.raises(ValidationError) as exc_info:
            person.full_clean()
        
        assert 'emails' in exc_info.value.message_dict
    
    def test_person_primary_phone_returns_first(self):
        """Тест: primary_phone возвращает первый телефон"""
        person = PersonFactory(
            phones=['+7-111-111-11-11', '+7-222-222-22-22']
        )
        
        assert person.primary_phone == '+7-111-111-11-11'
    
    def test_person_primary_email_returns_first(self):
        """Тест: primary_email возвращает первый email"""
        person = PersonFactory(
            emails=['first@test.com', 'second@test.com']
        )
        
        assert person.primary_email == 'first@test.com'
    
    def test_person_primary_telegram_returns_first(self):
        """Тест: primary_telegram возвращает первый Telegram"""
        person = PersonFactory(
            telegram_usernames=['@first', '@second']
        )
        
        assert person.primary_telegram == '@first'
    
    def test_person_add_contact_phone(self):
        """Тест: добавление нового телефона"""
        person = PersonFactory(phones=['+7-111-111-11-11'])
        
        result = person.add_contact('phone', '+7-222-222-22-22')
        
        assert result is True
        assert len(person.phones) == 2
        assert '+7-222-222-22-22' in person.phones
    
    def test_person_add_contact_duplicate(self):
        """Тест: добавление дубликата не происходит"""
        person = PersonFactory(phones=['+7-111-111-11-11'])
        
        result = person.add_contact('phone', '+7-111-111-11-11')
        
        assert result is False
        assert len(person.phones) == 1
    
    def test_person_add_contact_max_limit(self):
        """Тест: нельзя добавить больше 5 контактов"""
        person = PersonFactory(
            phones=['+7-111', '+7-222', '+7-333', '+7-444', '+7-555']
        )
        
        result = person.add_contact('phone', '+7-666')
        
        assert result is False
        assert len(person.phones) == 5
    
    def test_person_clean_removes_empty_contacts(self):
        """Тест: валидация удаляет пустые контакты"""
        person = PersonFactory(
            phones=['+7-111', '', '  ', '+7-222'],
            emails=['test@test.com', '', None, 'test2@test.com']
        )
        
        person.clean()
        
        assert len(person.phones) == 2
        assert '+7-111' in person.phones
        assert '+7-222' in person.phones
        assert '' not in person.phones


@pytest.mark.django_db
class TestPersonContactManager:
    """Тесты PersonContactManager"""
    
    def test_add_contact_if_new_success(self):
        """Тест: успешное добавление нового контакта"""
        person = PersonFactory(phones=['+7-111-111-11-11'])
        
        added, notification = person_contact_manager.add_contact_if_new(
            person, 'phone', '+7-222-222-22-22'
        )
        
        assert added is True
        assert notification is not None
        assert notification['contact_type'] == 'phone'
        assert notification['contact_value'] == '+7-222-222-22-22'
        assert notification['person_id'] == person.id
        
        # Проверяем что контакт добавлен в базу
        person.refresh_from_db()
        assert '+7-222-222-22-22' in person.phones
    
    def test_add_contact_if_new_duplicate(self):
        """Тест: дубликат не добавляется"""
        person = PersonFactory(phones=['+7-111-111-11-11'])
        
        added, notification = person_contact_manager.add_contact_if_new(
            person, 'phone', '+7-111-111-11-11'
        )
        
        assert added is False
        assert notification is None
    
    def test_find_person_by_contact_phone(self):
        """Тест: поиск персоны по телефону"""
        person = PersonFactory(
            phones=['+7-111-111-11-11', '+7-222-222-22-22']
        )
        
        # Поиск по первому телефону
        found = person_contact_manager.find_person_by_contact(
            'phone', '+7-111-111-11-11'
        )
        assert found is not None
        assert found.id == person.id
        
        # Поиск по второму телефону
        found = person_contact_manager.find_person_by_contact(
            'phone', '+7-222-222-22-22'
        )
        assert found is not None
        assert found.id == person.id
    
    def test_find_person_by_contact_email(self):
        """Тест: поиск персоны по email"""
        person = PersonFactory(
            emails=['test1@example.com', 'test2@example.com']
        )
        
        found = person_contact_manager.find_person_by_contact(
            'email', 'test1@example.com'
        )
        assert found is not None
        assert found.id == person.id
    
    def test_check_and_add_contacts_new_phone(self):
        """Тест: автодополнение контактов"""
        user = UserFactory()
        person = PersonFactory(
            first_name='Иван',
            last_name='Иванов',
            phones=['+7-111-111-11-11'],
            created_by=user
        )
        
        # Проверяем добавление нового телефона
        found_person, notifications = person_contact_manager.check_and_add_contacts(
            person_name='Иванов Иван',
            phone='+7-222-222-22-22',
            person_type='director'
        )
        
        assert found_person is not None
        assert found_person.id == person.id
        assert len(notifications) == 1
        assert notifications[0]['contact_type'] == 'phone'
        assert notifications[0]['contact_value'] == '+7-222-222-22-22'
        
        # Проверяем что контакт добавлен
        person.refresh_from_db()
        assert '+7-222-222-22-22' in person.phones


@pytest.mark.django_db
class TestPersonContactAddition:
    """Тесты модели PersonContactAddition"""
    
    def test_create_contact_addition(self):
        """Тест: создание уведомления о добавлении контакта"""
        person = PersonFactory()
        
        addition = PersonContactAddition.objects.create(
            person=person,
            contact_type='phone',
            contact_value='+7-999-999-99-99'
        )
        
        assert addition.person == person
        assert addition.contact_type == 'phone'
        assert addition.contact_value == '+7-999-999-99-99'
        assert addition.is_confirmed is False
        assert addition.is_rejected is False
    
    def test_confirm_contact_addition(self):
        """Тест: подтверждение добавления контакта"""
        user = UserFactory()
        person = PersonFactory()
        addition = PersonContactAddition.objects.create(
            person=person,
            contact_type='email',
            contact_value='new@test.com'
        )
        
        addition.confirm(user)
        
        assert addition.is_confirmed is True
        assert addition.is_rejected is False
        assert addition.reviewed_by == user
        assert addition.reviewed_at is not None
    
    def test_reject_contact_addition(self):
        """Тест: отклонение добавления контакта"""
        user = UserFactory()
        person = PersonFactory(phones=['+7-999-999-99-99'])
        
        addition = PersonContactAddition.objects.create(
            person=person,
            contact_type='phone',
            contact_value='+7-999-999-99-99'
        )
        
        addition.reject(user, notes='Дубликат')
        
        assert addition.is_rejected is True
        assert addition.is_confirmed is False
        assert addition.reviewed_by == user
        assert addition.notes == 'Дубликат'
        
        # Проверяем что контакт удален из персоны
        person.refresh_from_db()
        assert '+7-999-999-99-99' not in person.phones

