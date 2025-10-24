#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы MTProto клиента
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Добавляем путь к проекту
sys.path.append('/app')

# Загружаем переменные окружения
load_dotenv()

async def test_mtproto_client():
    """Тестирует работу MTProto клиента"""
    try:
        from telegram_requests.mtproto_client import mtproto_client
        
        print("🔧 Инициализация MTProto клиента...")
        
        # Проверяем настройки
        api_id = os.getenv('TELEGRAM_API_ID')
        api_hash = os.getenv('TELEGRAM_API_HASH')
        phone = os.getenv('TELEGRAM_PHONE')
        
        if not api_id:
            print("❌ TELEGRAM_API_ID не установлен")
            return False
        if not api_hash:
            print("❌ TELEGRAM_API_HASH не установлен")
            return False
        if not phone:
            print("❌ TELEGRAM_PHONE не установлен")
            return False
            
        print(f"✅ Настройки найдены:")
        print(f"   API ID: {api_id}")
        print(f"   Phone: {phone}")
        
        # Запускаем клиент
        print("🚀 Запуск MTProto клиента...")
        started = await mtproto_client.start()
        
        if started:
            print("✅ MTProto клиент успешно запущен!")
            
            # Тестируем получение информации о чате
            print("🔍 Тестирование получения информации о чате...")
            chat_info = await mtproto_client.get_chat_info(-1001234567890)  # Тестовый ID
            if chat_info:
                print(f"✅ Информация о чате получена: {chat_info}")
            else:
                print("ℹ️  Информация о чате не получена (возможно, чат недоступен)")
            
            # Останавливаем клиент
            await mtproto_client.stop()
            print("✅ MTProto клиент остановлен")
            return True
        else:
            print("❌ Не удалось запустить MTProto клиент")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Тестирование MTProto клиента")
    print("=" * 50)
    
    result = asyncio.run(test_mtproto_client())
    
    if result:
        print("\n✅ Тест завершен успешно!")
        print("\n📋 Следующие шаги:")
        print("1. Добавьте переменные в .env файл:")
        print("   TELEGRAM_API_ID=your_api_id")
        print("   TELEGRAM_API_HASH=your_api_hash")
        print("   TELEGRAM_PHONE=+1234567890")
        print("2. Перезапустите бота")
        print("3. Протестируйте пересылку сообщений из каналов")
    else:
        print("\n❌ Тест завершен с ошибками")
        print("Проверьте настройки и попробуйте снова")
