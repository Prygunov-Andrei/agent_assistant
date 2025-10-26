"""
MTProto клиент для получения полной информации о пересланных сообщениях
"""
import os
import logging
from typing import Optional, Dict, Any
from telethon import TelegramClient
from telethon.tl.types import Message, User, Channel, Chat
from telethon.errors import SessionPasswordNeededError, FloodWaitError

logger = logging.getLogger(__name__)


class TelegramMTProtoClient:
    """MTProto клиент для работы с Telegram API"""
    
    def __init__(self):
        # Получаем данные из настроек
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        self.phone = os.getenv('TELEGRAM_PHONE')
        self.session_name = 'agent_assistant_session'
        
        # Отключаем MTProto если номер телефона не указан (для безопасности)
        if not self.phone:
            logger.warning("⚠️  TELEGRAM_PHONE не установлен. MTProto клиент отключен.")
            self.client = None
            return
        
        if not all([self.api_id, self.api_hash]):
            logger.error("Не установлены переменные TELEGRAM_API_ID или TELEGRAM_API_HASH")
            self.client = None
            return
            
        # Создаем клиент
        self.client = TelegramClient(
            '/app/sessions/agent_assistant_session',
            int(self.api_id),
            self.api_hash
        )
        
    async def start(self):
        """Запуск клиента"""
        if not self.client:
            return False
            
        try:
            await self.client.start(phone=self.phone)
            logger.info("MTProto клиент успешно запущен")
            return True
        except SessionPasswordNeededError:
            logger.error("Требуется двухфакторная аутентификация. Установите TELEGRAM_PASSWORD")
            return False
        except Exception as e:
            logger.error(f"Ошибка запуска MTProto клиента: {e}")
            return False
    
    async def stop(self):
        """Остановка клиента"""
        if self.client:
            await self.client.disconnect()
            logger.info("MTProto клиент остановлен")
    
    async def get_message_info(self, chat_id: int, message_id: int) -> Optional[Dict[str, Any]]:
        """
        Получает полную информацию о сообщении, включая оригинального автора
        
        Args:
            chat_id: ID чата
            message_id: ID сообщения
            
        Returns:
            Dict с полной информацией о сообщении или None
        """
        logger.info(f"🔍 Получение информации о сообщении: chat_id={chat_id}, message_id={message_id}")
        
        if not self.client:
            logger.error("❌ MTProto клиент не инициализирован")
            return None
            
        try:
            # Получаем entity чата
            logger.info(f"📡 Получение entity для chat_id={chat_id}")
            try:
                entity = await self.client.get_entity(chat_id)
                logger.info(f"✅ Entity получен: {type(entity).__name__}")
            except Exception as e:
                logger.error(f"❌ Не удалось получить entity для chat_id={chat_id}: {e}")
                return None
            
            # Получаем сообщение
            logger.info(f"📨 Получение сообщения через MTProto...")
            message = await self.client.get_messages(entity, ids=message_id)
            if not message:
                logger.warning("❌ Сообщение не найдено")
                return None
                
            logger.info(f"✅ Сообщение получено. Forward: {bool(message.fwd_from)}")
            result = await self._extract_message_info(message)
            logger.info(f"📋 Результат: {result}")
            return result
            
        except FloodWaitError as e:
            logger.warning(f"⏳ FloodWaitError: нужно подождать {e.seconds} секунд")
            return None
        except Exception as e:
            logger.error(f"❌ Ошибка получения информации о сообщении: {e}")
            import traceback
            logger.error(f"📜 Traceback: {traceback.format_exc()}")
            return None
    
    async def _extract_message_info(self, message: Message) -> Dict[str, Any]:
        """Извлекает информацию из сообщения"""
        logger.info(f"🔍 Извлечение информации из сообщения...")
        
        info = {
            'message_id': message.id,
            'text': message.text or message.raw_text or '',
            'date': message.date,
            'is_forwarded': bool(message.fwd_from),
            'original_author': None,
            'original_chat': None,
            'forward_date': None,
        }
        
        # Проверяем автора сообщения (для каналов это может быть скрыто)
        logger.info(f"👤 Поиск автора сообщения...")
        logger.info(f"   message.from_id: {message.from_id}")
        logger.info(f"   message.post_author: {message.post_author}")
        logger.info(f"   message.views: {message.views}")
        logger.info(f"   message.peer_id: {message.peer_id}")
        logger.info(f"   message.reply_to: {message.reply_to}")
        
        # Пытаемся получить автора сообщения
        if message.from_id:
            logger.info(f"👤 Получение информации об авторе сообщения from_id={message.from_id}")
            author = await self._get_user_info(message.from_id)
            if author:
                info['original_author'] = author
                logger.info(f"✅ Автор сообщения найден: {author}")
            else:
                logger.warning("❌ Не удалось получить информацию об авторе сообщения")
        elif message.post_author:
            logger.info(f"📝 Автор поста: {message.post_author}")
            info['original_author'] = {
                'type': 'post_author',
                'name': message.post_author
            }
        else:
            logger.info("ℹ️ Информация об авторе недоступна")
        
        # Если сообщение переслано
        if message.fwd_from:
            logger.info(f"🔄 Сообщение переслано!")
            logger.info(f"   fwd_from.from_id: {message.fwd_from.from_id}")
            logger.info(f"   fwd_from.from_name: {message.fwd_from.from_name}")
            logger.info(f"   fwd_from.date: {message.fwd_from.date}")
            
            info['forward_date'] = message.fwd_from.date
            
            # Получаем информацию об оригинальном авторе
            if message.fwd_from.from_id:
                logger.info(f"👤 Получение информации о пользователе from_id={message.fwd_from.from_id}")
                original_author = await self._get_user_info(message.fwd_from.from_id)
                if original_author:
                    info['original_author'] = original_author
                    logger.info(f"✅ Автор найден: {original_author}")
                else:
                    logger.warning("❌ Не удалось получить информацию об авторе")
            
            # Получаем информацию об оригинальном чате
            if message.fwd_from.from_name:
                logger.info(f"📢 Оригинальный чат: {message.fwd_from.from_name}")
                info['original_chat'] = {
                    'name': message.fwd_from.from_name,
                    'type': 'channel'  # Предполагаем, что это канал
                }
        else:
            logger.info("ℹ️ Сообщение не переслано")
        
        logger.info(f"📋 Итоговая информация: {info}")
        return info
    
    async def _get_user_info(self, user_id) -> Optional[Dict[str, Any]]:
        """Получает информацию о пользователе"""
        try:
            user = await self.client.get_entity(user_id)
            
            if isinstance(user, User):
                return {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'username': user.username,
                    'phone': user.phone,
                    'type': 'user'
                }
            elif isinstance(user, (Channel, Chat)):
                return {
                    'id': user.id,
                    'title': user.title,
                    'username': getattr(user, 'username', None),
                    'type': 'channel' if isinstance(user, Channel) else 'chat'
                }
                
        except Exception as e:
            logger.error(f"Ошибка получения информации о пользователе {user_id}: {e}")
            
        return None
    
    async def get_user_info_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Получает информацию о пользователе по ID"""
        if not self.client:
            return None
            
        try:
            logger.info(f"🔍 Получение информации о пользователе: user_id={user_id}")
            
            # Сначала пробуем получить entity
            try:
                user = await self.client.get_entity(user_id)
                
                if isinstance(user, User):
                    user_info = {
                        'id': user.id,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'username': user.username,
                        'phone': user.phone,
                        'type': 'user'
                    }
                    logger.info(f"✅ Информация о пользователе получена через get_entity: {user_info}")
                    return user_info
                else:
                    logger.warning(f"❌ Entity {user_id} не является пользователем: {type(user)}")
                    
            except Exception as e:
                logger.warning(f"⚠️ get_entity не сработал для {user_id}: {e}")
                
                # Пробуем альтернативный способ - поиск по username или другим методам
                try:
                    # Попробуем найти пользователя через поиск
                    logger.info(f"🔍 Попытка найти пользователя {user_id} через альтернативные методы...")
                    
                    # Если у нас есть access_hash, попробуем GetFullUser
                    from telethon.tl.functions.users import GetFullUser
                    from telethon.tl.types import InputUser
                    
                    # Пробуем с нулевым access_hash (может сработать для некоторых случаев)
                    try:
                        full_user = await self.client(GetFullUser(user=InputUser(user_id=user_id, access_hash=0)))
                        if full_user and full_user.user:
                            user_info = {
                                'id': full_user.user.id,
                                'first_name': full_user.user.first_name,
                                'last_name': full_user.user.last_name,
                                'username': full_user.user.username,
                                'phone': full_user.user.phone,
                                'type': 'user'
                            }
                            logger.info(f"✅ Информация о пользователе получена через GetFullUser: {user_info}")
                            return user_info
                    except Exception as e2:
                        logger.warning(f"⚠️ GetFullUser не сработал для {user_id}: {e2}")
                    
                except Exception as e3:
                    logger.warning(f"⚠️ Альтернативные методы не сработали для {user_id}: {e3}")
                
        except Exception as e:
            logger.error(f"❌ Ошибка получения информации о пользователе {user_id}: {e}")
            
        return None

    async def get_chat_info(self, chat_id: int) -> Optional[Dict[str, Any]]:
        """Получает информацию о чате"""
        if not self.client:
            return None
            
        try:
            chat = await self.client.get_entity(chat_id)
            
            if isinstance(chat, (Channel, Chat)):
                return {
                    'id': chat.id,
                    'title': chat.title,
                    'username': getattr(chat, 'username', None),
                    'type': 'channel' if isinstance(chat, Channel) else 'chat'
                }
                
        except Exception as e:
            logger.error(f"Ошибка получения информации о чате {chat_id}: {e}")
            
        return None


# Глобальный экземпляр клиента
mtproto_client = TelegramMTProtoClient()
