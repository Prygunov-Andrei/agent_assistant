"""
Сервис управления контактами персон с автодополнением
"""
from typing import Optional, Dict, Tuple
from .models import Person
from django.utils import timezone


class PersonContactManager:
    """Управление контактами персон с автодополнением"""
    
    CONTACT_TYPES = {
        'phone': 'phones',
        'email': 'emails',
        'telegram': 'telegram_usernames'
    }
    
    def add_contact_if_new(
        self, 
        person: Person, 
        contact_type: str, 
        contact_value: str,
        request_id: Optional[int] = None
    ) -> Tuple[bool, Optional[Dict]]:
        """
        Добавить контакт, если его еще нет
        
        Args:
            person: объект Person
            contact_type: 'phone', 'email' или 'telegram'
            contact_value: значение контакта
            request_id: ID запроса, из которого получен контакт (опционально)
            
        Returns:
            (added: bool, notification: dict или None)
            - added: True если контакт был добавлен
            - notification: словарь с данными уведомления или None
        """
        if not contact_value or not contact_value.strip():
            return False, None
        
        contact_value = contact_value.strip()
        
        # Проверяем тип контакта
        if contact_type not in self.CONTACT_TYPES:
            return False, None
        
        # Добавляем контакт через метод модели
        was_added = person.add_contact(contact_type, contact_value)
        
        if not was_added:
            # Контакт уже существует или достигнут лимит
            return False, None
        
        # Сохраняем персону
        person.save()
        
        # Создаем уведомление о добавлении контакта
        notification = {
            'person_id': person.id,
            'person_name': person.full_name,
            'contact_type': contact_type,
            'contact_value': contact_value,
            'added_at': timezone.now().isoformat(),
            'request_id': request_id
        }
        
        return True, notification
    
    def find_person_by_contact(
        self,
        contact_type: str,
        contact_value: str,
        person_type: Optional[str] = None
    ) -> Optional[Person]:
        """
        Найти персону по контакту (проверяет как старые, так и новые поля)
        
        Args:
            contact_type: 'phone', 'email' или 'telegram'
            contact_value: значение контакта
            person_type: тип персоны для фильтрации (опционально)
            
        Returns:
            Person объект или None
        """
        if not contact_value or contact_type not in self.CONTACT_TYPES:
            return None
        
        contact_value = contact_value.strip()
        field_name = self.CONTACT_TYPES[contact_type]
        
        queryset = Person.objects.filter(is_active=True)
        
        if person_type:
            queryset = queryset.filter(person_type=person_type)
        
        # Поиск в новых полях (массивы)
        queryset = queryset.filter(**{f'{field_name}__contains': contact_value})
        
        return queryset.first()
    
    def check_and_add_contacts(
        self,
        person_name: str,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        telegram: Optional[str] = None,
        person_type: Optional[str] = None,
        request_id: Optional[int] = None
    ) -> Tuple[Optional[Person], list]:
        """
        Проверить и добавить контакты к существующей персоне
        
        Сначала ищет персону по имени и типу, затем добавляет новые контакты
        
        Args:
            person_name: полное имя персоны
            phone: телефон (опционально)
            email: email (опционально)
            telegram: telegram username (опционально)
            person_type: тип персоны (опционально)
            request_id: ID запроса (опционально)
            
        Returns:
            (person: Person или None, notifications: list)
        """
        # Сначала пробуем найти персону по контактам
        person = None
        
        if phone:
            person = self.find_person_by_contact('phone', phone, person_type)
        
        if not person and email:
            person = self.find_person_by_contact('email', email, person_type)
        
        if not person and telegram:
            person = self.find_person_by_contact('telegram', telegram, person_type)
        
        # Если не нашли по контактам, пробуем найти по имени
        if not person:
            # Поиск по полному имени (упрощенный вариант)
            queryset = Person.objects.filter(is_active=True)
            if person_type:
                queryset = queryset.filter(person_type=person_type)
            
            # Разбиваем имя на части
            name_parts = person_name.strip().split()
            if len(name_parts) >= 2:
                # Пробуем найти по фамилии и имени
                last_name = name_parts[0]
                first_name = name_parts[1] if len(name_parts) > 1 else ''
                
                person = queryset.filter(
                    last_name__iexact=last_name,
                    first_name__iexact=first_name
                ).first()
        
        if not person:
            return None, []
        
        # Добавляем контакты
        notifications = []
        
        if phone:
            added, notification = self.add_contact_if_new(person, 'phone', phone, request_id)
            if added and notification:
                notifications.append(notification)
        
        if email:
            added, notification = self.add_contact_if_new(person, 'email', email, request_id)
            if added and notification:
                notifications.append(notification)
        
        if telegram:
            added, notification = self.add_contact_if_new(person, 'telegram', telegram, request_id)
            if added and notification:
                notifications.append(notification)
        
        return person, notifications


# Создаем экземпляр сервиса
person_contact_manager = PersonContactManager()

