# 🤖 Telegram Bot для Agent Assistant

Бот для приёма заявок на кастинг через Telegram.

## 📋 Требования

- Docker и Docker Compose
- Telegram Bot Token (получить у [@BotFather](https://t.me/botfather))
- Запущенный backend сервис

## 🚀 Быстрый старт

### 1. Создайте бота в Telegram

```
1. Откройте @BotFather в Telegram
2. Отправьте команду /newbot
3. Следуйте инструкциям
4. Скопируйте полученный токен
```

### 2. Добавьте токен в .env

```bash
# В корне проекта добавьте в .env:
BOT_TOKEN=your_bot_token_here
API_BASE_URL=http://backend:8000/api
```

### 3. Запустите бота

```bash
# Из корня проекта:
docker-compose -f docker-compose.bot.yml up -d --build
```

### 4. Проверьте логи

```bash
docker logs -f agent_assistant_telegram_bot
```

Вы должны увидеть:
```
INFO - Запуск бота...
INFO - Application started
```

## 🎯 Использование

### Команды бота:

- `/start` - Начать работу с ботом
- `/status` - Проверить статус бота
- `/help` - Показать справку

### Отправка заявок:

1. Перешлите боту сообщение с описанием проекта
2. Можно прикрепить фото или документы
3. Бот автоматически создаст запрос в системе

## ⚙️ Конфигурация

### Переменные окружения:

```bash
# Обязательные
BOT_TOKEN=your_telegram_bot_token     # Токен бота от @BotFather
API_BASE_URL=http://backend:8000/api  # URL backend API (имя сервиса!)

# Опциональные
WEBHOOK_URL=                          # Для webhook режима (оставить пустым для polling)
```

### ⚠️ КРИТИЧЕСКИ ВАЖНО:

**Используйте имя сервиса `backend`, НЕ `localhost` и НЕ имя контейнера!**

- ✅ Правильно: `API_BASE_URL=http://backend:8000/api`
- ❌ Неправильно: `API_BASE_URL=http://localhost:8000/api`
- ❌ Неправильно: `API_BASE_URL=http://agent_assistant_backend:8000/api`

**Причина:** Docker networking работает через имена сервисов из docker-compose.yml. Имена с подчёркиваниями не валидны по RFC 1034/1035.

## 🛠️ Управление

### Остановить бота:
```bash
docker-compose -f docker-compose.bot.yml down
```

### Перезапустить бота:
```bash
docker-compose -f docker-compose.bot.yml restart
```

### Пересобрать и запустить:
```bash
docker-compose -f docker-compose.bot.yml up -d --build
```

### Просмотр логов:
```bash
# Последние 50 строк
docker logs --tail 50 agent_assistant_telegram_bot

# В реальном времени
docker logs -f agent_assistant_telegram_bot
```

## 🐛 Troubleshooting

### Проблема: "Connection refused"

**Ошибка:**
```
HTTPConnectionPool(host='localhost', port=8000): Max retries exceeded
```

**Решение:**
```bash
# 1. Проверьте API_BASE_URL в .env:
API_BASE_URL=http://backend:8000/api

# 2. Убедитесь что backend запущен:
docker-compose ps backend

# 3. Перезапустите бота:
docker-compose -f docker-compose.bot.yml down
docker-compose -f docker-compose.bot.yml up -d
```

### Проблема: "Invalid HTTP_HOST header"

**Ошибка:**
```
Invalid HTTP_HOST header: 'agent_assistant_backend:8000'
```

**Решение:**
```bash
# 1. Убедитесь что ALLOWED_HOSTS содержит 'backend':
# В .env:
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend

# 2. Перезапустите backend:
docker-compose restart backend

# 3. Перезапустите бота:
docker-compose -f docker-compose.bot.yml restart
```

### Проблема: Бот не отвечает

**Решение:**
```bash
# 1. Проверьте логи:
docker logs agent_assistant_telegram_bot

# 2. Проверьте статус:
docker-compose -f docker-compose.bot.yml ps

# 3. Проверьте токен:
# Откройте @BotFather и отправьте /token
# Убедитесь что токен в .env совпадает

# 4. Перезапустите:
docker-compose -f docker-compose.bot.yml down
docker-compose -f docker-compose.bot.yml up -d
```

## 📊 Мониторинг

### Проверка здоровья:
```bash
# Статус контейнера
docker ps | grep telegram_bot

# Использование ресурсов
docker stats agent_assistant_telegram_bot

# Последние логи
docker logs --tail 100 agent_assistant_telegram_bot
```

## 🌐 Продакшн деплой

### На удалённом сервере:

```bash
# 1. SSH на сервер
ssh user@your-server.com

# 2. Перейти в проект
cd agent_assistant

# 3. Обновить код
git pull

# 4. Настроить .env с продакшн значениями
nano .env

# 5. Запустить бота
docker-compose -f docker-compose.bot.yml up -d --build

# 6. Проверить
docker logs -f agent_assistant_telegram_bot
```

### Для webhook режима (опционально):

```bash
# В .env:
WEBHOOK_URL=https://yourdomain.com/webhook/telegram/

# Перезапустить:
docker-compose -f docker-compose.bot.yml down
docker-compose -f docker-compose.bot.yml up -d
```

## 📝 Архитектура

```
Telegram API
     ↓
  Telegram Bot (Docker контейнер)
     ↓
  Backend API (http://backend:8000/api)
     ↓
  Django + PostgreSQL
```

**Важно:** Бот и Backend общаются через Docker network `agent_assistant_agent_network`.

## ✅ Checklist перед деплоем:

- [ ] BOT_TOKEN добавлен в .env
- [ ] API_BASE_URL=http://backend:8000/api (используется имя сервиса!)
- [ ] ALLOWED_HOSTS в backend содержит 'backend'
- [ ] Backend сервис запущен и здоров
- [ ] Бот в той же Docker сети что и backend
- [ ] Логи проверены - нет ошибок
- [ ] Бот отвечает на команду /start

---

**Готово!** Бот запущен и готов принимать заявки! 🎉
