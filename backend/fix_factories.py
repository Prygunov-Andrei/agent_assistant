#!/usr/bin/env python3
"""
Скрипт для исправления импортов в factories
"""

import os
import re

def fix_factories_in_file(file_path):
    """Исправляет импорты в файле factories"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем импорты в factories
    replacements = [
        (r"'users\.tests\.factories\.AgentFactory'", "'tests.unit.users.factories.AgentFactory'"),
        (r"'users\.tests\.factories\.UserFactory'", "'tests.unit.users.factories.UserFactory'"),
        (r"'artists\.tests\.factories\.ArtistFactory'", "'tests.unit.artists.factories.ArtistFactory'"),
        (r"'companies\.tests\.factories\.CompanyFactory'", "'tests.unit.companies.factories.CompanyFactory'"),
        (r"'projects\.tests\.factories\.ProjectFactory'", "'tests.unit.projects.factories.ProjectFactory'"),
        (r"'people\.tests\.factories\.PersonFactory'", "'tests.unit.people.factories.PersonFactory'"),
        (r"'telegram_requests\.tests\.factories\.TelegramRequestFactory'", "'tests.unit.telegram_requests.factories.TelegramRequestFactory'"),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed factories in {file_path}")
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
                if fix_factories_in_file(file_path):
                    fixed_files += 1
    
    print(f"Fixed factories in {fixed_files} files")

if __name__ == "__main__":
    main()
