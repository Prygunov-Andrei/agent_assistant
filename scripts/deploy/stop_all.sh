#!/bin/bash

# Скрипт остановки всех сервисов Agent Assistant

# Переходим в корневую директорию проекта
cd "$(dirname "$0")/../.." || exit 1

echo "🛑 Остановка всех сервисов Agent Assistant..."
echo ""

# Останавливаем Telegram бота
echo "1️⃣  Остановка Telegram бота..."
docker-compose -f docker/docker-compose.bot.yml down
echo "✅ Telegram бот остановлен"
echo ""

# Останавливаем основные сервисы
echo "2️⃣  Остановка основных сервисов..."
docker-compose -f docker/docker-compose.yml down
echo "✅ Основные сервисы остановлены"
echo ""

# Показываем статус
echo "3️⃣  Проверка статуса:"
CONTAINERS=$(docker ps -a --filter "name=agent_assistant" --format "{{.Names}}")
if [ -z "$CONTAINERS" ]; then
    echo "✅ Все контейнеры Agent Assistant остановлены"
else
    echo "⚠️  Обнаружены работающие контейнеры:"
    docker ps --filter "name=agent_assistant"
fi
echo ""

echo "✅ Готово!"
echo ""
echo "💡 Для удаления данных (volumes):"
echo "   docker-compose -f docker/docker-compose.yml down -v"
echo ""

