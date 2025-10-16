"""
Factory для создания тестовых персон
"""
from people.models import Person
from .user_factory import UserFactory


class PersonFactory:
    """Factory для создания тестовых персон"""
    
    @staticmethod
    def create(**kwargs):
        """Создать персону с заданными параметрами"""
        defaults = {
            'person_type': 'director',
            'first_name': 'Иван',
            'last_name': 'Иванов',
            'phones': [],
            'emails': [],
            'telegram_usernames': [],
            'is_active': True
        }
        
        # Если не указан created_by, создаем пользователя
        if 'created_by' not in kwargs:
            defaults['created_by'] = UserFactory.create()
        
        defaults.update(kwargs)
        
        # Создаем персону без вызова save() чтобы не запускать валидацию
        person = Person(**defaults)
        person.save = lambda *args, **kw: Person.objects.create(**{
            k: v for k, v in defaults.items() 
            if k in [f.name for f in Person._meta.fields]
        })
        
        return person.save()
    
    def __call__(self, **kwargs):
        """Позволяет использовать PersonFactory() как функцию"""
        return self.create(**kwargs)


# Создаем глобальный экземпляр
PersonFactory = PersonFactory()

