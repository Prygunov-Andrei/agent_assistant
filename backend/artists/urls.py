from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SkillViewSet, EducationViewSet, ArtistViewSet,
    ArtistSkillViewSet, ArtistEducationViewSet, ArtistLinkViewSet, ArtistPhotoViewSet
)

# Создаем роутер для автоматической генерации URL-ов
router = DefaultRouter()

# Регистрируем ViewSets
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'education', EducationViewSet, basename='education')
router.register(r'artists', ArtistViewSet, basename='artist')
router.register(r'artist-skills', ArtistSkillViewSet, basename='artistskill')
router.register(r'artist-education', ArtistEducationViewSet, basename='artisteducation')
router.register(r'artist-links', ArtistLinkViewSet, basename='artistlink')
router.register(r'artist-photos', ArtistPhotoViewSet, basename='artistphoto')

# URL patterns для artists приложения
urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
]
