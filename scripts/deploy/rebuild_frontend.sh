#!/bin/bash

# Скрипт для правильной пересборки и обновления frontend
# Использовать когда изменились файлы в frontend/src/

set -e

echo "🔄 Пересборка и обновление Frontend..."
echo ""

cd "$(dirname "$0")/../.."

# 1. Очистка кэша Vite и TypeScript
echo "1️⃣  Очистка кэша сборки..."
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist
find frontend -name "*.tsbuildinfo" -delete 2>/dev/null || true
echo "✅ Кэш очищен"
echo ""

# 2. Сборка frontend
echo "2️⃣  Сборка frontend..."
cd frontend
npm run build
cd ..
echo "✅ Frontend собран"
echo ""

# 3. Пересборка Docker образа
echo "3️⃣  Пересборка Docker образа..."
docker-compose -f docker/docker-compose.yml --env-file .env build --no-cache frontend
echo "✅ Образ пересобран"
echo ""

# 4. Остановка старого контейнера
echo "4️⃣  Остановка frontend контейнера..."
docker-compose -f docker/docker-compose.yml --env-file .env stop frontend
echo "✅ Контейнер остановлен"
echo ""

# 5. Удаление старого контейнера
echo "5️⃣  Удаление старого контейнера..."
docker-compose -f docker/docker-compose.yml --env-file .env rm -f frontend
echo "✅ Контейнер удалён"
echo ""

# 6. Создание и запуск ТОЛЬКО frontend (без --recreate зависимостей)
echo "6️⃣  Запуск нового frontend контейнера..."
docker-compose -f docker/docker-compose.yml --env-file .env up -d --no-deps frontend
echo "✅ Frontend контейнер запущен"
echo ""

# 7. Проверка статуса
echo "7️⃣  Проверка статуса frontend..."
docker-compose -f docker/docker-compose.yml --env-file .env ps frontend
echo ""

echo "✅ Frontend успешно пересобран и обновлён!"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Обнови страницу в браузере (Cmd+Shift+R или Ctrl+Shift+F5)"
echo "   2. Проверь в DevTools → Network что загрузился новый JS файл"
echo ""
echo "💡 Если браузер всё ещё показывает старый код:"
echo "   - Очисти кэш браузера полностью"
echo "   - Открой в приватном окне (Cmd+Shift+P или Ctrl+Shift+N)"
echo "   - Открой напрямую http://localhost:3000 (минуя Nginx)"
echo ""
