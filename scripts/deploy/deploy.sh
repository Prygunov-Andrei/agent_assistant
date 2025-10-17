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

# Создаем шаблон Excel для импорта персон (если не существует)
echo "[$(date)] Creating Excel import template..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env exec -T backend python people/create_template.py || true

# Копируем статику в директорию доступную системному Nginx
echo "[$(date)] Copying static files for system Nginx..."
STATIC_VOLUME=$(docker volume inspect docker_static_files --format '{{.Mountpoint}}')
mkdir -p /var/www/agent_assistant/static
cp -r $STATIC_VOLUME/* /var/www/agent_assistant/static/ 2>/dev/null || true
chmod -R 755 /var/www/agent_assistant/static

# Копируем медиа файлы
MEDIA_VOLUME=$(docker volume inspect docker_media_files --format '{{.Mountpoint}}')
mkdir -p /var/www/agent_assistant/media
cp -r $MEDIA_VOLUME/* /var/www/agent_assistant/media/ 2>/dev/null || true
chmod -R 755 /var/www/agent_assistant/media

echo "[$(date)] Static and media files copied"

# Обновляем конфигурацию системного Nginx
echo "[$(date)] Updating system Nginx configuration..."
cp nginx/production.conf /etc/nginx/sites-available/agent_assistant
ln -sf /etc/nginx/sites-available/agent_assistant /etc/nginx/sites-enabled/agent_assistant
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx
echo "[$(date)] Nginx configuration updated"

# Проверяем статус
echo "[$(date)] Checking container status..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env ps

echo "[$(date)] ✅ Deployment completed!"
echo "[$(date)] Services available at http://YOUR_SERVER_IP/"
