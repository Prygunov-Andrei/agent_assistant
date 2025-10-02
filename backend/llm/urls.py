"""
URLs для LLM API endpoints
"""

from django.urls import path
from . import views

app_name = 'llm'

urlpatterns = [
    # Анализ запросов
    path('requests/<int:request_id>/analyze/', views.analyze_request, name='analyze_request'),
    path('requests/<int:request_id>/analysis-status/', views.get_request_analysis_status, name='request_analysis_status'),
    
    # Артисты для LLM
    path('llm/artists/', views.get_artists_for_llm, name='artists_for_llm'),
    
    # Статус LLM
    path('status/', views.get_llm_status, name='llm_status'),
]
