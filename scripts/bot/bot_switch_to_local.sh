#!/bin/bash

# Скрипт переключения бота с удаленного сервера на локальный

REMOTE_SERVER="root@217.151.231.96"
SSH_KEY="~/.ssh/id_rsa_server"

echo "🔄 Переключение Telegram бота на ЛОКАЛЬНЫЙ режим"
echo "================================================"
echo ""

# 1. Остановка удаленного бота
echo "📡 Шаг 1/4: Остановка бота на удаленном сервере..."

# Останавливаем и удаляем контейнер бота на удалённом сервере
ssh -i $SSH_KEY $REMOTE_SERVER "cd /opt/agent_assistant && docker-compose -f docker/docker-compose.prod.yml stop telegram-bot 2>/dev/null && docker-compose -f docker/docker-compose.prod.yml rm -f telegram-bot 2>/dev/null || docker stop \$(docker ps -q --filter name=telegram) 2>/dev/null || true"

if [ $? -eq 0 ]; then
    echo "✅ Удаленный бот остановлен"
else
    echo "⚠️ Ошибка при остановке удаленного бота (возможно уже остановлен)"
fi

echo ""

# Ждем освобождения токена Telegram
echo "⏳ Шаг 2/4: Ожидание освобождения токена Telegram (15 сек)..."
sleep 15
echo "✅ Токен свободен"
echo ""

# 3. Проверка локального окружения
echo "🔍 Шаг 3/4: Проверка локального окружения..."

if [ ! -f .env ]; then
    echo "❌ Ошибка: файл .env не найден!"
    exit 1
fi

if ! grep -q "BOT_TOKEN=" .env; then
    echo "❌ Ошибка: BOT_TOKEN не найден в .env файле!"
    exit 1
fi

# Проверяем, что локальный backend запущен
if ! curl -s http://localhost:8000/api/ > /dev/null 2>&1; then
    echo "⚠️  Предупреждение: Локальный backend не отвечает на http://localhost:8000/api/"
    echo ""
    echo "Для запуска локального backend выполните:"
    echo "  docker-compose up -d backend db"
    echo ""
    read -p "Продолжить запуск бота? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Отмена запуска локального бота"
        echo ""
        echo "⚠️  ВНИМАНИЕ: Удаленный бот был остановлен!"
        echo "Для возврата бота на сервер выполните: ./bot_switch_to_remote.sh"
        exit 1
    fi
fi

echo "✅ Локальное окружение готово"
echo ""

# 4. Запуск локального бота
echo "🚀 Шаг 4/4: Запуск локального бота..."

# Останавливаем старый локальный контейнер если есть
if docker ps -a | grep -q "agent_assistant_telegram_bot_local"; then
    echo "Останавливаем старый контейнер бота..."
    docker stop agent_assistant_telegram_bot_local 2>/dev/null || true
    docker rm agent_assistant_telegram_bot_local 2>/dev/null || true
fi

# Запускаем локального бота
echo "Запускаем локального бота..."
cd "$(dirname "$0")/../.." || exit 1
docker-compose -f docker/docker-compose.bot.local.yml --env-file .env up -d --build

# Ждем запуска
sleep 3

# Проверяем статус
if docker ps | grep -q "agent_assistant_telegram_bot_local"; then
    echo ""
    echo "✅✅✅ УСПЕШНО! ✅✅✅"
    echo "================================================"
    echo "🤖 Локальный Telegram бот запущен!"
    echo "📡 Удаленный бот остановлен"
    echo ""
    echo "Бот теперь подключен к локальному backend:"
    echo "  http://localhost:8000/api"
    echo ""
    echo "📋 Полезные команды:"
    echo "  Логи бота:           docker logs -f agent_assistant_telegram_bot_local"
    echo "  Остановить бота:     docker-compose -f docker/docker-compose.bot.local.yml --env-file .env down"
    echo "  Вернуть на сервер:   ./scripts/bot/bot_switch_to_remote.sh"
    echo ""
    echo "💡 Для просмотра логов выполните:"
    echo "   docker logs -f agent_assistant_telegram_bot_local"
    echo "================================================"
else
    echo ""
    echo "❌ Ошибка при запуске локального бота!"
    echo "Проверьте логи: docker logs agent_assistant_telegram_bot_local"
    echo ""
    echo "⚠️  ВНИМАНИЕ: Удаленный бот был остановлен!"
    echo "Для возврата бота на сервер выполните: ./bot_switch_to_remote.sh"
    exit 1
fi
