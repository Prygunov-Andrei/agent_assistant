#!/usr/bin/env python3
"""
Telegram бот для получения запросов от кастинг-директоров
"""

import os
import logging
import requests
from datetime import datetime
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.error import TelegramError
from dotenv import load_dotenv

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

class CastingAgencyBot:
    def __init__(self):
        self.api_base = API_BASE_URL
        self.application = None
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик команды /start"""
        user = update.effective_user
        welcome_message = f"""
🎬 Добро пожаловать в бот Актерского агента, {user.first_name}!

Этот бот предназначен для отправки запросов кастинг-директоров.

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
• Необработанных: {stats.get('pending', 0)}
• Обработанных: {stats.get('processed', 0)}

🕐 Время: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}
                """
            else:
                status_message = "⚠️ API недоступен, но бот работает"
        except Exception as e:
            status_message = f"⚠️ Ошибка подключения к API: {str(e)}"
            
        await update.message.reply_text(status_message)
        
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик всех сообщений (текст и изображения)"""
        user = update.effective_user
        message = update.message
        
        # Проверяем, является ли сообщение пересланным
        if message.forward_from or message.forward_from_chat:
            # Это пересланное сообщение - используем оригинального автора, но сохраняем ID того, кто переслал для уведомлений
            if message.forward_from:
                # Переслано от пользователя
                original_user = message.forward_from
                author_name = f"{original_user.first_name or ''} {original_user.last_name or ''}".strip()
                if not author_name:
                    author_name = original_user.username or f"User_{original_user.id}"
                # Для уведомлений используем ID того, кто переслал
                telegram_user_id = user.id
            else:
                # Переслано из чата/канала
                original_chat = message.forward_from_chat
                author_name = original_chat.title or f"Chat_{original_chat.id}"
                # Для уведомлений используем ID того, кто переслал
                telegram_user_id = user.id
        else:
            # Обычное сообщение
            author_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
            if not author_name:
                author_name = user.username or f"User_{user.id}"
            telegram_user_id = user.id
            
        # Определяем текст сообщения и наличие изображений
        message_text = ""
        has_images = False
        
        if message.text:
            message_text = message.text
        elif message.caption:
            message_text = message.caption
        else:
            message_text = "[Сообщение без текста]"
            
        # Проверяем наличие изображений
        if message.photo:
            has_images = True
            message_text += f"\n\n[Прикреплено {len(message.photo)} изображений]"
        
        # Подготавливаем данные для API
        request_data = {
            "text": message_text,
            "author": author_name,
            "telegram_user_id": telegram_user_id,
            "telegram_message_id": message.message_id,
            "has_images": has_images
        }
        
        try:
            # Отправляем запрос через webhook
            webhook_data = {
                "message": {
                    "from": {
                        "id": telegram_user_id,
                        "username": user.username,
                        "first_name": user.first_name,
                        "last_name": user.last_name
                    },
                    "message_id": message.message_id,
                    "text": message_text,
                    "photo": [{"file_id": photo.file_id, "file_size": photo.file_size} for photo in message.photo] if message.photo else None
                }
            }
            
            response = requests.post(
                f"{self.api_base}/telegram/webhook/",
                json=webhook_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                # Успешно обработан через webhook
                response_data = response.json()
                if response_data.get('status') == 'ok':
                    if message.forward_from or message.forward_from_chat:
                        await message.reply_text(
                            f"✅ Запрос от {author_name} успешно отправлен и будет обработан в ближайшее время!",
                            reply_to_message_id=message.message_id
                        )
                    else:
                        await message.reply_text(
                            "✅ Ваш запрос успешно отправлен и будет обработан в ближайшее время!",
                            reply_to_message_id=message.message_id
                        )
                    logger.info(f"Запрос создан от пользователя {telegram_user_id} ({author_name})")
                
            else:
                # Ошибка API
                error_text = f"❌ Ошибка при отправке запроса. Код: {response.status_code}"
                try:
                    error_data = response.json()
                    if 'detail' in error_data:
                        error_text += f"\nДетали: {error_data['detail']}"
                except:
                    pass
                    
                await message.reply_text(error_text)
                logger.error(f"Ошибка API при создании запроса: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            # Ошибка сети
            await message.reply_text(
                "❌ Ошибка подключения к серверу. Попробуйте позже.",
                reply_to_message_id=message.message_id
            )
            logger.error(f"Ошибка сети при создании запроса: {str(e)}")
            
        except Exception as e:
            # Общая ошибка
            await message.reply_text(
                "❌ Произошла неожиданная ошибка. Попробуйте позже.",
                reply_to_message_id=message.message_id
            )
            logger.error(f"Неожиданная ошибка при создании запроса: {str(e)}")
    
    async def _save_images(self, request_id: int, photos):
        """Сохранение изображений из Telegram в нашу систему"""
        try:
            for photo in photos:
                # Получаем файл от Telegram
                file = await self.application.bot.get_file(photo.file_id)
                
                # Скачиваем изображение
                file_url = f"https://api.telegram.org/file/bot{self.bot_token}/{file.file_path}"
                image_response = requests.get(file_url, timeout=30)
                
                if image_response.status_code == 200:
                    # Отправляем изображение в наш API
                    files = {'image': image_response.content}
                    data = {
                        'request': request_id,
                        'telegram_file_id': photo.file_id
                    }
                    
                    image_response = requests.post(
                        f"{self.api_base}/request-images/",
                        files=files,
                        data=data,
                        timeout=30
                    )
                    
                    if image_response.status_code == 201:
                        logger.info(f"Изображение сохранено для запроса {request_id}")
                    else:
                        logger.error(f"Ошибка сохранения изображения: {image_response.status_code}")
                else:
                    logger.error(f"Ошибка загрузки изображения от Telegram: {image_response.status_code}")
                    
        except Exception as e:
            logger.error(f"Ошибка при сохранении изображений: {str(e)}")
    
    async def send_reaction(self, chat_id: int, message_id: int, emoji: str = "✅"):
        """Отправка реакции на сообщение"""
        try:
            if self.application:
                await self.application.bot.set_message_reaction(
                    chat_id=chat_id,
                    message_id=message_id,
                    reaction=[{"type": "emoji", "emoji": emoji}]
                )
                logger.info(f"Реакция {emoji} отправлена на сообщение {message_id} в чат {chat_id}")
                return True
        except TelegramError as e:
            logger.error(f"Ошибка при отправке реакции: {str(e)}")
        except Exception as e:
            logger.error(f"Неожиданная ошибка при отправке реакции: {str(e)}")
        return False
    
    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Обработчик ошибок"""
        logger.error(f"Ошибка при обработке обновления: {context.error}")
        
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
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        self.application.add_handler(MessageHandler(filters.PHOTO, self.handle_message))
        
        # Добавляем обработчик ошибок
        self.application.add_error_handler(self.error_handler)
        
        # Запускаем бота
        logger.info("Запуск бота...")
        self.application.run_polling()

def main():
    """Главная функция"""
    bot = CastingAgencyBot()
    bot.run_bot()

if __name__ == '__main__':
    main()
