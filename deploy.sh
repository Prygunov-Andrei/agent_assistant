#!/bin/bash

# Скрипт автоматического деплоя Agent Assistant
# ОПТИМИЗИРОВАННАЯ ВЕРСИЯ - минимальная нагрузка на сервер

set -e

echo "[$(date)] Starting deployment..."

# Переходим в директорию проекта
cd /opt/agent_assistant

# Получаем последние изменения из GitHub
echo "[$(date)] Pulling latest changes from GitHub..."
git pull origin main

# Создаем необходимые папки
echo "[$(date)] Creating required directories..."
mkdir -p backend/logs backend/staticfiles
chmod 777 backend/logs backend/staticfiles

# Пересобираем и перезапускаем контейнеры
echo "[$(date)] Building and restarting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Ждем запуска
echo "[$(date)] Waiting for services to start..."
sleep 15

# Выполняем миграции
echo "[$(date)] Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate || true

# Собираем статические файлы
echo "[$(date)] Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput || true

# Проверяем статус
echo "[$(date)] Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "[$(date)] ✅ Deployment completed!"
echo "[$(date)] Services available at http://YOUR_SERVER_IP/"
