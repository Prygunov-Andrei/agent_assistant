#!/usr/bin/env python3
"""
Скрипт для исправления импортов в тестах после реорганизации
"""

import os
import re

def fix_imports_in_file(file_path):
    """Исправляет импорты в файле теста"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем импорты
    replacements = [
        # Исправляем импорты из tests.unit.*
        (r'from tests\.unit\.models import', 'from core.models import'),
        (r'from tests\.unit\.permissions import', 'from core.permissions import'),
        (r'from tests\.unit\.mixins import', 'from core.mixins import'),
        
        # Исправляем импорты из users.tests
        (r'from users\.tests\.factories import', 'from tests.unit.users.factories import'),
        (r'from users\.tests\.test_models import', 'from tests.unit.users.test_models import'),
        
        # Исправляем импорты из telegram_requests.tests
        (r'from telegram_requests\.tests\.factories import', 'from tests.unit.telegram_requests.factories import'),
        
        # Исправляем импорты из artists.tests
        (r'from artists\.tests\.factories import', 'from tests.unit.artists.factories import'),
        
        # Исправляем импорты из companies.tests
        (r'from companies\.tests\.factories import', 'from tests.unit.companies.factories import'),
        
        # Исправляем импорты из projects.tests
        (r'from projects\.tests\.factories import', 'from tests.unit.projects.factories import'),
        
        # Исправляем импорты из people.tests
        (r'from people\.tests\.factories import', 'from tests.unit.people.factories import'),
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
