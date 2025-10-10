#!/usr/bin/env python
"""
Скрипт для проверки подключения к OpenAI API
"""

import os
import sys
import django
from pathlib import Path

# Добавляем backend в путь
backend_path = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_path))

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent_assistant.settings')
django.setup()

from django.conf import settings
from llm.services import LLMService
from llm.openai_service import OpenAIService
import logging

# Настраиваем логирование
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Главная функция для проверки подключения"""
    
    print("=" * 80)
    print("🔍 ПРОВЕРКА ПОДКЛЮЧЕНИЯ К OPENAI API")
    print("=" * 80)
    print()
    
    # Проверяем наличие API ключа
    api_key = settings.OPENAI_API_KEY
    
    print("1️⃣  Проверка наличия API ключа...")
    if not api_key:
        print("❌ OPENAI_API_KEY не установлен в настройках!")
        print("   Пожалуйста, добавьте OPENAI_API_KEY в файл .env")
        return False
    
    print(f"✅ API ключ найден: {api_key[:10]}...{api_key[-4:]}")
    print()
    
    # Проверяем конфигурацию из llm_config.yaml
    print("2️⃣  Проверка конфигурации...")
    try:
        import yaml
        config_path = settings.BASE_DIR / 'llm_config.yaml'
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        use_emulator = config.get('llm', {}).get('use_emulator', True)
        model = config.get('llm', {}).get('model', 'gpt-4o')
        
        print(f"   Режим эмулятора: {use_emulator}")
        print(f"   Модель: {model}")
        
        if use_emulator:
            print("⚠️  ВНИМАНИЕ: В конфиге включен режим эмулятора!")
            print("   Измените use_emulator: false в llm_config.yaml для использования OpenAI")
            print()
    except Exception as e:
        print(f"⚠️  Не удалось прочитать конфиг: {e}")
        print()
    
    # Тестируем прямое подключение к OpenAI
    print("3️⃣  Тестирование прямого подключения к OpenAI API...")
    try:
        openai_service = OpenAIService()
        print(f"✅ OpenAI сервис инициализирован")
        print(f"   Модель: {openai_service.model}")
        print(f"   Temperature: {openai_service.temperature}")
        print(f"   Max tokens: {openai_service.max_tokens}")
        print()
        
        # Тестируем подключение
        print("4️⃣  Отправка тестового запроса к API...")
        connection_ok = openai_service.test_connection()
        
        if connection_ok:
            print("✅ Подключение к OpenAI API успешно!")
            print()
        else:
            print("❌ Не удалось подключиться к OpenAI API")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации OpenAI сервиса: {e}")
        logger.exception("Полная трассировка ошибки:")
        return False
    
    # Тестируем LLMService
    print("5️⃣  Тестирование LLMService...")
    try:
        llm_service = LLMService()
        service_info = llm_service.get_service_info()
        
        print(f"   Используемый сервис: {service_info.get('service', 'неизвестно')}")
        if service_info.get('service') == 'openai':
            print("✅ LLMService настроен на использование OpenAI")
            model_info = service_info.get('model_info', {})
            print(f"   Модель: {model_info.get('model', 'неизвестно')}")
        else:
            print("⚠️  LLMService использует эмулятор")
            print("   Для использования OpenAI установите use_emulator: false в llm_config.yaml")
        print()
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании LLMService: {e}")
        logger.exception("Полная трассировка ошибки:")
        return False
    
    # Тестируем анализ простого запроса
    print("6️⃣  Тестирование анализа запроса...")
    try:
        test_request = {
            'id': 'test-001',
            'text': '''
Кастинг для фильма "Осенние мечты"

Требуются актеры:
1. Главная героиня - женщина 25-30 лет, брюнетка, драматическая роль
2. Главный герой - мужчина 30-35 лет, спортивное телосложение

Съемки: Москва, март 2025
Гонорар: от 50000 руб/съемочный день

Контакты:
Кастинг-директор: Анна Петрова (anna@casting.ru)
            ''',
            'author_name': 'Кастинг-директор',
            'created_at': '2024-01-15T10:00:00'
        }
        
        print("   Отправка запроса на анализ...")
        result = openai_service.analyze_request(test_request, [])
        
        print("✅ Анализ выполнен успешно!")
        print()
        print("📊 Результат анализа:")
        print(f"   Название проекта: {result.get('project_analysis', {}).get('project_title', 'Н/Д')}")
        print(f"   Тип проекта: {result.get('project_analysis', {}).get('project_type', 'Н/Д')}")
        print(f"   Жанр: {result.get('project_analysis', {}).get('genre', 'Н/Д')}")
        print(f"   Количество ролей: {len(result.get('project_analysis', {}).get('roles', []))}")
        print(f"   Модель: {result.get('model', 'Н/Д')}")
        print(f"   Использован эмулятор: {result.get('used_emulator', False)}")
        print()
        
        # Показываем роли
        roles = result.get('project_analysis', {}).get('roles', [])
        if roles:
            print("   Найденные роли:")
            for i, role in enumerate(roles, 1):
                print(f"   {i}. {role.get('character_name', 'Н/Д')} - {role.get('description', 'Н/Д')[:50]}...")
        print()
        
    except Exception as e:
        print(f"❌ Ошибка при анализе запроса: {e}")
        logger.exception("Полная трассировка ошибки:")
        return False
    
    print("=" * 80)
    print("✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!")
    print("🎉 OpenAI API работает корректно и готов к использованию")
    print("=" * 80)
    
    return True


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Проверка прервана пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        logger.exception("Полная трассировка ошибки:")
        sys.exit(1)

