#!/usr/bin/env python3
"""
Скрипт для запуска Telegram бота
"""

import os
import sys
import django

# Добавляем путь к Django проекту
sys.path.append('/app')

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agent_assistant.settings')
django.setup()

# Теперь можем импортировать бота
from .bot import main

if __name__ == '__main__':
    main()
