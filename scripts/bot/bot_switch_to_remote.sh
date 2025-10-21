#!/bin/bash

# Скрипт переключения бота с локального на удаленный сервер

REMOTE_SERVER="root@217.151.231.96"
SSH_KEY="~/.ssh/id_rsa_server"

echo "🔄 Переключение Telegram бота на УДАЛЕННЫЙ режим"
echo "================================================"
echo ""

# 1. Остановка локального бота
echo "💻 Шаг 1/3: Остановка локального бота..."

if docker ps | grep -q "agent_assistant_telegram_bot_local"; then
    echo "Останавливаем локального бота..."
    cd "$(dirname "$0")/../.." || exit 1
    docker-compose -f docker/docker-compose.bot.local.yml --env-file .env down
    echo "✅ Локальный бот остановлен"
else
    echo "ℹ️  Локальный бот не запущен"
fi

echo ""

# Ждем освобождения токена Telegram
echo "⏳ Шаг 2/3: Ожидание освобождения токена Telegram (15 сек)..."
sleep 15
echo "✅ Токен свободен"
echo ""

# 3. Запуск удаленного бота
echo "📡 Шаг 3/3: Запуск бота на удаленном сервере..."

ssh -i $SSH_KEY $REMOTE_SERVER "cd /opt/agent_assistant && docker-compose -f docker/docker-compose.prod.yml up -d --build telegram-bot"

if [ $? -eq 0 ]; then
    sleep 3
    
    # Проверяем статус
    REMOTE_STATUS=$(ssh -i $SSH_KEY $REMOTE_SERVER "docker ps | grep telegram-bot")
    
    if [ ! -z "$REMOTE_STATUS" ]; then
        echo ""
        echo "✅✅✅ УСПЕШНО! ✅✅✅"
        echo "================================================"
        echo "📡 Удаленный Telegram бот запущен!"
        echo "💻 Локальный бот остановлен"
        echo ""
        echo "Бот теперь подключен к удаленному backend:"
        echo "  http://217.151.231.96/api"
        echo ""
        echo "📋 Для просмотра логов удаленного бота:"
        echo "  ssh -i ~/.ssh/id_rsa_server root@217.151.231.96"
        echo "  cd /opt/agent_assistant"
        echo "  docker-compose -f docker/docker-compose.prod.yml logs -f telegram-bot"
        echo ""
        echo "🔄 Для переключения обратно на локальный:"
        echo "  ./bot_switch_to_local.sh"
        echo "================================================"
    else
        echo ""
        echo "❌ Ошибка при запуске удаленного бота!"
        echo "Проверьте логи на сервере"
        exit 1
    fi
else
    echo ""
    echo "❌ Ошибка при запуске удаленного бота!"
    echo ""
    echo "⚠️  ВНИМАНИЕ: Локальный бот был остановлен!"
    echo "Для запуска локального бота: ./bot_switch_to_local.sh"
    exit 1
fi
