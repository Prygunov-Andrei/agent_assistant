from rest_framework import permissions


class OwnerPermission(permissions.BasePermission):
    """
    Базовый класс разрешений для проверки владельца объекта.
    
    Позволяет:
    - Читать объекты всем аутентифицированным пользователям
    - Изменять/удалять объекты только их создателям
    
    Используется для моделей, которые имеют поле created_by.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет разрешения для конкретного объекта.
        
        Args:
            request: HTTP запрос
            view: ViewSet представление
            obj: объект модели для проверки
            
        Returns:
            bool: True если у пользователя есть права на объект
        """
        # Безопасные методы (GET, HEAD, OPTIONS) доступны всем аутентифицированным
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Методы изменения (POST, PUT, PATCH, DELETE) доступны только создателю
        return obj.created_by == request.user


class ProjectRolePermission(permissions.BasePermission):
    """
    Специальный класс разрешений для ролей в проектах.
    
    Проверяет права доступа к роли через владельца родительского проекта.
    Позволяет изменять роли только создателю проекта, к которому они принадлежат.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Проверяет разрешения для роли в проекте.
        
        Args:
            request: HTTP запрос
            view: ViewSet представление
            obj: объект ProjectRole для проверки
            
        Returns:
            bool: True если у пользователя есть права на роль
        """
        # Безопасные методы доступны всем аутентифицированным
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Методы изменения доступны только создателю родительского проекта
        return obj.project.created_by == request.user
