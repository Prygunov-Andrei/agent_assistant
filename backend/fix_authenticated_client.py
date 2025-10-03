#!/usr/bin/env python3
"""
Скрипт для исправления authenticated_client на authenticated_api_client
"""

import os
import re

def fix_authenticated_client_in_file(file_path):
    """Исправляет authenticated_client на authenticated_api_client в файле"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем authenticated_client на authenticated_api_client
    content = re.sub(r'authenticated_client', 'authenticated_api_client', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed authenticated_client in {file_path}")
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
                if fix_authenticated_client_in_file(file_path):
                    fixed_files += 1
    
    print(f"Fixed authenticated_client in {fixed_files} files")

if __name__ == "__main__":
    main()
