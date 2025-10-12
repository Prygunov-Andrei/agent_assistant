#!/bin/bash

echo "🤖 Запуск Telegram бота в Docker..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Ошибка: файл .env не найден!"
    echo "Создайте .env файл на основе env.example"
    exit 1
fi

# Проверяем наличие BOT_TOKEN
if ! grep -q "BOT_TOKEN=" .env; then
    echo "❌ Ошибка: BOT_TOKEN не найден в .env файле!"
    exit 1
fi

# Проверяем, что основные сервисы запущены
echo "Проверяем основные сервисы..."
if ! docker ps | grep -q "agent_assistant_backend"; then
    echo "⚠️  Предупреждение: backend не запущен!"
    echo "Запустите сначала основные сервисы: docker-compose up -d"
    read -p "Продолжить запуск бота? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Останавливаем старый контейнер бота если он запущен
if docker ps -a | grep -q "agent_assistant_telegram_bot"; then
    echo "Останавливаем старый контейнер бота..."
    docker stop agent_assistant_telegram_bot 2>/dev/null || true
    docker rm agent_assistant_telegram_bot 2>/dev/null || true
fi

# Создаем сеть если её нет
docker network inspect agent_network >/dev/null 2>&1 || \
    docker network create agent_network

# Запускаем бота
echo "Запускаем нового бота..."
docker-compose -f docker-compose.bot.yml up -d --build

# Ждем немного
sleep 3

# Проверяем статус
if docker ps | grep -q "agent_assistant_telegram_bot"; then
    echo "✅ Бот успешно запущен!"
    echo ""
    echo "📋 Полезные команды:"
    echo "  Логи бота:           docker logs -f agent_assistant_telegram_bot"
    echo "  Остановить бота:     docker stop agent_assistant_telegram_bot"
    echo "  Перезапустить бота:  docker restart agent_assistant_telegram_bot"
    echo "  Статус бота:         docker ps | grep telegram_bot"
    echo ""
    echo "Просмотр логов (Ctrl+C для выхода):"
    docker logs -f agent_assistant_telegram_bot
else
    echo "❌ Ошибка при запуске бота!"
    echo "Проверьте логи: docker logs agent_assistant_telegram_bot"
    exit 1
fi

