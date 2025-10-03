#!/usr/bin/env python3
"""
Скрипт для исправления оставшихся ошибок в тестах
"""

import os
import re

def fix_remaining_tests_in_file(file_path):
    """Исправляет оставшиеся ошибки в файле тестов"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем все оставшиеся authenticated_api_client на authenticated_agent_client
    content = re.sub(r'authenticated_api_client', 'authenticated_agent_client', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed remaining tests in {file_path}")
        return True
    return False

def main():
    """Основная функция"""
    tests_dir = "tests/unit/projects"
    fixed_files = 0
    
    for file in os.listdir(tests_dir):
        if file.endswith('.py') and file != '__init__.py':
            file_path = os.path.join(tests_dir, file)
            if fix_remaining_tests_in_file(file_path):
                fixed_files += 1
    
    print(f"Fixed remaining tests in {fixed_files} files")

if __name__ == "__main__":
    main()
