#!/bin/bash

# Скрипт для правильной пересборки и обновления backend
# Использовать когда изменились файлы в backend/

set -e

echo "🔄 Пересборка и обновления Backend..."
echo ""

cd "$(dirname "$0")/../.."

# 1. Очистка Python кэша
echo "1️⃣  Очистка Python кэша..."
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend -name "*.pyc" -delete 2>/dev/null || true
echo "✅ Кэш очищен"
echo ""

# 2. Пересборка Docker образа
echo "2️⃣  Пересборка Docker образа..."
docker-compose -f docker/docker-compose.yml --env-file .env build --no-cache backend
echo "✅ Образ пересобран"
echo ""

# 3. Остановка старого контейнера
echo "3️⃣  Остановка backend контейнера..."
docker-compose -f docker/docker-compose.yml --env-file .env stop backend
echo "✅ Контейнер остановлен"
echo ""

# 4. Удаление старого контейнера
echo "4️⃣  Удаление старого контейнера..."
docker-compose -f docker/docker-compose.yml --env-file .env rm -f backend
echo "✅ Контейнер удалён"
echo ""

# 5. Создание и запуск ТОЛЬКО backend (без --recreate зависимостей)
echo "5️⃣  Запуск нового backend контейнера..."
docker-compose -f docker/docker-compose.yml --env-file .env up -d --no-deps backend
echo "✅ Backend контейнер запущен"
echo ""

# 6. Проверка статуса
echo "6️⃣  Проверка статуса backend..."
docker-compose -f docker/docker-compose.yml --env-file .env ps backend
echo ""

echo "✅ Backend успешно пересобран и обновлён!"
echo ""
echo "📝 Проверка:"
echo "   docker-compose -f docker/docker-compose.yml logs backend --tail=50"
echo ""

