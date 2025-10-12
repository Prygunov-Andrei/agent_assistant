#!/bin/bash

echo "🛑 Остановка Telegram бота..."

# Останавливаем контейнер через docker-compose
docker-compose -f docker-compose.bot.yml down

# Проверяем что контейнер остановлен
if docker ps | grep -q "agent_assistant_telegram_bot"; then
    echo "⚠️  Контейнер все еще работает, принудительная остановка..."
    docker stop agent_assistant_telegram_bot
    docker rm agent_assistant_telegram_bot
fi

echo "✅ Бот остановлен"

