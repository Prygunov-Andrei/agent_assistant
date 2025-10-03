#!/usr/bin/env python3
"""
Скрипт для финального исправления импортов в frontend тестах
"""

import os
import re

def fix_frontend_imports_in_file(file_path):
    """Исправляет импорты в файле frontend теста"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем все неправильные пути на правильные относительно src/
    replacements = [
        # Убираем все лишние пути и заменяем на правильные
        (r'\.\./\.\./\.\./\.\./\.\./\.\./src/\.\./src/\.\./src/\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./\.\./\.\./src/\.\./src/\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./\.\./\.\./src/\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./\.\./\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./\.\./src/\.\./src/\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./\.\./src/\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./src/\.\./src/', ''),
        (r'\.\./\.\./\.\./\.\./src/', ''),
        (r'\.\./\.\./\.\./src/', ''),
        (r'\.\./\.\./src/', ''),
        (r'\.\./src/', ''),
        
        # Исправляем простые случаи
        (r"from '\.\./", "from '../"),
        (r"from \"\.\./", "from \"../"),
        (r"from '\.\./\.\./", "from '../../"),
        (r"from \"\.\./\.\./", "from \"../../"),
        (r"from '\.\./\.\./\.\./", "from '../../../"),
        (r"from \"\.\./\.\./\.\./", "from \"../../../"),
        (r"from '\.\./\.\./\.\./\.\./", "from '../../../../"),
        (r"from \"\.\./\.\./\.\./\.\./", "from \"../../../../"),
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
    frontend_dir = "frontend/src/__tests__"
    fixed_files = 0
    
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')):
                file_path = os.path.join(root, file)
                if fix_frontend_imports_in_file(file_path):
                    fixed_files += 1
    
    print(f"Fixed imports in {fixed_files} frontend test files")

if __name__ == "__main__":
    main()
