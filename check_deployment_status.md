# Как проверить статус автоматического деплоя

## 1. Проверить webhook на GitHub

1. Откройте: https://github.com/Prygunov-Andrei/agent_assistant/settings/hooks
2. Найдите webhook с URL `http://217.151.231.96:9000/deploy`
3. Нажмите на него
4. Прокрутите вниз до "Recent Deliveries"
5. Найдите последнюю доставку (самую верхнюю)
6. Проверьте:
   - **Response code**: должен быть 200 (успешно)
   - **Response body**: должно быть `{"status": "success", "message": "Deployment started in background"}`

## 2. Проверить на сервере (если есть SSH доступ)

```bash
# Подключиться к серверу
ssh root@217.151.231.96

# Проверить логи webhook
tail -50 /opt/agent_assistant/webhook.log

# Проверить логи деплоя (САМОЕ ВАЖНОЕ)
tail -200 /opt/agent_assistant/deploy_output.log

# Проверить статус контейнеров
cd /opt/agent_assistant
docker-compose -f docker/docker-compose.prod.yml ps

# Проверить логи backend
docker-compose -f docker/docker-compose.prod.yml logs --tail=50 backend

# Проверить логи frontend
docker-compose -f docker/docker-compose.prod.yml logs --tail=50 frontend
```

## 3. Проверить работу сайта

1. Откройте в браузере: http://217.151.231.96
2. Войдите в систему (admin / admin)
3. Перейдите в "Настройки"
4. Проверьте вкладку "Импорт персон"
5. Если показывает старую версию - обновите: **Ctrl+Shift+R**

## 4. Проверить API endpoints

```bash
# Проверить template endpoint
curl -I http://217.151.231.96/api/people/bulk-import/template/

# Должен вернуть 401 Unauthorized (требует авторизации)
```

## 5. Что делать если деплой не прошел

### Если webhook не сработал (на GitHub показывает ошибку):

```bash
# Подключиться к серверу и запустить деплой вручную
ssh root@217.151.231.96
cd /opt/agent_assistant
./scripts/deploy/deploy.sh
```

### Если контейнеры не запускаются:

```bash
# Проверить логи
docker-compose -f docker/docker-compose.prod.yml logs --tail=100

# Проверить что .env файл существует
cat .env | head -5

# Перезапустить вручную
docker-compose -f docker/docker-compose.prod.yml --env-file .env down
docker-compose -f docker/docker-compose.prod.yml --env-file .env up -d --build
```

## 6. Ожидаемый результат успешного деплоя

После успешного деплоя:

✅ Все контейнеры запущены и healthy:
- agent_assistant_db (postgres)
- agent_assistant_redis
- agent_assistant_backend
- agent_assistant_frontend
- agent_assistant_telegram_bot

✅ Миграция 0008_importsession применена

✅ Шаблон Excel создан в `/app/people/templates/person_import_template.xlsx`

✅ Frontend показывает новую страницу настроек с импортом

✅ API endpoints работают:
- `/api/people/bulk-import/upload/`
- `/api/people/bulk-import/confirm/`
- `/api/people/bulk-import/template/`

## 7. Критические моменты

⚠️ **Если backend падает с "SECRET_KEY must not be empty":**
- Проблема: скрипт деплоя не использует `--env-file .env`
- Решение: исправлено в deploy.sh (все команды с --env-file)

⚠️ **Если frontend показывает старую версию:**
- Проблема: кэш браузера
- Решение: Ctrl+Shift+R в браузере

⚠️ **Если не скачивается шаблон Excel:**
- Проверить что файл создался: `docker exec agent_assistant_backend ls -la /app/people/templates/`
- Проверить endpoint: `curl -I http://217.151.231.96/api/people/bulk-import/template/`

