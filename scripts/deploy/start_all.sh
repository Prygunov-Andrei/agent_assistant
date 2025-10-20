#!/bin/bash

# Скрипт полного запуска Agent Assistant (все сервисы + Telegram бот)
# Полностью автоматический, без интерактивных вопросов

# Переходим в корневую директорию проекта
cd "$(dirname "$0")/../.." || exit 1

echo "🚀 Полный запуск Agent Assistant (все сервисы)..."
echo ""

# Проверяем Docker
echo "1️⃣  Проверка Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен!"
    echo "   Запустите Docker Desktop и повторите попытку."
    exit 1
fi
echo "✅ Docker работает"
echo ""

# Проверяем .env файл
echo "2️⃣  Проверка .env файла..."
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "   Создайте .env из .env.example и добавьте необходимые ключи"
    exit 1
fi
echo "✅ Файл .env существует"
echo ""

# Останавливаем старые контейнеры
echo "3️⃣  Остановка старых контейнеров..."
docker-compose -f docker/docker-compose.bot.yml --env-file .env down 2>/dev/null
docker-compose -f docker/docker-compose.yml --env-file .env down 2>/dev/null
echo "✅ Старые контейнеры остановлены"
echo ""

# Проверяем сеть для Telegram бота
echo "4️⃣  Проверка сети для Telegram бота..."
if ! docker network inspect agent_assistant_agent_network > /dev/null 2>&1; then
    docker network create agent_assistant_agent_network
    echo "✅ Сеть agent_assistant_agent_network создана"
else
    echo "✅ Сеть agent_assistant_agent_network уже существует"
fi
echo ""

# Запускаем все основные сервисы сразу
echo "5️⃣  Запуск всех основных сервисов..."
docker-compose -f docker/docker-compose.yml --env-file .env up -d
echo "✅ Основные сервисы запущены"
echo ""

# Ждём готовности сервисов
echo "6️⃣  Ожидание готовности сервисов (30 сек)..."
sleep 30
echo "✅ Сервисы готовы"
echo ""

# Запускаем Telegram бота
echo "7️⃣  Запуск Telegram бота..."
docker-compose -f docker/docker-compose.bot.yml --env-file .env up -d
echo "✅ Telegram бот запущен"
echo ""

# Показываем статус всех сервисов
echo "8️⃣  Статус всех сервисов:"
echo ""
docker ps --filter "name=agent_assistant" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "✅ Agent Assistant полностью запущен!"
echo ""
echo "📱 Доступные URLs:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend:      http://localhost:8000"
echo "   API Docs:     http://localhost:8000/api/docs/"
echo "   Admin:        http://localhost:8000/admin/"
echo "   Nginx:        http://localhost"
echo ""
echo "🤖 Telegram бот:"
echo "   Статус: docker-compose -f docker/docker-compose.bot.yml ps"
echo "   Логи:   docker-compose -f docker/docker-compose.bot.yml logs -f"
echo ""
echo "📊 Просмотр логов:"
echo "   Backend:    docker-compose -f docker/docker-compose.yml logs -f backend"
echo "   Frontend:   docker-compose -f docker/docker-compose.yml logs -f frontend"
echo "   Telegram:   docker-compose -f docker/docker-compose.bot.yml logs -f telegram-bot"
echo "   Все логи:   docker-compose -f docker/docker-compose.yml logs -f && docker-compose -f docker/docker-compose.bot.yml logs -f"
echo ""
echo "🛑 Остановка ВСЕХ сервисов:"
echo "   ./scripts/deploy/stop_all.sh"
echo "   или:"
echo "   docker-compose -f docker/docker-compose.yml down && docker-compose -f docker/docker-compose.bot.yml down"
echo ""
echo "💾 Полная остановка с удалением данных:"
echo "   docker-compose -f docker/docker-compose.yml down -v && docker-compose -f docker/docker-compose.bot.yml down"
echo ""

