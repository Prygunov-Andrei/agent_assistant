#!/usr/bin/env python3
"""
Скрипт для исправления всех импортов в тестах
"""

import os
import re

def fix_imports_in_file(file_path):
    """Исправляет импорты в файле теста"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем относительные импорты на абсолютные
    replacements = [
        # Artists
        (r'from \.\.models import', 'from artists.models import'),
        (r'from \.\.views import', 'from artists.views import'),
        (r'from \.\.serializers import', 'from artists.serializers import'),
        (r'from \.\.factories import', 'from tests.unit.artists.factories import'),
        
        # Companies
        (r'from \.\.models import', 'from companies.models import'),
        (r'from \.\.views import', 'from companies.views import'),
        (r'from \.\.serializers import', 'from companies.serializers import'),
        (r'from \.\.factories import', 'from tests.unit.companies.factories import'),
        
        # Projects
        (r'from \.\.models import', 'from projects.models import'),
        (r'from \.\.views import', 'from projects.views import'),
        (r'from \.\.serializers import', 'from projects.serializers import'),
        (r'from \.\.factories import', 'from tests.unit.projects.factories import'),
        
        # People
        (r'from \.\.models import', 'from people.models import'),
        (r'from \.\.views import', 'from people.views import'),
        (r'from \.\.serializers import', 'from people.serializers import'),
        (r'from \.\.factories import', 'from tests.unit.people.factories import'),
        
        # Users
        (r'from \.\.models import', 'from users.models import'),
        (r'from \.\.views import', 'from users.views import'),
        (r'from \.\.serializers import', 'from users.serializers import'),
        (r'from \.\.factories import', 'from tests.unit.users.factories import'),
        
        # Telegram requests
        (r'from \.\.models import', 'from telegram_requests.models import'),
        (r'from \.\.views import', 'from telegram_requests.views import'),
        (r'from \.\.serializers import', 'from telegram_requests.serializers import'),
        (r'from \.\.factories import', 'from tests.unit.telegram_requests.factories import'),
        (r'from \.\.services import', 'from telegram_requests.services import'),
        (r'from \.\.bot import', 'from telegram_requests.bot import'),
        
        # Core
        (r'from \.\.models import', 'from core.models import'),
        (r'from \.\.permissions import', 'from core.permissions import'),
        (r'from \.\.mixins import', 'from core.mixins import'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in {file_path}")
        return True
    return False

def main():
    """Основная функция"""
    tests_dir = "tests/unit"
    fixed_files = 0
    
    for root, dirs, files in os.walk(tests_dir):
        for file in files:
            if file.endswith('.py') and file != '__init__.py':
                file_path = os.path.join(root, file)
                if fix_imports_in_file(file_path):
                    fixed_files += 1
    
    print(f"Fixed imports in {fixed_files} files")

if __name__ == "__main__":
    main()
