#!/usr/bin/env python3
"""
Улучшенный Telegram бот для получения запросов от пользователей
"""

import os
import logging
import requests
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.error import TelegramError
from dotenv import load_dotenv
import pytz

# Загружаем переменные окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8001/api')
BOT_TOKEN = os.getenv('BOT_TOKEN')
WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'https://your-domain.com/webhook')


class TelegramRequestsBot:
    """Улучшенный бот для обработки запросов"""
    
    def __init__(self):
        self.api_base = API_BASE_URL
        self.application = None
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        user = update.effective_user
        welcome_message = f"""
🎬 Добро пожаловать в бот Актерского агента, {user.first_name}!

Этот бот предназначен для отправки запросов.

📝 Просто отправьте ваше сообщение, и оно будет передано в систему для обработки.

Команды:
/start - показать это сообщение
/help - помощь
/status - проверить статус бота
        """
        await update.message.reply_text(welcome_message)
        
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /help"""
        help_message = """
🆘 Помощь по использованию бота

📝 Отправка запроса:
Просто напишите ваше сообщение в чат. Оно будет автоматически передано в систему.

📋 Что можно отправлять:
• Запросы на поиск актеров
• Описания ролей
• Требования к кастингу
• Фотографии и файлы
• Любые другие сообщения, связанные с кастингом

