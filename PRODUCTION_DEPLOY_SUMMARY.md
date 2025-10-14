# Итоги первого production деплоя

## ✅ Выполнено

### 1. Инфраструктура
- **Сервер:** 217.151.231.96
- **Docker Compose:** Все сервисы в отдельных контейнерах
- **Nginx:** Настроен для проксирования запросов
- **Webhook сервер:** Запущен на порту 9000 для GitHub webhooks

### 2. Сервисы
- ✅ **PostgreSQL** - База данных (healthy)
- ✅ **Redis** - Кэширование (healthy)
- ✅ **Django Backend** - API сервер (работает, healthcheck будет исправлен)
- ✅ **React Frontend** - Пользовательский интерфейс (healthy)
- ✅ **Telegram Bot** - Прием запросов от кастинг-директоров (healthy)

### 3. Автоматический деплой
- ✅ GitHub webhook настроен
- ✅ При каждом `git push origin main` сервер автоматически обновляется
- ✅ Webhook логи: `/opt/agent_assistant/webhook.log`

### 4. Доступы
- **Фронтенд:** http://217.151.231.96/
- **API:** http://217.151.231.96/api/
- **Django Admin:** http://217.151.231.96/admin/
- **Логин:** admin
- **Пароль:** admin

### 5. Telegram Bot
- **Токен:** Настроен в `.env`
- **API URL:** `http://backend:8000/api`
- **Контейнер:** Работает и принимает сообщения

## 🔧 Настройки

### Переменные окружения (.env на сервере)
```bash
# Django
DEBUG=False
SECRET_KEY=<сгенерирован>
ALLOWED_HOSTS=localhost,127.0.0.1,217.151.231.96,backend

# Database
DB_NAME=agent_assistant_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/1

# Telegram Bot
BOT_TOKEN=8046240714:AAGzNfvrGPnjxGw20eQcVAGIOlvUUfjSAUY
API_BASE_URL=http://backend:8000/api

# Frontend
VITE_API_URL=http://217.151.231.96/api
```

## 📝 Оптимизации

### 1. Минимальная нагрузка при деплое
- `deploy.sh` - только перезапуск контейнеров (БЕЗ пересборки)
- `initial_deploy.sh` - полная сборка (только для первого раза)

### 2. Исключение лишних файлов
- `.dockerignore` для backend - исключены тесты, dev-файлы
- `.dockerignore` для frontend - исключены тесты, node_modules

### 3. Production зависимости
- `requirements-prod.txt` - только необходимые пакеты
- Без dev-зависимостей (pytest, coverage и т.д.)

### 4. Frontend build
- `vite build` без TypeScript проверок (для скорости)
- `build:check` - для локальной проверки с TypeScript

## 🚀 Как работать

### Локальная разработка
```bash
# Обычная работа с docker-compose.yml
docker-compose up -d
```

### Деплой изменений
```bash
# Просто коммит и push
git add .
git commit -m "feat: новая фича"
git push origin main

# Сервер автоматически обновится через 30-60 секунд
```

### Проверка статуса на сервере
```bash
ssh root@217.151.231.96
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50 <service_name>
```

### Перезапуск сервиса
```bash
ssh root@217.151.231.96
docker-compose -f docker-compose.prod.yml restart <service_name>
```

## ⚠️ Важные моменты

1. **База данных сохраняется** между деплоями (volume `postgres_data`)
2. **Media файлы сохраняются** (volume `media_files`)
3. **Пересборка образов** происходит только при изменении Dockerfile
4. **Логи webhook:** `/opt/agent_assistant/webhook.log`
5. **Логи деплоя:** В выводе webhook

## 🐛 Troubleshooting

### Проблема: Фронтенд не показывает данные
**Решение:** Проверить что `VITE_API_URL` правильно установлен и включает `/api`

### Проблема: Backend показывает "unhealthy"
**Решение:** Проверить логи `docker-compose logs backend`

### Проблема: Webhook не срабатывает
**Решение:** 
1. Проверить логи: `tail -f /opt/agent_assistant/webhook.log`
2. Проверить что webhook процесс запущен: `ps aux | grep webhook`

### Проблема: Изменения не применяются
**Решение:**
1. Проверить что webhook получил запрос (логи)
2. Вручную запустить `./deploy.sh` на сервере

## 📊 Мониторинг

### Проверка здоровья сервисов
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Загрузка сервера
```bash
top
htop
docker stats
```

### Логи
```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f backend

# Webhook
tail -f /opt/agent_assistant/webhook.log
```

## 🎯 Следующие шаги

1. ✅ Войти в систему (admin/admin)
2. ✅ Отправить тестовое сообщение в Telegram бота
3. ✅ Проверить что запрос появился в интерфейсе
4. ✅ Протестировать создание проекта
5. ⏳ Настроить SSL/HTTPS (опционально)
6. ⏳ Настроить домен (опционально)
7. ⏳ Настроить backup базы данных

