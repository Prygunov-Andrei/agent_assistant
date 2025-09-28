from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Company
from .serializers import CompanySerializer, CompanyListSerializer


@extend_schema_view(
    list=extend_schema(
        summary="Список кинокомпаний",
        description="Получить список всех активных кинокомпаний",
        tags=["Кинокомпании"]
    ),
    create=extend_schema(
        summary="Создать кинокомпанию",
        description="Создать новую кинокомпанию в системе",
        tags=["Кинокомпании"]
    ),
    retrieve=extend_schema(
        summary="Получить кинокомпанию",
        description="Получить информацию о конкретной кинокомпании",
        tags=["Кинокомпании"]
    ),
    update=extend_schema(
        summary="Обновить кинокомпанию",
        description="Полностью обновить информацию о кинокомпании",
        tags=["Кинокомпании"]
    ),
    partial_update=extend_schema(
        summary="Частично обновить кинокомпанию",
        description="Частично обновить информацию о кинокомпании",
        tags=["Кинокомпании"]
    ),
    destroy=extend_schema(
        summary="Удалить кинокомпанию",
        description="Удалить кинокомпанию из системы",
        tags=["Кинокомпании"]
    ),
)
class CompanyViewSet(viewsets.ModelViewSet):
    """ViewSet для управления кинокомпаниями"""
    
    queryset = Company.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return CompanyListSerializer
        return CompanySerializer
    
    def get_queryset(self):
        """Фильтрация queryset"""
        queryset = super().get_queryset()
        
        # Показываем только активные компании в списке
        if self.action == 'list':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Устанавливаем создателя при создании"""
        serializer.save(created_by=self.request.user)
    
    @extend_schema(
        summary="Мои кинокомпании",
        description="Получить список кинокомпаний, созданных текущим агентом",
        tags=["Кинокомпании"]
    )
    @action(detail=False, methods=['get'])
    def my_companies(self, request):
        """Получить кинокомпании, созданные текущим агентом"""
        companies = self.get_queryset().filter(created_by=request.user)
        serializer = self.get_serializer(companies, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Поиск кинокомпаний",
        description="Поиск кинокомпаний по названию и типу",
        tags=["Кинокомпании"]
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск кинокомпаний"""
        query = request.query_params.get('q', '')
        company_type = request.query_params.get('type', '')
        
        queryset = self.get_queryset()
        
        if query:
            queryset = queryset.filter(name__icontains=query)
        
        if company_type:
            queryset = queryset.filter(company_type=company_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)