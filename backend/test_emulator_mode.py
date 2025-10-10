#!/usr/bin/env python
"""
Скрипт для проверки работы LLM в режиме эмулятора
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

from llm.services import LLMEmulatorService
import json


def main():
    """Главная функция для проверки эмулятора"""
    
    print("=" * 80)
    print("🧪 ПРОВЕРКА РАБОТЫ LLM ЭМУЛЯТОРА")
    print("=" * 80)
    print()
    
    # Инициализируем эмулятор
    print("1️⃣  Инициализация эмулятора...")
    emulator = LLMEmulatorService()
    print("✅ Эмулятор инициализирован")
    print()
    
    # Тестовый запрос
    test_request = {
        'id': 'test-emulator-001',
        'text': '''
Кастинг для фильма "Осенние мечты"

Требуются актеры:
1. Главная героиня - женщина 25-30 лет, брюнетка, драматическая роль
2. Главный герой - мужчина 30-35 лет, спортивное телосложение

Съемки: Москва, март 2025
Гонорар: от 50000 руб/съемочный день

Контакты:
Кастинг-директор: Анна Петрова (anna@casting.ru)
Режиссер: Иван Сидоров (ivan@director.com)
        ''',
        'author_name': 'Анна Петрова',
        'created_at': '2024-01-15T10:00:00'
    }
    
    # Тестовые артисты
    test_artists = [
        {'id': 1, 'name': 'Иван Иванов', 'gender': 'male', 'age': 32},
        {'id': 2, 'name': 'Мария Петрова', 'gender': 'female', 'age': 27},
        {'id': 3, 'name': 'Алексей Смирнов', 'gender': 'male', 'age': 28},
    ]
    
    print("2️⃣  Анализ запроса через эмулятор...")
    print()
    
    try:
        result = emulator.analyze_request(test_request, test_artists)
        
        print("✅ Анализ выполнен успешно!")
        print()
        print("=" * 80)
        print("📊 РЕЗУЛЬТАТ АНАЛИЗА:")
        print("=" * 80)
        print()
        
        project = result.get('project_analysis', {})
        
        # Информация о проекте
        print("🎬 ПРОЕКТ:")
        print(f"   Название: {project.get('project_title', 'Н/Д')}")
        print(f"   Тип: {project.get('project_type', 'Н/Д')}")
        print(f"   Жанр: {project.get('genre', 'Н/Д')}")
        print(f"   Описание: {project.get('description', 'Н/Д')[:80]}...")
        print(f"   Дата премьеры: {project.get('premiere_date', 'Н/Д')}")
        print(f"   Уверенность: {project.get('confidence', 0) * 100:.1f}%")
        print()
        
        # Роли
        roles = project.get('roles', [])
        print(f"🎭 РОЛИ ({len(roles)}):")
        for i, role in enumerate(roles, 1):
            print(f"\n   Роль {i}:")
            print(f"   ├─ Тип: {role.get('role_type', 'Н/Д')}")
            print(f"   ├─ Персонаж: {role.get('character_name', 'Н/Д')}")
            print(f"   ├─ Описание: {role.get('description', 'Н/Д')[:60]}...")
            print(f"   ├─ Возраст: {role.get('age_range', 'Н/Д')} ({role.get('age_min', 'Н/Д')}-{role.get('age_max', 'Н/Д')})")
            print(f"   ├─ Пол: {role.get('gender_display', 'Н/Д')} ({role.get('gender', 'Н/Д')})")
            print(f"   ├─ Медийность: {role.get('media_presence', 'Н/Д')}")
            print(f"   ├─ Рост: {role.get('height', 'Н/Д')}")
            print(f"   ├─ Телосложение: {role.get('body_type', 'Н/Д')}")
            print(f"   ├─ Волосы: {role.get('hair_color', 'Н/Д')} ({role.get('hairstyle', 'Н/Д')})")
            print(f"   ├─ Глаза: {role.get('eye_color', 'Н/Д')}")
            print(f"   ├─ Размер одежды: {role.get('clothing_size', 'Н/Д')}")
            print(f"   ├─ Размер обуви: {role.get('shoe_size', 'Н/Д')}")
            print(f"   ├─ Национальность: {role.get('nationality', 'Н/Д')}")
            print(f"   ├─ Гонорар за смену: {role.get('rate_per_shift', 'Н/Д')}")
            print(f"   ├─ Даты съемок: {role.get('shooting_dates', 'Н/Д')}")
            print(f"   ├─ Локация: {role.get('shooting_location', 'Н/Д')}")
            print(f"   ├─ Условия оплаты: {role.get('rate_conditions', 'Н/Д')}")
            print(f"   ├─ Референс: {role.get('reference_text', 'Н/Д')[:50]}...")
            print(f"   ├─ Спец. условия: {role.get('special_conditions', 'Н/Д')[:50]}...")
            print(f"   ├─ Требования к пробам: {role.get('audition_requirements', 'Н/Д')[:50]}...")
            print(f"   └─ Уверенность: {role.get('confidence', 0) * 100:.1f}%")
        
        print()
        
        # Контакты
        contacts = result.get('contacts', {})
        print("📞 КОНТАКТЫ:")
        
        # Кастинг-директор
        cd = contacts.get('casting_director', {})
        print(f"\n   Кастинг-директор:")
        print(f"   ├─ Имя: {cd.get('name', 'Н/Д')}")
        print(f"   ├─ Email: {cd.get('email', 'Н/Д')}")
        print(f"   ├─ Телефон: {cd.get('phone', 'Н/Д')}")
        print(f"   ├─ Telegram: {cd.get('telegram', 'Н/Д')}")
        print(f"   └─ Уверенность: {cd.get('confidence', 0) * 100:.1f}%")
        
        # Режиссер
        director = contacts.get('director', {})
        print(f"\n   Режиссер:")
        print(f"   ├─ Имя: {director.get('name', 'Н/Д')}")
        print(f"   ├─ Email: {director.get('email', 'Н/Д')}")
        print(f"   ├─ Телефон: {director.get('phone', 'Н/Д')}")
        print(f"   ├─ Telegram: {director.get('telegram', 'Н/Д')}")
        print(f"   └─ Уверенность: {director.get('confidence', 0) * 100:.1f}%")
        
        # Продюсеры
        producers = contacts.get('producers', [])
        if producers:
            print(f"\n   Продюсеры ({len(producers)}):")
            for i, producer in enumerate(producers, 1):
                print(f"   {i}. {producer.get('name', 'Н/Д')} ({producer.get('email', 'Н/Д')})")
        
        # Продюсерская компания
        company = contacts.get('production_company', {})
        print(f"\n   Продюсерская компания:")
        print(f"   ├─ Название: {company.get('name', 'Н/Д')}")
        print(f"   ├─ Телефон: {company.get('phone', 'Н/Д')}")
        print(f"   ├─ Email: {company.get('email', 'Н/Д')}")
        print(f"   ├─ Сайт: {company.get('website', 'Н/Д')}")
        print(f"   └─ Уверенность: {company.get('confidence', 0) * 100:.1f}%")
        
        print()
        print("=" * 80)
        print("📈 МЕТАДАННЫЕ:")
        print(f"   Общая уверенность: {result.get('confidence', 0) * 100:.1f}%")
        print(f"   Время обработки: {result.get('processing_time', 0):.3f}с")
        print(f"   Использован эмулятор: {result.get('used_emulator', False)}")
        print("=" * 80)
        print()
        
        # Сохраняем результат в файл для просмотра
        output_file = backend_path / 'emulator_test_result.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Полный результат сохранен в: {output_file}")
        print()
        
        print("=" * 80)
        print("✅ ЭМУЛЯТОР РАБОТАЕТ КОРРЕКТНО!")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при работе эмулятора: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Проверка прервана пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

