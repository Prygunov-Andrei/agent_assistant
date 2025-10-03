#!/usr/bin/env python3
"""
Скрипт для исправления предупреждений в factories
"""

import os
import re

def fix_factory_warnings_in_file(file_path):
    """Исправляет предупреждения в файле factories"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем Meta классы, добавляя skip_postgeneration_save = True
    # Ищем паттерн: class Meta:\n        model = '...'
    pattern = r'(class Meta:\s*\n\s*model = [\'"][^\'"]+[\'"])'
    replacement = r'\1\n        skip_postgeneration_save = True'
    
    content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed factory warnings in {file_path}")
        return True
    return False

def main():
    """Основная функция"""
    tests_dir = "tests/unit"
    fixed_files = 0
    
    for root, dirs, files in os.walk(tests_dir):
        for file in files:
            if file == 'factories.py':
                file_path = os.path.join(root, file)
                if fix_factory_warnings_in_file(file_path):
                    fixed_files += 1
    
    print(f"Fixed factory warnings in {fixed_files} files")

if __name__ == "__main__":
    main()
