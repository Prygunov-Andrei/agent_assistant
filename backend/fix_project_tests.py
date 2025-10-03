#!/usr/bin/env python3
"""
Скрипт для исправления тестов проектов
"""

import os
import re

def fix_project_tests_in_file(file_path):
    """Исправляет тесты проектов в файле"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем authenticated_api_client на authenticated_agent_client в тестах проектов
    # Только для методов, которые используют agent фикстуру
    replacements = [
        # Заменяем в методах, которые используют agent
        (r'def test_project_create\(self, authenticated_api_client, agent\):', 
         'def test_project_create(self, authenticated_agent_client, agent):'),
        (r'def test_project_update_own\(self, authenticated_api_client, agent\):', 
         'def test_project_update_own(self, authenticated_agent_client, agent):'),
        (r'def test_project_update_other_agent\(self, authenticated_api_client, another_agent\):', 
         'def test_project_update_other_agent(self, authenticated_agent_client, another_agent):'),
        (r'def test_project_delete_own\(self, authenticated_api_client, agent\):', 
         'def test_project_delete_own(self, authenticated_agent_client, agent):'),
        (r'def test_project_delete_other_agent\(self, authenticated_api_client, another_agent\):', 
         'def test_project_delete_other_agent(self, authenticated_agent_client, another_agent):'),
        (r'def test_project_my_projects\(self, authenticated_api_client, agent\):', 
         'def test_project_my_projects(self, authenticated_agent_client, agent):'),
        (r'def test_project_update_validation\(self, authenticated_api_client, agent\):', 
         'def test_project_update_validation(self, authenticated_agent_client, agent):'),
        (r'def test_project_role_create\(self, authenticated_api_client, agent\):', 
         'def test_project_role_create(self, authenticated_agent_client, agent):'),
        (r'def test_project_role_update_own_project\(self, authenticated_api_client, agent\):', 
         'def test_project_role_update_own_project(self, authenticated_agent_client, agent):'),
        (r'def test_project_role_update_other_agent_project\(self, authenticated_api_client, another_agent\):', 
         'def test_project_role_update_other_agent_project(self, authenticated_agent_client, another_agent):'),
        (r'def test_project_role_delete_own_project\(self, authenticated_api_client, agent\):', 
         'def test_project_role_delete_own_project(self, authenticated_agent_client, agent):'),
        (r'def test_project_role_delete_other_agent_project\(self, authenticated_api_client, another_agent\):', 
         'def test_project_role_delete_other_agent_project(self, authenticated_agent_client, another_agent):'),
        (r'def test_project_role_by_project\(self, authenticated_api_client, agent\):', 
         'def test_project_role_by_project(self, authenticated_agent_client, agent):'),
        (r'def test_project_role_creation_validation\(self, authenticated_api_client, agent\):', 
         'def test_project_role_creation_validation(self, authenticated_agent_client, agent):'),
        (r'def test_project_role_update_validation\(self, authenticated_api_client, agent\):', 
         'def test_project_role_update_validation(self, authenticated_agent_client, agent):'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed project tests in {file_path}")
        return True
    return False

def main():
    """Основная функция"""
    tests_dir = "tests/unit/projects"
    fixed_files = 0
    
    for file in os.listdir(tests_dir):
        if file.endswith('.py') and file != '__init__.py':
            file_path = os.path.join(tests_dir, file)
            if fix_project_tests_in_file(file_path):
                fixed_files += 1
    
    print(f"Fixed project tests in {fixed_files} files")

if __name__ == "__main__":
    main()
