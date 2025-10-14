#!/bin/bash

# Скрипт автоматического деплоя Agent Assistant
set -e

echo "[$(date)] Starting deployment..."

# Переходим в директорию проекта
cd /opt/agent_assistant

# Останавливаем только backend, frontend и telegram-bot контейнеры (НЕ базу данных!)
echo "[$(date)] Stopping application containers..."
docker-compose -f docker-compose.prod.yml stop backend frontend telegram-bot || true
docker-compose -f docker-compose.prod.yml rm -f backend frontend telegram-bot || true

# Получаем последние изменения из GitHub
echo "[$(date)] Pulling latest changes from GitHub..."
git pull origin main

# Создаем необходимые папки с правильными правами
echo "[$(date)] Creating required directories..."
mkdir -p backend/logs backend/staticfiles
chmod 777 backend/logs backend/staticfiles

# Собираем и запускаем только обновленные контейнеры
echo "[$(date)] Building and starting application containers..."
docker-compose -f docker-compose.prod.yml build --no-cache backend frontend telegram-bot
docker-compose -f docker-compose.prod.yml up -d

# Ждем запуска базы данных (если она еще не запущена)
echo "[$(date)] Ensuring database is ready..."
docker-compose -f docker-compose.prod.yml up -d db redis
sleep 10

# Выполняем миграции (только новые)
echo "[$(date)] Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Собираем статические файлы
echo "[$(date)] Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# Проверяем статус контейнеров
echo "[$(date)] Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Проверяем доступность сервисов
echo "[$(date)] Testing service availability..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/ | grep -q "401"; then
    echo "[$(date)] ✅ Backend API is responding"
else
    echo "[$(date)] ❌ Backend API is not responding"
fi

if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ | grep -q "200"; then
    echo "[$(date)] ✅ Frontend is responding"
else
    echo "[$(date)] ❌ Frontend is not responding"
fi

if docker-compose -f docker-compose.prod.yml ps telegram-bot | grep -q "Up"; then
    echo "[$(date)] ✅ Telegram Bot is running"
else
    echo "[$(date)] ❌ Telegram Bot is not running"
fi

echo "[$(date)] Deployment completed successfully!"
echo "[$(date)] Database data preserved!"
echo "[$(date)] Services available at:"
echo "[$(date)]   - Backend API: http://127.0.0.1:8000/api/"
echo "[$(date)]   - Frontend: http://127.0.0.1:3000/"
echo "[$(date)]   - Telegram Bot: Active"

