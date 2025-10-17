#!/bin/bash
set -e

echo "🔄 Пересборка и перезапуск Frontend..."
echo ""

cd "$(dirname "$0")/../.."

echo "1️⃣  Останавливаем frontend и nginx..."
docker-compose -f docker/docker-compose.yml --env-file .env stop frontend nginx
echo "✅ Контейнеры остановлены"
echo ""

echo "2️⃣  Пересобираем frontend образ..."
docker-compose -f docker/docker-compose.yml --env-file .env build --no-cache frontend
echo "✅ Frontend пересобран"
echo ""

echo "3️⃣  Перезапускаем nginx..."
docker-compose -f docker/docker-compose.yml --env-file .env up -d nginx
echo "✅ Nginx перезапущен"
echo ""

echo "4️⃣  Запускаем frontend..."
docker-compose -f docker/docker-compose.yml --env-file .env up -d frontend
echo "✅ Frontend запущен"
echo ""

echo "5️⃣  Ожидание готовности (10 сек)..."
sleep 10
echo ""

echo "6️⃣  Статус сервисов:"
docker-compose -f docker/docker-compose.yml --env-file .env ps frontend nginx
echo ""

echo "✅ Готово!"
echo ""
echo "📱 Frontend доступен:"
echo "   http://localhost:3000"
echo "   http://localhost (через Nginx)"
echo ""
echo "💡 Очистите кэш браузера (Ctrl+Shift+R) для загрузки новой версии"

