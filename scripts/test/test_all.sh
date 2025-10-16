#!/bin/bash

echo "🚀 Запуск всех тестов проекта"
echo "================================"

# Проверяем, что мы в корне проекта
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Ошибка: Запустите скрипт из корня проекта"
    exit 1
fi

# Запускаем backend тесты
echo "📊 Запуск backend тестов..."
cd backend
source venv/bin/activate
python -m pytest tests/ -v --tb=short
BACKEND_EXIT_CODE=$?
deactivate
cd ..

if [ $BACKEND_EXIT_CODE -ne 0 ]; then
    echo "❌ Backend тесты провалились"
    exit 1
fi

# Запускаем frontend тесты
echo "🎨 Запуск frontend тестов..."
cd frontend
npm test -- --watchAll=false
FRONTEND_EXIT_CODE=$?
cd ..

if [ $FRONTEND_EXIT_CODE -ne 0 ]; then
    echo "❌ Frontend тесты провалились"
    exit 1
fi

echo "✅ Все тесты прошли успешно!"