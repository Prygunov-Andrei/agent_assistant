#!/bin/bash

# Скрипт запуска Agent Assistant в режиме локальной разработки
# С HOT RELOAD для backend и frontend

# Переходим в корневую директорию проекта
cd "$(dirname "$0")/../.." || exit 1

echo "🚀 Запуск Agent Assistant в режиме разработки (HOT RELOAD)..."
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
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  --env-file .env down 2>/dev/null
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

# Запускаем все основные сервисы в DEV режиме
echo "5️⃣  Запуск всех сервисов в режиме разработки..."
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  --env-file .env up -d
echo "✅ Сервисы запущены в режиме разработки"
echo ""

# Ждём готовности сервисов
echo "6️⃣  Ожидание готовности сервисов (20 сек)..."
sleep 20
echo "✅ Сервисы готовы"
echo ""

# Показываем статус всех сервисов
echo "7️⃣  Статус всех сервисов:"
echo ""
docker ps --filter "name=agent_assistant" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Опциональный запуск Telegram бота
echo "8️⃣  Telegram бот (опционально):"
read -p "   Запустить Telegram бота? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Запускаем Telegram бота..."
    docker-compose -f docker/docker-compose.yml \
      -f docker/docker-compose.dev.yml \
      -f docker/docker-compose.bot.dev.yml \
      --env-file .env up -d telegram-bot
    sleep 3
    if docker ps | grep -q "agent_assistant_telegram_bot_dev"; then
        echo "   ✅ Telegram бот запущен"
    else
        echo "   ❌ Ошибка запуска бота (см. логи: docker logs agent_assistant_telegram_bot_dev)"
    fi
else
    echo "   ⏭  Telegram бот пропущен (запустить позже: ./scripts/bot/bot_dev_toggle.sh)"
fi
echo ""

echo "✅ Agent Assistant запущен в режиме разработки!"
echo ""
echo "🔥 HOT RELOAD включен:"
echo "   Backend:  Django runserver (автоперезагрузка при изменении .py файлов)"
echo "   Frontend: Vite HMR (мгновенное обновление при изменении .tsx/.ts/.css)"
echo ""
echo "📱 Доступные URLs:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend:      http://localhost:8000"
echo "   API Docs:     http://localhost:8000/api/docs/"
echo "   Admin:        http://localhost:8000/admin/"
echo "   Nginx:        http://localhost"
echo ""
echo "📝 Теперь можете редактировать код - изменения применятся автоматически!"
echo ""
echo "📊 Просмотр логов:"
echo "   Backend:    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f backend"
echo "   Frontend:   docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f frontend"
echo "   Все логи:   docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f"
echo ""
echo "🤖 Управление Telegram ботом:"
echo "   Вкл/Выкл:            ./scripts/bot/bot_dev_toggle.sh"
echo "   Проверка дубликатов: ./scripts/bot/bot_check_duplicates.sh"
echo "   Логи:                docker logs -f agent_assistant_telegram_bot_dev"
echo ""
echo "🛑 Остановка всех сервисов:"
echo "   ./scripts/deploy/stop_all.sh"
echo ""

