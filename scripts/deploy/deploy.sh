#!/bin/bash

# Скрипт автоматического деплоя Agent Assistant
# ОПТИМИЗИРОВАННАЯ ВЕРСИЯ - минимальная нагрузка на сервер

set -e

echo "[$(date)] Starting deployment..."

# Переходим в директорию проекта
cd /opt/agent_assistant

# Сбрасываем все локальные изменения (чтобы избежать конфликтов)
echo "[$(date)] Resetting local changes..."
git reset --hard HEAD
git clean -fd

# Получаем последние изменения из GitHub
echo "[$(date)] Pulling latest changes from GitHub..."
git pull origin main

# Создаем необходимые папки
echo "[$(date)] Creating required directories..."
mkdir -p backend/logs backend/staticfiles
chmod 777 backend/logs backend/staticfiles

# Обновляем webhook службу если она существует
if [ -f /etc/systemd/system/webhook.service ]; then
    echo "[$(date)] Updating webhook service..."
    sed -i 's|ExecStart=.*webhook.py|ExecStart=/usr/bin/python3 /opt/agent_assistant/scripts/webhook.py|' /etc/systemd/system/webhook.service
    systemctl daemon-reload
    systemctl restart webhook
    echo "[$(date)] Webhook service updated"
fi

# Останавливаем и удаляем старые контейнеры
echo "[$(date)] Stopping and removing old containers..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env down

# Пересобираем и запускаем контейнеры
echo "[$(date)] Building and starting containers..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env up -d --build

# Ждем запуска
echo "[$(date)] Waiting for services to start..."
sleep 15

# Выполняем миграции
echo "[$(date)] Running database migrations..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env exec -T backend python manage.py migrate || true

# Собираем статические файлы
echo "[$(date)] Collecting static files..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env exec -T backend python manage.py collectstatic --noinput || true

# Проверяем статус
echo "[$(date)] Checking container status..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env ps

echo "[$(date)] ✅ Deployment completed!"
echo "[$(date)] Services available at http://YOUR_SERVER_IP/"
