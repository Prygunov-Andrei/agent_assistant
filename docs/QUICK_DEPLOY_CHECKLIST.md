# ⚡ Быстрый чеклист для деплоя на продакшн

> **Краткая инструкция для быстрого развёртывания без долгих разбирательств с Docker**

---

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА (обязательно!)

### 1️⃣ Docker Networking

**ВСЕГДА используйте имена СЕРВИСОВ из docker-compose.yml, НЕ имена контейнеров:**

```bash
# ✅ ПРАВИЛЬНО:
API_BASE_URL=http://backend:8000/api
DB_HOST=db
REDIS_URL=redis://redis:6379/1

# ❌ НЕПРАВИЛЬНО:
API_BASE_URL=http://localhost:8000/api
API_BASE_URL=http://agent_assistant_backend:8000/api
DB_HOST=localhost
```

**Почему:** Имена контейнеров с подчёркиваниями не валидны по RFC 1034/1035. Docker использует имена сервисов для DNS.

### 2️⃣ ALLOWED_HOSTS в Django

```bash
# В .env ОБЯЗАТЕЛЬНО должно быть:
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend,yourdomain.com
```

**Без `backend` в списке - контейнеры не смогут общаться!**

### 3️⃣ Все сервисы в одной Docker сети

В `docker-compose.yml` и `docker-compose.bot.yml`:
```yaml
networks:
  - agent_network  # Одна и та же сеть!
```

---

## 📋 Checklist перед деплоем

### Шаг 1: Проверка .env файла

```bash
# Откройте .env и проверьте:
cat .env
```

**Обязательные параметры:**
- [ ] `DEBUG=False` (для продакшена)
- [ ] `SECRET_KEY=` (новый уникальный ключ)
- [ ] `ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend,yourdomain.com`
- [ ] `DB_HOST=db` (имя сервиса!)
- [ ] `DB_PASSWORD=` (сильный пароль)
- [ ] `REDIS_URL=redis://redis:6379/1` (имя сервиса!)
- [ ] `API_BASE_URL=http://backend:8000/api` (для бота)
- [ ] `BOT_TOKEN=` (токен бота)
- [ ] `OPENAI_API_KEY=` (API ключ)

### Шаг 2: Запуск сервисов

```bash
# 1. Остановить старые контейнеры (если есть)
docker-compose down

# 2. Пересобрать и запустить
docker-compose up -d --build

# 3. Проверить статус
docker-compose ps
```

Все сервисы должны быть в статусе `Up` и `healthy`.

### Шаг 3: Запуск Telegram бота

```bash
# 1. Запустить бота
docker-compose -f docker-compose.bot.yml up -d --build

# 2. Проверить логи
docker logs -f agent_assistant_telegram_bot

# Должны увидеть:
# INFO - Запуск бота...
# INFO - Application started
```

### Шаг 4: Финальная проверка

```bash
# 1. Все контейнеры работают?
docker-compose ps
docker-compose -f docker-compose.bot.yml ps

# 2. Backend отвечает?
curl http://localhost:8000/api/

# 3. Frontend загружается?
curl http://localhost:3000

# 4. Бот отвечает в Telegram?
# Отправьте боту команду /start
```

---

## 🐛 Быстрый troubleshooting

### Ошибка: "Connection refused"

```bash
# Проблема: API_BASE_URL указывает на localhost
# Решение:
sed -i '' 's|API_BASE_URL=http://localhost:8000/api|API_BASE_URL=http://backend:8000/api|g' .env
docker-compose restart backend
docker-compose -f docker-compose.bot.yml restart
```

### Ошибка: "Invalid HTTP_HOST header"

```bash
# Проблема: ALLOWED_HOSTS не содержит 'backend'
# Решение:
echo "ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend,yourdomain.com" >> .env
docker-compose restart backend
```

### Ошибка: Контейнер не запускается

```bash
# 1. Посмотреть логи
docker logs <container_name>

# 2. Пересобрать
docker-compose build <service_name>
docker-compose up -d <service_name>

# 3. Если не помогает - полная пересборка
docker-compose down -v
docker-compose up -d --build
```

---

## 🔧 После изменения .env

**ВСЕГДА перезапускайте контейнеры:**

```bash
# Для основных сервисов:
docker-compose restart backend frontend

# Для бота:
docker-compose -f docker-compose.bot.yml restart

# Или полный перезапуск:
docker-compose down && docker-compose up -d
```

---

## 📊 Команды для мониторинга

```bash
# Статус всех сервисов
docker-compose ps

# Логи backend
docker-compose logs -f backend

# Логи бота
docker logs -f agent_assistant_telegram_bot

# Использование ресурсов
docker stats

# Проверка сети
docker network inspect agent_assistant_agent_network
```

---

## 🎯 Типичная последовательность деплоя

```bash
# 1. Обновить код
git pull

# 2. Проверить .env
cat .env | grep -E "DEBUG|ALLOWED_HOSTS|API_BASE_URL|DB_HOST|REDIS_URL"

# 3. Остановить и пересобрать
docker-compose down
docker-compose build
docker-compose up -d

# 4. Применить миграции (если нужно)
docker-compose exec backend python manage.py migrate

# 5. Запустить бота
docker-compose -f docker-compose.bot.yml up -d --build

# 6. Проверить логи
docker-compose logs -f backend &
docker logs -f agent_assistant_telegram_bot &

# 7. Протестировать
# - Открыть http://localhost:3000
# - Отправить сообщение боту в Telegram
```

---

## ✅ Финальный чеклист

Перед тем как объявить "деплой готов":

- [ ] Все контейнеры в статусе `Up (healthy)`
- [ ] Backend отвечает на `/api/`
- [ ] Frontend загружается на `:3000`
- [ ] Бот отвечает на команду `/start` в Telegram
- [ ] Бот успешно создаёт запросы в системе
- [ ] Логи не содержат ошибок `Connection refused` или `Invalid HTTP_HOST`
- [ ] .env содержит правильные имена сервисов (`backend`, `db`, `redis`)
- [ ] ALLOWED_HOSTS содержит `backend`

---

## 📚 Полная документация

Для детальной информации смотрите:
- [DEPLOYMENT.md](../DEPLOYMENT.md) - полная инструкция по деплою
- [backend/telegram_requests/bot/README.md](../backend/telegram_requests/bot/README.md) - документация бота

---

**Готово!** Теперь деплой займёт 5 минут вместо часа! 🚀

