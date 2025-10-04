from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import Http404
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.db import models
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime
import pytz
import json
import os
import logging

from core.views import BaseModelViewSet
from core.permissions import OwnerPermission
from .models import Request, RequestImage, RequestFile
from .serializers import (
    RequestSerializer, RequestListSerializer, RequestCreateSerializer,
    RequestResponseSerializer, RequestStatusSerializer,
    RequestImageSerializer, RequestFileSerializer, TelegramWebhookDataSerializer
)
from .services import TelegramFileService
from .duplicate_detection import duplicate_detector
from .media_cache import media_cache_service

logger = logging.getLogger(__name__)


class RequestViewSet(BaseModelViewSet):
    """ViewSet для управления запросами"""
    
    queryset = Request.objects.all()
    serializer_class = RequestSerializer
    list_serializer_class = RequestListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['text', 'author_name']
    ordering_fields = ['created_at', 'original_created_at', 'processed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Все агенты видят все запросы с поддержкой фильтрации"""
        queryset = super().get_queryset()
        
        # Простая фильтрация по параметрам запроса
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        agent_id = self.request.query_params.get('agent')
        if agent_id:
            queryset = queryset.filter(agent_id=agent_id)
            
        has_images = self.request.query_params.get('has_images')
        if has_images is not None:
            queryset = queryset.filter(has_images=has_images.lower() == 'true')
            
        has_files = self.request.query_params.get('has_files')
        if has_files is not None:
            queryset = queryset.filter(has_files=has_files.lower() == 'true')
            
        # Оптимизируем запросы с помощью prefetch_related
        return queryset.prefetch_related('images', 'files')
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return self.list_serializer_class
        elif self.action == 'create':
            return RequestCreateSerializer
        elif self.action == 'respond':
            return RequestResponseSerializer
        elif self.action == 'change_status':
            return RequestStatusSerializer
        return self.serializer_class
    
    def create(self, request, *args, **kwargs):
        """Создание запроса (для webhook)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Создаем запрос без привязки к агенту
        request_obj = serializer.save()
        
        return Response(
            {'status': 'ok', 'request_id': request_obj.id},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Ответ на запрос"""
        request_obj = self.get_object()
        
        serializer = self.get_serializer(request_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Изменение статуса запроса"""
        request_obj = self.get_object()
        
        serializer = self.get_serializer(request_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика запросов"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'with_media': queryset.filter(models.Q(has_images=True) | models.Q(has_files=True)).count(),
            'today': queryset.filter(created_at__date=timezone.now().date()).count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Запросы, назначенные текущему агенту"""
        queryset = self.get_queryset().filter(agent=request.user)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.list_serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.list_serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unassigned(self, request):
        """Неназначенные запросы"""
        queryset = self.get_queryset().filter(agent__isnull=True)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.list_serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.list_serializer_class(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='media')
    def get_request_media(self, request, pk=None):
        """Получить медиафайлы запроса с оптимизацией и кэшированием"""
        try:
            request_obj = self.get_object()
        except Http404:
            return Response({
                'error': 'Запрос не найден'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Ошибка получения запроса: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            
            # Проверяем кэш
            cached_data = media_cache_service.get_media_from_cache(request_obj.id)
            if cached_data.get('cached'):
                logger.info(f"Медиафайлы запроса {request_obj.id} получены из кэша")
                return Response({
                    'id': request_obj.id,
                    'has_images': request_obj.has_images,
                    'has_files': request_obj.has_files,
                    'images': cached_data['images'],
                    'files': cached_data['files'],
                    'images_count': len(cached_data['images']),
                    'files_count': len(cached_data['files']),
                    'total_size': sum(img.get('file_size', 0) for img in cached_data['images']) + 
                                 sum(f.get('file_size', 0) for f in cached_data['files']),
                    'cached': True
                })
            
            # Если нет в кэше, получаем из БД
            logger.info(f"Получение медиафайлов запроса {request_obj.id} из БД")
            
            # Оптимизируем запросы с помощью select_related
            images = request_obj.images.select_related('request').all()
            image_serializer = RequestImageSerializer(images, many=True, context={'request': request})
            
            files = request_obj.files.select_related('request').all()
            file_serializer = RequestFileSerializer(files, many=True, context={'request': request})
            
            # Сохраняем в кэш
            media_cache_service.set_media_to_cache(
                request_obj.id, 
                image_serializer.data, 
                file_serializer.data
            )
            
            response_data = {
                'id': request_obj.id,
                'has_images': request_obj.has_images,
                'has_files': request_obj.has_files,
                'images': image_serializer.data,
                'files': file_serializer.data,
                'images_count': len(image_serializer.data),
                'files_count': len(file_serializer.data),
                'total_size': sum(img.get('file_size', 0) for img in image_serializer.data) + 
                             sum(f.get('file_size', 0) for f in file_serializer.data),
                'cached': False
            }
            
            return Response(response_data)
        except Exception as e:
            logger.error(f"Ошибка получения медиафайлов запроса {pk}: {str(e)}")
            return Response({
                'error': f'Ошибка получения медиафайлов запроса: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='media/clear-cache')
    def clear_media_cache(self, request, pk=None):
        """Очистить кэш медиафайлов запроса"""
        try:
            request_obj = self.get_object()
        except Http404:
            return Response({
                'error': 'Запрос не найден'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Ошибка получения запроса: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            media_cache_service.clear_media_cache(request_obj.id)
            
            return Response({
                'message': f'Кэш медиафайлов запроса {request_obj.id} очищен',
                'request_id': request_obj.id
            })
        except Exception as e:
            logger.error(f"Ошибка очистки кэша медиафайлов запроса {pk}: {str(e)}")
            return Response({
                'error': f'Ошибка очистки кэша: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RequestImageViewSet(BaseModelViewSet):
    """ViewSet для управления изображениями запросов"""
    
    queryset = RequestImage.objects.all()
    serializer_class = RequestImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Фильтрация изображений по запросам агента"""
        queryset = super().get_queryset()
        
        if self.request.user.is_authenticated:
            queryset = queryset.filter(
                request__agent=self.request.user
            )
            
        return queryset


class RequestFileViewSet(BaseModelViewSet):
    """ViewSet для управления файлами запросов"""
    
    queryset = RequestFile.objects.all()
    serializer_class = RequestFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Фильтрация файлов по запросам агента"""
        queryset = super().get_queryset()
        
        if self.request.user.is_authenticated:
            queryset = queryset.filter(
                request__agent=self.request.user
            )
            
        return queryset


# Webhook ViewSet для бота
class TelegramWebhookViewSet(viewsets.ViewSet):
    """ViewSet для обработки webhook от Telegram бота"""
    
    permission_classes = []  # Без аутентификации для webhook
    parser_classes = [JSONParser]
    
    @action(detail=False, methods=['post'])
    def webhook(self, request):
        """Обработка webhook от Telegram бота"""
        try:
            # Пытаемся получить данные
            try:
                request_data = request.data
            except:
                # Если не удалось распарсить JSON, возвращаем 400
                return Response({
                    'status': 'error',
                    'message': 'Некорректные данные JSON'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Валидируем данные с помощью TelegramWebhookDataSerializer
            webhook_serializer = TelegramWebhookDataSerializer(data=request_data)
            if not webhook_serializer.is_valid():
                return Response({
                    'status': 'error',
                    'message': 'Ошибка валидации webhook данных',
                    'errors': webhook_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Получаем обработанные данные
            webhook_data = webhook_serializer.validated_data
            author_info = webhook_serializer.get_author_info(webhook_data)
            
            # Проверяем, есть ли уже запрос с таким media_group_id
            media_group_id = author_info.get('media_group_id')
            if media_group_id:
                # Ищем существующий запрос с таким media_group_id
                existing_request = Request.objects.filter(media_group_id=media_group_id).first()
                if existing_request:
                    # Добавляем медиафайлы к существующему запросу
                    if webhook_data['message'].get('photo'):
                        self._process_images(existing_request, webhook_data['message']['photo'])
                    if webhook_data['message'].get('document'):
                        self._process_documents(existing_request, webhook_data['message']['document'])
                    return Response({
                        'status': 'ok',
                        'request_id': existing_request.id,
                        'message': f'Медиафайлы добавлены к существующему запросу {existing_request.id}'
                    })
            
            # Проверяем на дубликаты ТОЛЬКО для новых запросов (не для медиагрупп)
            request_text = author_info.get('text', '')
            logger.info(f"Проверяем на дубликаты текст: '{request_text[:100]}...'")
            duplicate_info = duplicate_detector.get_duplicate_info(request_text)
            logger.info(f"Результат проверки дубликатов: {duplicate_info is not None}")
            
            if duplicate_info:
                # Найден дубликат - возвращаем предупреждение
                return Response({
                    'status': 'duplicate',
                    'message': f'Похожий запрос уже существует (ID: {duplicate_info["duplicate_id"]}, схожесть: {duplicate_info["similarity"]:.1%})',
                    'duplicate_info': {
                        'duplicate_id': duplicate_info['duplicate_id'],
                        'duplicate_author': duplicate_info['duplicate_author'],
                        'duplicate_created_at': duplicate_info['duplicate_created_at'].isoformat(),
                        'similarity': duplicate_info['similarity'],
                        'text_preview': duplicate_info['duplicate_text_preview']
                    }
                }, status=status.HTTP_409_CONFLICT)
            
            # Создаем новый запрос
            request_serializer = RequestCreateSerializer(data=author_info)
            if request_serializer.is_valid():
                request_obj = request_serializer.save()
                
                # Обрабатываем изображения, если есть
                if webhook_data.get('message', {}).get('photo'):
                    self._process_images(request_obj, webhook_data['message']['photo'])
                
                # Обрабатываем документы, если есть
                if webhook_data.get('message', {}).get('document'):
                    self._process_documents(request_obj, webhook_data['message']['document'])
                
                return Response({
                    'status': 'ok',
                    'request_id': request_obj.id,
                    'message': 'Запрос успешно создан'
                })
            else:
                return Response({
                    'status': 'error',
                    'message': 'Ошибка создания запроса',
                    'errors': request_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (ValueError, TypeError, KeyError) as e:
            # Обрабатываем ошибки парсинга JSON и валидации
            return Response({
                'status': 'error',
                'message': 'Некорректные данные запроса'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Ошибка обработки webhook: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _process_images(self, request_obj, photo_data):
        """Обработка изображений из Telegram"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            logger.info(f"Обрабатываем {len(photo_data)} изображений для запроса {request_obj.id}")
            logger.info(f"BOT_TOKEN в окружении: {os.getenv('BOT_TOKEN', 'НЕ НАЙДЕН')}")
            
            # Инициализируем сервис для работы с Telegram
            telegram_service = TelegramFileService()
            
            # Обрабатываем все фотографии в сообщении
            for i, photo in enumerate(photo_data):
                file_id = photo.get('file_id')
                file_size = photo.get('file_size', 0)
                logger.info(f"Обрабатываем изображение {i+1}/{len(photo_data)}: {file_id}, размер: {file_size}")
                if file_id:
                    # Скачиваем и сохраняем изображение
                    request_image = telegram_service.save_image_from_telegram(file_id, request_obj)
                    if request_image:
                        # Обновляем размер файла из данных Telegram
                        request_image.file_size = file_size
                        request_image.save()
                        logger.info(f"Изображение {file_id} успешно сохранено, размер: {file_size}")
                    else:
                        logger.error(f"Не удалось сохранить изображение {file_id}")
                        
        except Exception as e:
            # Логируем ошибку, но не прерываем создание запроса
            logger.error(f"Ошибка при обработке изображений: {e}")
    
    def _process_documents(self, request_obj, document_data):
        """Обработка документов из Telegram"""
        try:
            # Инициализируем сервис для работы с Telegram
            telegram_service = TelegramFileService()
            
            # Скачиваем и сохраняем документ
            file_id = document_data.get('file_id')
            if file_id:
                request_file = telegram_service.save_document_from_telegram(file_id, document_data, request_obj)
                if request_file:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.info(f"Документ {file_id} успешно обработан")
                        
        except Exception as e:
            # Логируем ошибку, но не прерываем создание запроса
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Ошибка при обработке документов: {e}")

    @action(detail=True, methods=['get'], url_path='text')
    def get_request_text(self, request, pk=None):
        """Получить текст запроса для анализа"""
        try:
            request_obj = self.get_object()
            return Response({
                'id': request_obj.id,
                'text': request_obj.text,
                'author_name': request_obj.author_name,
                'created_at': request_obj.created_at,
                'original_created_at': request_obj.original_created_at,
            })
        except Exception as e:
            return Response({
                'error': f'Ошибка получения текста запроса: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)