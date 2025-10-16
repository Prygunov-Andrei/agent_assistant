#!/bin/bash

# Скрипт для автоматического обновления webhook службы на сервере
# Запускается ОДИН РАЗ для исправления путей после реорганизации

SERVER="217.151.231.96"
PASSWORD="j7EF^1u+V?Zpz9"

echo "🔧 Обновление webhook службы на сервере..."
echo ""

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER << 'ENDSSH'
cd /opt/agent_assistant

echo "1️⃣  Проверка webhook службы..."
if [ -f /etc/systemd/system/webhook.service ]; then
    echo "✅ Служба найдена"
    cat /etc/systemd/system/webhook.service | grep ExecStart
else
    echo "❌ Служба не найдена"
    exit 1
fi
echo ""

echo "2️⃣  Обновление пути к webhook.py..."
sed -i 's|ExecStart=.*webhook.py|ExecStart=/usr/bin/python3 /opt/agent_assistant/scripts/webhook.py|' /etc/systemd/system/webhook.service
echo "✅ Путь обновлён"
echo ""

echo "3️⃣  Перезагрузка службы..."
systemctl daemon-reload
systemctl restart webhook
echo "✅ Служба перезапущена"
echo ""

echo "4️⃣  Проверка статуса..."
systemctl status webhook --no-pager | head -15
echo ""

echo "5️⃣  Проверка процесса..."
ps aux | grep webhook.py | grep -v grep
echo ""

ENDSSH

echo "✅ Webhook служба обновлена!"
echo ""
echo "Теперь автодеплой будет работать при каждом git push"
echo ""

