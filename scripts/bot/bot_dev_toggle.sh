#!/bin/bash

# Скрипт для быстрого включения/выключения Telegram бота в режиме разработки

cd "$(dirname "$0")/../.." || exit 1

echo "🤖 Управление Telegram ботом (DEV режим)"
echo "========================================"
echo ""

# Проверяем статус бота
if docker ps | grep -q "agent_assistant_telegram_bot_dev"; then
    # Бот запущен - останавливаем
    echo "🛑 Остановка Telegram бота..."
    docker-compose -f docker/docker-compose.yml \
      -f docker/docker-compose.dev.yml \
      -f docker/docker-compose.bot.dev.yml \
      --env-file .env stop telegram-bot
    
    docker-compose -f docker/docker-compose.yml \
      -f docker/docker-compose.dev.yml \
      -f docker/docker-compose.bot.dev.yml \
      --env-file .env rm -f telegram-bot
    
    echo "✅ Telegram бот остановлен"
    echo ""
    
elif docker ps -a | grep -q "agent_assistant_telegram_bot_dev"; then
    # Бот существует но не запущен - запускаем
    echo "🚀 Запуск Telegram бота..."
    docker-compose -f docker/docker-compose.yml \
      -f docker/docker-compose.dev.yml \
      -f docker/docker-compose.bot.dev.yml \
      --env-file .env up -d telegram-bot
    
    sleep 3
    
    if docker ps | grep -q "agent_assistant_telegram_bot_dev"; then
        echo "✅ Telegram бот запущен"
        echo ""
        echo "📋 Для просмотра логов:"
        echo "   docker logs -f agent_assistant_telegram_bot_dev"
        echo ""
        read -p "Показать логи сейчас? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker logs -f agent_assistant_telegram_bot_dev
        fi
    else
        echo "❌ Ошибка при запуске бота"
        echo "Проверьте логи: docker logs agent_assistant_telegram_bot_dev"
        exit 1
    fi
    
else
    # Бот не существует - создаем и запускаем
    echo "🚀 Создание и запуск Telegram бота..."
    
    # Проверяем что основные сервисы запущены
    if ! docker ps | grep -q "agent_assistant_backend"; then
        echo "⚠️  Предупреждение: Backend не запущен!"
        echo ""
        echo "Запустите сначала основные сервисы:"
        echo "  ./scripts/deploy/start_dev.sh"
        echo ""
        read -p "Продолжить запуск бота? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    docker-compose -f docker/docker-compose.yml \
      -f docker/docker-compose.dev.yml \
      -f docker/docker-compose.bot.dev.yml \
      --env-file .env up -d --build telegram-bot
    
    sleep 3
    
    if docker ps | grep -q "agent_assistant_telegram_bot_dev"; then
        echo "✅ Telegram бот запущен"
        echo ""
        echo "📋 Для просмотра логов:"
        echo "   docker logs -f agent_assistant_telegram_bot_dev"
        echo ""
        read -p "Показать логи сейчас? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker logs -f agent_assistant_telegram_bot_dev
        fi
    else
        echo "❌ Ошибка при запуске бота"
        echo "Проверьте логи: docker logs agent_assistant_telegram_bot_dev"
        exit 1
    fi
fi

