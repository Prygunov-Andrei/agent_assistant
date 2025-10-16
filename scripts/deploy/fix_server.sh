#!/bin/bash

SERVER="217.151.231.96"
PASSWORD="j7EF^1u+V?Zpz9"

echo "🔧 Исправление сервера после автодеплоя..."
echo ""

# Выполняем команды на сервере
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER << 'ENDSSH'
cd /opt/agent_assistant

echo "1️⃣  Текущая директория: $(pwd)"
echo ""

echo "2️⃣  Проверка структуры..."
ls -la docker/ | head -10
echo ""

echo "3️⃣  Остановка всех контейнеров..."
docker stop $(docker ps -q --filter "name=agent_assistant") 2>/dev/null
docker rm $(docker ps -aq --filter "name=agent_assistant") 2>/dev/null
echo "✅ Контейнеры остановлены"
echo ""

echo "4️⃣  Запуск с правильными путями..."
docker-compose -f docker/docker-compose.prod.yml --env-file .env up -d --build
echo "✅ Сервисы запускаются..."
echo ""

echo "5️⃣  Ожидание 30 секунд..."
sleep 30
echo ""

echo "6️⃣  Проверка статуса:"
docker ps --filter "name=agent_assistant" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "7️⃣  Проверка логов backend:"
docker logs agent_assistant_backend --tail 20
echo ""

ENDSSH

echo "✅ Готово!"
echo ""
echo "📱 Проверьте работу:"
echo "   http://217.151.231.96/"
echo ""

