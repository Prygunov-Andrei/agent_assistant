from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Дополнительные endpoints для фронтенда
    path('api/companies/company-types/', CompanyViewSet.as_view({'get': 'company_types'}), name='company-types'),
    path('api/companies/search-matches/', CompanyViewSet.as_view({'post': 'search_matches'}), name='company-search-matches'),
    path('api/companies/search-by-name/', CompanyViewSet.as_view({'post': 'search_by_name'}), name='company-search-by-name'),
    path('api/companies/by-type/', CompanyViewSet.as_view({'get': 'by_type'}), name='companies-by-type'),
]
