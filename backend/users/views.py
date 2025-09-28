from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Agent
from .serializers import AgentSerializer, AgentListSerializer

User = get_user_model()


@extend_schema_view(
    list=extend_schema(
        summary="Список агентов",
        description="Получить список всех активных агентов",
        tags=["Агенты"]
    ),
    create=extend_schema(
        summary="Создать агента",
        description="Создать нового агента в системе",
        tags=["Агенты"]
    ),
    retrieve=extend_schema(
        summary="Получить агента",
        description="Получить информацию о конкретном агенте",
        tags=["Агенты"]
    ),
    update=extend_schema(
        summary="Обновить агента",
        description="Полностью обновить информацию об агенте",
        tags=["Агенты"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить агента",
        description="Частично обновить информацию об агенте",
        tags=["Агенты"]
    ),
    destroy=extend_schema(
        summary="Удалить агента",
        description="Удалить агента из системы",
        tags=["Агенты"]
    ),
)
class AgentViewSet(viewsets.ModelViewSet):
    """ViewSet для управления агентами"""
    
    queryset = Agent.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return AgentListSerializer
        return AgentSerializer
    
    def get_queryset(self):
        """Фильтрация queryset"""
        queryset = super().get_queryset()
        
        # Показываем только активных агентов в списке
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @extend_schema(
        summary="Мой профиль",
        description="Получить информацию о текущем агенте",
        tags=["Агенты"]
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получить информацию о текущем агенте"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Обновить профиль",
        description="Обновить профиль текущего агента",
        tags=["Агенты"]
    )
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Обновить профиль текущего агента"""
        serializer = self.get_serializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)