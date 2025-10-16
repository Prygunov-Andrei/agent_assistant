#!/bin/bash

# Скрипт ПЕРВОНАЧАЛЬНОЙ установки Agent Assistant на production сервер
# Используйте этот скрипт ОДИН РАЗ при первом деплое
# Для последующих обновлений используйте deploy.sh

set -e

echo "[$(date)] =========================================="
echo "[$(date)] INITIAL PRODUCTION DEPLOYMENT"
echo "[$(date)] =========================================="

# Переходим в директорию проекта
cd /opt/agent_assistant

# Создаем необходимые папки
echo "[$(date)] Creating required directories..."
mkdir -p backend/logs backend/staticfiles
chmod 777 backend/logs backend/staticfiles

# Собираем все контейнеры С НУЛЯ
echo "[$(date)] Building all containers (this may take 5-10 minutes)..."
docker-compose -f docker-compose.prod.yml build

# Запускаем все сервисы
echo "[$(date)] Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Ждем запуска базы данных
echo "[$(date)] Waiting for database to be ready..."
sleep 20

# Выполняем миграции
echo "[$(date)] Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Собираем статические файлы
echo "[$(date)] Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# Проверяем статус
echo "[$(date)] Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "[$(date)] =========================================="
echo "[$(date)] ✅ INITIAL DEPLOYMENT COMPLETED!"
echo "[$(date)] =========================================="
echo "[$(date)] Services available at:"
echo "[$(date)]   - Frontend: http://YOUR_SERVER_IP/"
echo "[$(date)]   - Backend API: http://YOUR_SERVER_IP/api/"
echo "[$(date)]   - Django Admin: http://YOUR_SERVER_IP/admin/"
echo "[$(date)]"
echo "[$(date)] For future updates, use: ./deploy.sh"

