from rest_framework import serializers
from core.serializers import BaseModelSerializer, BaseListSerializer
from .models import Request, RequestImage, RequestFile
from datetime import datetime
import pytz


class RequestImageSerializer(BaseModelSerializer):
    """Сериализатор для изображений запросов"""
    
    file_size_mb = serializers.ReadOnlyField(help_text="Размер файла в мегабайтах")
    
    class Meta(BaseModelSerializer.Meta):
        model = RequestImage
        fields = BaseModelSerializer.Meta.fields + [
            'request', 'image', 'telegram_file_id', 'file_size', 
            'caption', 'file_size_mb'
        ]
        read_only_fields = BaseModelSerializer.Meta.read_only_fields + ['file_size_mb']


class RequestFileSerializer(BaseModelSerializer):
    """Сериализатор для файлов запросов"""
    
    file_size_mb = serializers.ReadOnlyField(help_text="Размер файла в мегабайтах")
    
    class Meta(BaseModelSerializer.Meta):
        model = RequestFile
        fields = BaseModelSerializer.Meta.fields + [
            'request', 'file', 'original_filename', 'file_size', 
            'mime_type', 'telegram_file_id', 'file_size_mb'
        ]
        read_only_fields = BaseModelSerializer.Meta.read_only_fields + ['file_size_mb']


class RequestListSerializer(BaseListSerializer):
    """Сериализатор для списка запросов"""
    
    agent_name = serializers.ReadOnlyField(source='agent.get_full_name', help_text="Имя агента")
    images_count = serializers.ReadOnlyField(source='images.count', help_text="Количество изображений")
    files_count = serializers.ReadOnlyField(source='files.count', help_text="Количество файлов")
    images = RequestImageSerializer(many=True, read_only=True, help_text="Изображения запроса")
    files = RequestFileSerializer(many=True, read_only=True, help_text="Файлы запроса")
    
    class Meta(BaseListSerializer.Meta):
        model = Request
        fields = BaseListSerializer.Meta.fields + [
            'text', 'author_name', 'sender_telegram_id', 'telegram_message_id',
            'telegram_chat_id', 'has_images', 'has_files', 'has_media',
            'original_created_at', 'status', 'agent', 'agent_name', 'processed_at',
            'is_forwarded', 'images_count', 'files_count', 'images', 'files'
        ]
        read_only_fields = fields


class RequestSerializer(BaseModelSerializer):
    """Сериализатор для детального просмотра запроса"""
    
    agent_name = serializers.ReadOnlyField(source='agent.get_full_name', help_text="Имя агента")
    images = RequestImageSerializer(many=True, read_only=True, help_text="Изображения запроса")
    files = RequestFileSerializer(many=True, read_only=True, help_text="Файлы запроса")
    images_count = serializers.ReadOnlyField(source='images.count', help_text="Количество изображений")
    files_count = serializers.ReadOnlyField(source='files.count', help_text="Количество файлов")
    
    class Meta(BaseModelSerializer.Meta):
        model = Request
        fields = BaseModelSerializer.Meta.fields + [
            'text', 'author_name', 'author_telegram_id', 'sender_telegram_id',
            'telegram_message_id', 'telegram_chat_id', 'media_group_id',
            'has_images', 'has_files', 'has_media', 'original_created_at',
            'status', 'agent', 'agent_name', 'processed_at', 'response_text',
            'is_forwarded', 'images', 'files', 'images_count', 'files_count'
        ]
        read_only_fields = BaseModelSerializer.Meta.read_only_fields + [
            'author_name', 'author_telegram_id', 'sender_telegram_id',
            'telegram_message_id', 'telegram_chat_id', 'media_group_id',
            'has_images', 'has_files', 'original_created_at', 'is_forwarded',
            'images', 'files', 'images_count', 'files_count', 'agent_name'
        ]


class RequestCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания запроса (webhook)"""
    
    class Meta:
        model = Request
        fields = [
            'text', 'author_name', 'author_telegram_id', 'sender_telegram_id',
            'telegram_message_id', 'telegram_chat_id', 'media_group_id',
            'has_images', 'has_files', 'original_created_at'
        ]


class RequestResponseSerializer(serializers.ModelSerializer):
    """Сериализатор для ответа на запрос"""
    
    class Meta:
        model = Request
        fields = ['status', 'response_text', 'processed_at']
        
    def update(self, instance, validated_data):
        """Обновление запроса с ответом"""
        # Устанавливаем агента, если он не был установлен
        if not instance.agent and self.context.get('request'):
            instance.agent = self.context['request'].user
            
        # Устанавливаем дату обработки, если статус меняется на in_progress
        if validated_data.get('status') == 'in_progress' and not instance.processed_at:
            from django.utils import timezone
            validated_data['processed_at'] = timezone.now()
            
        return super().update(instance, validated_data)


class RequestStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для изменения статуса запроса"""
    
    class Meta:
        model = Request
        fields = ['status']
        
    def update(self, instance, validated_data):
        """Обновление статуса запроса"""
        # Устанавливаем агента, если он не был установлен
        if not instance.agent and self.context.get('request'):
            instance.agent = self.context['request'].user
            
        # Устанавливаем дату обработки для определенных статусов
        new_status = validated_data.get('status')
        if new_status in ['in_progress', 'completed'] and not instance.processed_at:
            from django.utils import timezone
            validated_data['processed_at'] = timezone.now()
            
        return super().update(instance, validated_data)


class TelegramWebhookDataSerializer(serializers.Serializer):
    """Сериализатор для валидации данных webhook от Telegram"""
    
    message = serializers.DictField()
    
    def validate(self, data):
        message = data.get('message', {})
        if not message:
            raise serializers.ValidationError("Message is required")
        
        # Проверяем обязательные поля сообщения
        if not message.get('message_id'):
            raise serializers.ValidationError("message.message_id is required")
        if not message.get('from'):
            raise serializers.ValidationError("message.from is required")
        if not message.get('chat'):
            raise serializers.ValidationError("message.chat is required")
        if not message.get('date'):
            raise serializers.ValidationError("message.date is required")
        
        # Пустые сообщения разрешены - они будут обработаны с дефолтным текстом
        
        return data
    
    def get_author_info(self, data):
        """Извлекает информацию об авторе сообщения"""
        message = data.get('message', {})
        from_user = message.get('from', {})
        
        # Определяем оригинального автора сообщения
        if message.get('forward_from'):
            # Переслано от пользователя
            forward_from = message['forward_from']
            author_id = forward_from.get('id')
            author_first_name = forward_from.get('first_name', '')
            author_last_name = forward_from.get('last_name', '')
            author_username = forward_from.get('username', '')
            author_name = f"{author_first_name} {author_last_name}".strip()
            if not author_name:
                author_name = author_username or f"User_{author_id}"
        elif message.get('forward_from_chat'):
            # Переслано из канала/чата
            forward_from_chat = message['forward_from_chat']
            author_id = forward_from_chat.get('id')
            author_name = forward_from_chat.get('title') or f"Chat_{author_id}"
        else:
            # Обычное сообщение
            author_id = from_user.get('id')
            author_first_name = from_user.get('first_name', '')
            author_last_name = from_user.get('last_name', '')
            author_username = from_user.get('username', '')
            author_name = f"{author_first_name} {author_last_name}".strip()
            if not author_name:
                author_name = author_username or f"User_{author_id}"
        
        # Получаем media_group_id
        media_group_id = message.get('media_group_id')
        
        return {
            'author_name': author_name,
            'author_telegram_id': author_id,
            'sender_telegram_id': from_user.get('id'),  # ID того, кто отправил сообщение (переслал или написал)
            'telegram_message_id': message.get('message_id'),
            'telegram_chat_id': message.get('chat', {}).get('id'),
            'media_group_id': message.get('media_group_id'),
            'has_images': bool(message.get('photo')),
            'has_files': bool(message.get('document')),
            'text': message.get('text') or message.get('caption') or "[Сообщение без текста]",
            'original_created_at': datetime.fromtimestamp(message['date'], tz=pytz.utc) if message.get('date') else None
        }