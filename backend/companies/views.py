from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Company
from .serializers import (
    CompanySerializer, 
    CompanyListSerializer, 
    CompanyMatchSerializer,
    CompanySearchRequestSerializer,
    CompanyNameSearchRequestSerializer,
    CompanyTypeSerializer
)
from .services import company_matching_service


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
    
    @extend_schema(
        summary="Поиск совпадений кинокомпаний",
        description="Поиск совпадений кинокомпаний по различным критериям с fuzzy matching",
        tags=["Кинокомпании"],
        request=CompanySearchRequestSerializer,
        responses={200: CompanyMatchSerializer(many=True)}
    )
    @action(detail=False, methods=['post'])
    def search_matches(self, request):
        """Поиск совпадений кинокомпаний"""
        serializer = CompanySearchRequestSerializer(data=request.data)
        if serializer.is_valid():
            search_data = {
                'name': serializer.validated_data.get('name', ''),
                'website': serializer.validated_data.get('website', ''),
                'email': serializer.validated_data.get('email', ''),
            }
            limit = serializer.validated_data.get('limit', 5)
            
            matches = company_matching_service.search_matches(search_data, limit)
            result_serializer = CompanyMatchSerializer(matches, many=True)
            
            return Response({
                'matches': result_serializer.data,
                'total': len(matches),
                'search_criteria': search_data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Поиск кинокомпаний по названию",
        description="Поиск кинокомпаний по названию с fuzzy matching",
        tags=["Кинокомпании"],
        request=CompanyNameSearchRequestSerializer,
        responses={200: CompanyMatchSerializer(many=True)}
    )
    @action(detail=False, methods=['post'])
    def search_by_name(self, request):
        """Поиск кинокомпаний по названию"""
        serializer = CompanyNameSearchRequestSerializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data['name']
            limit = serializer.validated_data.get('limit', 5)
            
            matches = company_matching_service.search_by_name(name, limit)
            result_serializer = CompanyMatchSerializer(matches, many=True)
            
            return Response({
                'matches': result_serializer.data,
                'total': len(matches),
                'search_name': name
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Кинокомпании по типу",
        description="Получить список кинокомпаний определенного типа",
        tags=["Кинокомпании"],
        responses={200: CompanyListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='by-type/(?P<company_type>[^/.]+)')
    def by_type(self, request, company_type=None):
        """Получить кинокомпании по типу"""
        if not company_type:
            return Response(
                {'error': 'Тип компании не указан'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        companies = company_matching_service.get_companies_by_type(company_type)
        serializer = CompanyListSerializer(companies, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Типы кинокомпаний",
        description="Получить список доступных типов кинокомпаний",
        tags=["Кинокомпании"],
        responses={200: CompanyTypeSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def company_types(self, request):
        """Получить типы кинокомпаний"""
        types = company_matching_service.get_company_types()
        serializer = CompanyTypeSerializer(types, many=True)
        return Response(serializer.data)