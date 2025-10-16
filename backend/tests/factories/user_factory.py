"""
Factory для создания тестовых пользователей
"""
from django.contrib.auth import get_user_model

User = get_user_model()


class UserFactory:
    """Factory для создания тестовых пользователей"""
    
    _counter = 0
    
    @classmethod
    def create(cls, **kwargs):
        """Создать пользователя с заданными параметрами"""
        cls._counter += 1
        
        defaults = {
            'username': f'testuser{cls._counter}',
            'email': f'testuser{cls._counter}@example.com',
            'password': 'testpassword123'
        }
        
        defaults.update(kwargs)
        
        return User.objects.create_user(**defaults)
    
    def __call__(self, **kwargs):
        """Позволяет использовать UserFactory() как функцию"""
        return self.create(**kwargs)


# Создаем глобальный экземпляр
UserFactory = UserFactory()

