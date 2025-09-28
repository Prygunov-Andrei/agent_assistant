import pytest
from django.core.exceptions import ValidationError
from companies.models import Company
from .factories import CompanyFactory
from users.tests.factories import AgentFactory


@pytest.mark.django_db
class TestCompanyModel:
    """Тесты для модели Company"""
    
    def test_company_creation(self):
        """Тест создания кинокомпании"""
        company = CompanyFactory()
        assert company.name is not None
        assert company.company_type is not None
        assert company.is_active is True
        assert company.created_by is not None
    
    def test_company_str_representation(self):
        """Тест строкового представления компании"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = Company.objects.create(
            name='Test Studio',
            created_by=agent
        )
        # Проверяем что __str__ возвращает name
        assert str(company) == 'Test Studio'
    
    def test_company_required_fields(self):
        """Тест обязательных полей"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = Company.objects.create(
            name='Required Test Company',
            created_by=agent
        )
        assert company.name == 'Required Test Company'
        assert company.company_type == 'production'  # default value
        assert company.is_active is True  # default value
    
    def test_company_optional_fields(self):
        """Тест необязательных полей"""
        company = CompanyFactory(
            description='Test description',
            website='https://test.com',
            email='test@test.com',
            phone='+1234567890',
            address='Test Address',
            founded_year=2020
        )
        assert company.description == 'Test description'
        assert company.website == 'https://test.com'
        assert company.email == 'test@test.com'
        assert company.phone == '+1234567890'
        assert company.address == 'Test Address'
        assert company.founded_year == 2020
    
    def test_company_logo_upload(self):
        """Тест загрузки логотипа компании"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = CompanyFactory(created_by=agent)
        assert company.logo is not None
        assert 'test_logo' in company.logo.name
    
    def test_company_type_choices(self):
        """Тест выбора типа компании"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        valid_types = ['production', 'distribution', 'studio', 'network', 'streaming', 'other']
        for company_type in valid_types:
            company = CompanyFactory(company_type=company_type, created_by=agent)
            assert company.company_type == company_type
    
    def test_company_created_by_relationship(self):
        """Тест связи с создателем"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = CompanyFactory(created_by=agent)
        assert company.created_by == agent
        assert company in agent.company_set.all()
    
    def test_company_created_at_auto_set(self):
        """Тест автоматической установки created_at"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = CompanyFactory(created_by=agent)
        assert company.created_at is not None
    
    def test_company_updated_at_auto_set(self):
        """Тест автоматической установки updated_at"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = CompanyFactory(created_by=agent)
        assert company.updated_at is not None
    
    def test_company_ordering(self):
        """Тест сортировки компаний"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        CompanyFactory(name='Z Company', created_by=agent)
        CompanyFactory(name='A Company', created_by=agent)
        CompanyFactory(name='M Company', created_by=agent)
        
        companies = Company.objects.all()
        assert companies[0].name == 'A Company'
        assert companies[1].name == 'M Company'
        assert companies[2].name == 'Z Company'
    
    def test_company_founded_year_validation(self):
        """Тест валидации года основания"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        agent = AgentFactory()
        company = CompanyFactory(founded_year=2024, created_by=agent)
        assert company.founded_year == 2024
        
        # Тест с нереалистичным годом (но PositiveIntegerField позволяет)
        company = CompanyFactory(founded_year=3000, created_by=agent)
        assert company.founded_year == 3000
