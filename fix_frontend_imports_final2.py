#!/usr/bin/env python3
"""
Финальный скрипт для исправления импортов в frontend тестах
"""

import os
import re

def fix_frontend_imports_in_file(file_path):
    """Исправляет импорты в файле frontend теста"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Исправляем импорты компонентов - добавляем правильные пути
    replacements = [
        # Компоненты из корня src/
        (r"from 'AuthContext'", "from '../contexts/AuthContext'"),
        (r"from \"AuthContext\"", "from \"../contexts/AuthContext\""),
        (r"from 'UserProfile'", "from '../components/UserProfile'"),
        (r"from \"UserProfile\"", "from \"../components/UserProfile\""),
        (r"from 'ArtistsTable'", "from '../components/ArtistsTable'"),
        (r"from \"ArtistsTable\"", "from \"../components/ArtistsTable\""),
        (r"from 'LoadingSpinner'", "from '../components/LoadingSpinner'"),
        (r"from \"LoadingSpinner\"", "from \"../components/LoadingSpinner\""),
        (r"from 'PersonSelectionComponent'", "from '../components/PersonSelectionComponent'"),
        (r"from \"PersonSelectionComponent\"", "from \"../components/PersonSelectionComponent\""),
        (r"from 'MatchingSuggestions'", "from '../components/MatchingSuggestions'"),
        (r"from \"MatchingSuggestions\"", "from \"../components/MatchingSuggestions\""),
        (r"from 'ProjectCreationForm'", "from '../components/projects/creation/ProjectCreationForm'"),
        (r"from \"ProjectCreationForm\"", "from \"../components/projects/creation/ProjectCreationForm\""),
        (r"from 'ProjectRoleForm'", "from '../components/projects/roles/ProjectRoleForm'"),
        (r"from \"ProjectRoleForm\"", "from \"../components/projects/roles/ProjectRoleForm\""),
        (r"from 'RoleTabs'", "from '../components/projects/roles/RoleTabs'"),
        (r"from \"RoleTabs\"", "from \"../components/projects/roles/RoleTabs\""),
        (r"from 'AddRoleButton'", "from '../components/projects/roles/AddRoleButton'"),
        (r"from \"AddRoleButton\"", "from \"../components/projects/roles/AddRoleButton\""),
        (r"from 'DeleteRoleButton'", "from '../components/projects/roles/DeleteRoleButton'"),
        (r"from \"DeleteRoleButton\"", "from \"../components/projects/roles/DeleteRoleButton\""),
        (r"from 'ImageGallery'", "from '../components/media/images/ImageGallery'"),
        (r"from \"ImageGallery\"", "from \"../components/media/images/ImageGallery\""),
        (r"from 'DocumentList'", "from '../components/media/documents/DocumentList'"),
        (r"from \"DocumentList\"", "from \"../components/media/documents/DocumentList\""),
        (r"from 'LLMStatusIndicator'", "from '../components/llm/status/LLMStatusIndicator'"),
        (r"from \"LLMStatusIndicator\"", "from \"../components/llm/status/LLMStatusIndicator\""),
        (r"from 'RequestAnalysisModal'", "from '../components/llm/analysis/RequestAnalysisModal'"),
        (r"from \"RequestAnalysisModal\"", "from \"../components/llm/analysis/RequestAnalysisModal\""),
        
        # Сервисы
        (r"from 'auth'", "from '../services/auth'"),
        (r"from \"auth\"", "from \"../services/auth\""),
        (r"from 'api'", "from '../config/api'"),
        (r"from \"api\"", "from \"../config/api\""),
        (r"from 'matching'", "from '../services/matching'"),
        (r"from \"matching\"", "from \"../services/matching\""),
        (r"from 'fuzzyMatching'", "from '../utils/fuzzyMatching'"),
        (r"from \"fuzzyMatching\"", "from \"../utils/fuzzyMatching\""),
        (r"from 'llm'", "from '../services/llm'"),
        (r"from \"llm\"", "from \"../services/llm\""),
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
