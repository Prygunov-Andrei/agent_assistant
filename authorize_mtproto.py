#!/usr/bin/env python3
"""
Скрипт для первоначальной авторизации MTProto клиента
Запускать локально (не в Docker) для ввода кода подтверждения
"""
import asyncio
import os
from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

async def authorize():
    api_id = os.getenv('TELEGRAM_API_ID')
    api_hash = os.getenv('TELEGRAM_API_HASH')
    phone = os.getenv('TELEGRAM_PHONE')
    
    if not all([api_id, api_hash, phone]):
        print("❌ Не установлены переменные TELEGRAM_API_ID, TELEGRAM_API_HASH или TELEGRAM_PHONE")
        return False
    
    client = TelegramClient('agent_assistant_session', int(api_id), api_hash)
    
    try:
        await client.start(phone=phone)
        print("✅ Авторизация успешна!")
        print("📁 Сессия сохранена в файл 'agent_assistant_session.session'")
        print("📋 Скопируйте этот файл в папку backend/telegram_requests/")
        return True
    except Exception as e:
        print(f"❌ Ошибка авторизации: {e}")
        return False
    finally:
        await client.disconnect()

if __name__ == '__main__':
    print("🔐 Авторизация MTProto клиента")
    print("=" * 40)
    asyncio.run(authorize())
