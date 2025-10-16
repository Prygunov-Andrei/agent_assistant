# ⚠️ ВАЖНО: Обновление сервера после реорганизации проекта

## Что изменилось:
1. Docker-compose файлы переехали: `docker-compose.yml` → `docker/docker-compose.yml`
2. Скрипты переехали в `scripts/`
3. Документация переехала в `docs/`
4. Требуется параметр `--env-file .env` для всех команд docker-compose

## 🚨 ДЕЙСТВИЯ НА СЕРВЕРЕ ПОСЛЕ GIT PULL:

### 1. Остановить все сервисы
```bash
cd /opt/agent_assistant

# Остановить старым способом (если что-то еще работает)
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose down 2>/dev/null || true

# Остановить новым способом
docker-compose -f docker/docker-compose.prod.yml --env-file .env down
```

### 2. Проверить .env файл
```bash
# Убедитесь что SECRET_KEY НЕ содержит спецсимволов $ # & ( )
# Если содержит - сгенерируйте новый:
python3 -c "import secrets, string; chars = string.ascii_letters + string.digits + '-_'; print('SECRET_KEY=' + ''.join(secrets.choice(chars) for _ in range(50)))"
# Замените в .env файле
```

### 3. Запустить все сервисы заново
```bash
cd /opt/agent_assistant
docker-compose -f docker/docker-compose.prod.yml --env-file .env up -d --build
```

### 4. Проверить статус
```bash
docker ps --filter "name=agent_assistant"
docker logs agent_assistant_backend --tail 50
docker logs agent_assistant_telegram_bot --tail 50
```

### 5. Обновить systemd службу webhook (если используется)
Проверьте что пути правильные в `/etc/systemd/system/webhook.service`:
```bash
ExecStart=/usr/bin/python3 /opt/agent_assistant/scripts/webhook.py
```

Перезагрузите службу:
```bash
sudo systemctl daemon-reload
sudo systemctl restart webhook
sudo systemctl status webhook
```

## ✅ Проверка работоспособности:
- Frontend: http://YOUR_SERVER_IP/
- Backend API: http://YOUR_SERVER_IP/api/
- Admin: http://YOUR_SERVER_IP/admin/

## 📞 При проблемах:
1. Проверьте логи: `docker-compose -f docker/docker-compose.prod.yml --env-file .env logs -f`
2. Проверьте .env файл: `cat .env | grep -E "SECRET_KEY|DB_|BOT_TOKEN"`
3. Пересоздайте volumes если БД не запускается: `docker-compose -f docker/docker-compose.prod.yml --env-file .env down -v`