❓ Если у вас есть вопросы, обратитесь к администратору.
        """
        await update.message.reply_text(help_message)
        
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /status"""
        try:
            # Проверяем доступность API
            response = requests.get(f"{self.api_base}/requests/stats/", timeout=5)
            if response.status_code == 200:
                stats = response.json()
                status_message = f"""
✅ Бот работает нормально

📊 Статистика запросов:
• Всего запросов: {stats.get('total', 0)}
• Ожидают обработки: {stats.get('pending', 0)}
• В обработке: {stats.get('in_progress', 0)}
• Выполнены: {stats.get('completed', 0)}
• Отменены: {stats.get('cancelled', 0)}
• С медиафайлами: {stats.get('with_media', 0)}
• За сегодня: {stats.get('today', 0)}

🕐 Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}
                """
            else:
                status_message = "⚠️ API недоступен, но бот работает"
        except Exception as e:
            status_message = f"⚠️ Ошибка подключения к API: {str(e)}"
            
        await update.message.reply_text(status_message)
        
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик всех сообщений (текст, изображения, файлы)"""
        user = update.effective_user
        message = update.message
        
        # Определяем автора и отправителя
        author_info = self._get_author_info(message, user)
        sender_info = self._get_sender_info(user)
        
        # Обрабатываем контент сообщения
        message_data = await self._process_message_content(message)
        
        # Подготавливаем данные для API
        webhook_data = {
            "message": {
                "from": {
                    "id": author_info['telegram_id'],
                    "username": author_info.get('username'),
                    "first_name": author_info.get('first_name'),
                    "last_name": author_info.get('last_name')
                },
                "message_id": message.message_id,
                "chat": {"id": message.chat_id},
                "text": message_data['text'],
                "date": int(message.date.timestamp()),
                "photo": message_data.get('photo'),
                "document": message_data.get('document'),
                "media_group_id": getattr(message, 'media_group_id', None)
            }
        }
        
        try:
            # Отправляем запрос через webhook
            response = requests.post(
                f"{self.api_base}/webhook/telegram/webhook/",
                json=webhook_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if response_data.get('status') == 'ok':
                    await self._send_success_response(message, author_info, sender_info)
                    logger.info(f"Запрос создан: {response_data.get('request_id')} от {author_info['name']}")
                else:
                    await self._send_error_response(message, "Ошибка обработки запроса")
                    
            else:
                await self._send_error_response(message, f"Ошибка API: {response.status_code}")
                logger.error(f"Ошибка API: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            await self._send_error_response(message, "Ошибка подключения к серверу")
            logger.error(f"Ошибка сети: {str(e)}")
            
        except Exception as e:
            await self._send_error_response(message, "Неожиданная ошибка")
            logger.error(f"Неожиданная ошибка: {str(e)}")
    
    def _get_author_info(self, message, sender):
        """Получает информацию об авторе сообщения"""
        # Проверяем, является ли сообщение пересланным
        if message.forward_from:
            # Переслано от пользователя
            original_user = message.forward_from
            return {
                'telegram_id': original_user.id,
                'name': self._get_user_name(original_user),
                'username': original_user.username,
                'first_name': original_user.first_name,
                'last_name': original_user.last_name,
                'is_forwarded': True
            }
        elif message.forward_from_chat:
            # Переслано из чата/канала
            original_chat = message.forward_from_chat
            return {
                'telegram_id': original_chat.id,
                'name': original_chat.title or f"Chat_{original_chat.id}",
                'username': None,
                'first_name': None,
                'last_name': None,
                'is_forwarded': True
            }
        else:
            # Обычное сообщение
            return {
                'telegram_id': sender.id,
                'name': self._get_user_name(sender),
                'username': sender.username,
                'first_name': sender.first_name,
                'last_name': sender.last_name,
                'is_forwarded': False
            }
    
    def _get_sender_info(self, sender):
        """Получает информацию об отправителе (том, кто переслал)"""
        return {
            'telegram_id': sender.id,
            'name': self._get_user_name(sender),
            'username': sender.username
        }
    
    def _get_user_name(self, user):
        """Формирует имя пользователя"""
        name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        if not name:
            name = user.username or f"User_{user.id}"
        return name
    
    async def _process_message_content(self, message):
        """Обрабатывает контент сообщения"""
        result = {
            'text': '',
            'has_images': False,
            'has_files': False,
            'photo': None,
            'document': None
        }
        
        # Определяем текст
        if message.text:
            result['text'] = message.text
        elif message.caption:
            result['text'] = message.caption
        else:
            result['text'] = '[Сообщение без текста]'
        
        # Обрабатываем изображения
        if message.photo:
            result['has_images'] = True
            result['photo'] = [
                {
                    "file_id": photo.file_id,
                    "file_size": photo.file_size,
                    "width": photo.width,
                    "height": photo.height
                }
                for photo in message.photo
            ]
            if not result['text']:
                result['text'] = '[Прикреплены изображения]'
        
        # Обрабатываем документы
        if message.document:
            result['has_files'] = True
            result['document'] = {
                "file_id": message.document.file_id,
                "file_name": message.document.file_name,
                "file_size": message.document.file_size,
                "mime_type": message.document.mime_type
            }
            if not result['text']:
                result['text'] = f'[Прикреплен файл: {message.document.file_name}]'
        
        return result
    
    async def _send_success_response(self, message, author_info, sender_info):
        """Отправляет ответ об успешной обработке"""
        if author_info['is_forwarded']:
            response_text = (
                f"✅ Запрос от {author_info['name']} "
                f"успешно отправлен и будет обработан в ближайшее время!"
            )
        else:
            response_text = "✅ Ваш запрос успешно отправлен и будет обработан в ближайшее время!"
        
        await message.reply_text(
            response_text,
            reply_to_message_id=message.message_id
        )
    
    async def _send_error_response(self, message, error_text):
        """Отправляет ответ об ошибке"""
        await message.reply_text(
            f"❌ {error_text}. Попробуйте позже.",
            reply_to_message_id=message.message_id
        )
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик ошибок"""
        logger.error(f"Ошибка при обработке обновления: {context.error}")
        
        if update and update.effective_message:
            try:
                await update.effective_message.reply_text(
                    "❌ Произошла ошибка при обработке сообщения. Попробуйте позже."
                )
            except Exception as e:
                logger.error(f"Ошибка при отправке сообщения об ошибке: {str(e)}")
    
    def run_bot(self):
        """Запуск бота"""
        if not BOT_TOKEN:
            logger.error("BOT_TOKEN не установлен!")
            return
            
        # Создаем приложение
        self.application = Application.builder().token(BOT_TOKEN).build()
        
        # Добавляем обработчики
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("status", self.status_command))
        
        # Обработчик текстовых сообщений
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        # Обработчик изображений
        self.application.add_handler(MessageHandler(filters.PHOTO, self.handle_message))
        
        # Обработчик документов
        self.application.add_handler(MessageHandler(filters.Document.ALL, self.handle_message))
        
        # Обработчик медиа групп (альбомы)
        self.application.add_handler(MessageHandler(filters.MediaGroup, self.handle_message))
        
        # Добавляем обработчик ошибок
        self.application.add_error_handler(self.error_handler)
        
        # Запускаем бота
        logger.info("Запуск улучшенного бота...")
        self.application.run_polling()


def main():
    """Главная функция"""
    bot = TelegramRequestsBot()
    bot.run_bot()


if __name__ == '__main__':
    main()
