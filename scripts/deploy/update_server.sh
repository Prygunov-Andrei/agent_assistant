#!/bin/bash

# Скрипт для обновления сервера после реорганизации проекта

SERVER="217.151.231.96"
PASSWORD="j7EF^1u+V?Zpz9"

echo "🚀 Обновление сервера после реорганизации..."
echo ""

# Функция для выполнения команд на сервере
run_remote() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER "$1"
}

# 1. Проверка структуры
echo "1️⃣  Проверка текущей структуры на сервере..."
run_remote "cd /opt/agent_assistant && ls -la docker/ 2>/dev/null | head -5 || echo 'Папка docker/ не найдена - деплой еще не выполнен'"
echo ""

# 2. Проверка .env
echo "2️⃣  Проверка SECRET_KEY..."
SECRET_CHECK=$(run_remote "cd /opt/agent_assistant && grep 'SECRET_KEY' .env 2>/dev/null || echo 'not_found'")
echo "$SECRET_CHECK"

if echo "$SECRET_CHECK" | grep -q '\$'; then
    echo "⚠️  ВНИМАНИЕ: SECRET_KEY содержит спецсимвол \$ - нужно заменить!"
    echo ""
    
    # Генерируем новый ключ
    NEW_KEY=$(python3 -c "import secrets, string; chars = string.ascii_letters + string.digits + '-_'; print(''.join(secrets.choice(chars) for _ in range(50)))")
    
    echo "Сгенерирован новый SECRET_KEY без спецсимволов"
    echo "Обновляю на сервере..."
    
    run_remote "cd /opt/agent_assistant && sed -i.bak 's/^SECRET_KEY=.*/SECRET_KEY=$NEW_KEY/' .env && rm -f .env.bak"
    echo "✅ SECRET_KEY обновлён"
fi
echo ""

# 3. Остановка старых контейнеров
echo "3️⃣  Остановка всех контейнеров..."
run_remote "cd /opt/agent_assistant && docker stop \$(docker ps -q --filter 'name=agent_assistant') 2>/dev/null; docker rm \$(docker ps -aq --filter 'name=agent_assistant') 2>/dev/null; echo 'Контейнеры остановлены'"
echo ""

# 4. Удаление старых volumes (если нужно пересоздать БД)
echo "4️⃣  Удаление старых volumes..."
run_remote "cd /opt/agent_assistant && docker volume rm \$(docker volume ls -q | grep agent_assistant) 2>/dev/null; echo 'Volumes удалены'"
echo ""

# 5. Запуск через новый скрипт
echo "5️⃣  Запуск через обновлённый deploy.sh..."
run_remote "cd /opt/agent_assistant && bash scripts/deploy/deploy.sh 2>&1 | tail -20"
echo ""

# 6. Проверка статуса
echo "6️⃣  Финальная проверка статуса..."
sleep 10
run_remote "docker ps --filter 'name=agent_assistant' --format 'table {{.Names}}\t{{.Status}}'"
echo ""

echo "✅ Обновление сервера завершено!"
echo ""
echo "📱 Проверьте работу:"
echo "   Frontend: http://217.151.231.96/"
echo "   Backend:  http://217.151.231.96/api/"
echo "   Admin:    http://217.151.231.96/admin/"
echo ""

