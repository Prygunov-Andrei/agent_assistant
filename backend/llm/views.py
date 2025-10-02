"""
Views для LLM API endpoints
"""

import logging
import time
from datetime import datetime
from typing import Dict, Any

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import transaction

from artists.models import Artist
from telegram_requests.models import Request
from django.core.exceptions import ObjectDoesNotExist
from .services import LLMService
from .serializers import (
    LLMAnalysisRequestSerializer,
    LLMAnalysisResponseSerializer,
    ArtistForLLMSerializer,
    LLMStatusSerializer,
    LLMErrorSerializer
)
from .validators import LLMRetryHandler

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_request(request, request_id):
    """
    Анализ запроса через LLM
    
    POST /api/requests/{id}/analyze/
    """
    try:
        # Получаем объект запроса
        try:
            telegram_request = get_object_or_404(Request, id=request_id)
        except Http404:
            logger.warning(f"Запрос {request_id} не найден для анализа.")
            return Response({'error': 'Запрос не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        # Валидируем входные данные
        serializer = LLMAnalysisRequestSerializer(data={
            'request_id': request_id,
            'use_emulator': request.data.get('use_emulator', True)
        })
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Неверные входные данные', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем данные артистов для LLM
        artists = Artist.objects.all()
        artists_data = [
            {
                'id': artist.id,
                'name': f"{artist.first_name} {artist.last_name}",
                'age': artist.age if hasattr(artist, 'age') else None,
                'gender': artist.gender,
                'height': artist.height,
                'weight': artist.weight,
                'clothing_size': artist.clothing_size,
                'shoe_size': artist.shoe_size,
                'hair_color': artist.hair_color,
                'eye_color': artist.eye_color,
                'skills': [],  # Пока пустой массив
                'languages': [],  # Пока пустой массив
                'special_requirements': []  # Пока пустой массив
            }
            for artist in artists
        ]
        
        # Подготавливаем данные запроса
        request_data = {
            'text': telegram_request.text,
            'author_name': telegram_request.author_name,
            'author_telegram_id': telegram_request.author_telegram_id,
            'created_at': telegram_request.created_at.isoformat()
        }
        
        # Инициализируем LLM сервис
        llm_service = LLMService()
        
        # Логируем начало анализа
        logger.info(f"Начало анализа запроса {request_id} пользователем {request.user.username}")
        start_time = time.time()
        
        # Выполняем анализ
        try:
            analysis_result = llm_service.analyze_request(request_data, artists_data)
            
            processing_time = time.time() - start_time
            
            # Формируем ответ (LLM эмулятор уже возвращает правильную структуру)
            response_data = {
                'project_analysis': analysis_result['project_analysis'],
                'confidence': analysis_result['project_analysis'].get('confidence', 0.85),
                'processing_time': processing_time,
                'used_emulator': serializer.validated_data['use_emulator'],
                'errors': []
            }
            
            # Валидируем ответ с помощью нашего валидатора
            from .validators import validate_llm_response
            try:
                validate_llm_response(analysis_result)  # Передаем только project_analysis
            except Exception as e:
                logger.error(f"Ошибка валидации ответа для запроса {request_id}: {str(e)}")
                return Response(
                    {'error': 'Ошибка валидации ответа LLM', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Обновляем статус запроса
            telegram_request.analysis_status = 'analyzed'
            telegram_request.save()
            
            logger.info(f"Анализ запроса {request_id} завершен успешно за {processing_time:.2f}с")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Ошибка анализа запроса {request_id}: {str(e)}")
            
            # Обновляем статус запроса на ошибку
            telegram_request.analysis_status = 'error'
            telegram_request.save()
            
            return Response(
                {
                    'error': 'Ошибка анализа LLM',
                    'details': str(e),
                    'processing_time': processing_time,
                    'used_emulator': serializer.validated_data['use_emulator']
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Request.DoesNotExist:
        logger.warning(f"Запрос {request_id} не найден для анализа.")
        return Response(
            {'error': 'Запрос не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Неожиданная ошибка в analyze_request: {str(e)}")
        return Response(
            {'error': 'Внутренняя ошибка сервера'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_artists_for_llm(request):
    """
    Получение списка артистов для LLM
    
    GET /api/artists/for-llm/
    """
    try:
        artists = Artist.objects.all()
        
        # Подготавливаем данные для сериализации
        artists_data = [
            {
                'id': artist.id,
                'name': f"{artist.first_name} {artist.last_name}",
                'age': artist.age if hasattr(artist, 'age') else 25,  # Дефолтный возраст
                'gender': artist.gender,
                'height': artist.height or 0,
                'weight': artist.weight or 0,
                'clothing_size': artist.clothing_size or '',
                'shoe_size': artist.shoe_size or '',
                'hair_color': artist.hair_color or '',
                'eye_color': artist.eye_color or '',
                'skills': [],  # Пока пустой массив
                'languages': [],  # Пока пустой массив
                'special_requirements': []  # Пока пустой массив
            }
            for artist in artists
        ]
        
        # Сериализуем данные артистов
        serializer = ArtistForLLMSerializer(artists_data, many=True)
        
        logger.info(f"Получен список артистов для LLM: {len(artists)} артистов")
        
        return Response({
            'artists': serializer.data,
            'total_count': len(artists)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Ошибка получения артистов для LLM: {str(e)}")
        return Response(
            {'error': 'Ошибка получения данных артистов'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_llm_status(request):
    """
    Получение статуса LLM сервиса
    
    GET /api/llm/status/
    """
    try:
        llm_service = LLMService()
        
        # Получаем статус (это можно расширить в будущем)
        status_data = {
            'status': 'idle',
            'last_request_time': datetime.now(),
            'total_requests': 0,  # Можно добавить счетчики
            'successful_requests': 0,
            'failed_requests': 0,
            'emulator_enabled': llm_service.config.get('use_emulator', True),
            'current_model': llm_service.config.get('model', 'gpt-4o')
        }
        
        serializer = LLMStatusSerializer(data=status_data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Ошибка сериализации статуса'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Ошибка получения статуса LLM: {str(e)}")
        return Response(
            {'error': 'Ошибка получения статуса LLM'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_request_analysis_status(request, request_id):
    """
    Получение статуса анализа запроса
    
    GET /api/requests/{id}/analysis-status/
    """
    try:
        try:
            telegram_request = get_object_or_404(Request, id=request_id)
        except Http404:
            logger.warning(f"Запрос {request_id} не найден для анализа.")
            return Response({'error': 'Запрос не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'request_id': request_id,
            'analysis_status': telegram_request.analysis_status,
            'created_at': telegram_request.created_at,
            'updated_at': telegram_request.updated_at
        }, status=status.HTTP_200_OK)
        
    except Request.DoesNotExist:
        return Response(
            {'error': 'Запрос не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Ошибка получения статуса анализа запроса {request_id}: {str(e)}")
        return Response(
            {'error': 'Ошибка получения статуса анализа'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
