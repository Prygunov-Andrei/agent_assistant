# 🔄 Руководство по переключению Telegram бота

## 📋 Общая информация

Telegram bot token может использоваться **только одним** экземпляром бота одновременно.

Для разработки и тестирования бота мы используем систему переключения:
- **Локальный бот** → подключен к локальному backend (http://localhost:8000/api)
- **Удаленный бот** → подключен к production backend (http://188.225.75.124/api)

---

## 🚀 Быстрый старт

### Переключить на локальный бот

```bash
./bot_switch_to_local.sh
```

**Что происходит:**
1. ✅ Останавливает бота на удаленном сервере
2. ✅ Проверяет локальное окружение
3. ✅ Запускает локального бота

**После выполнения:**
- Бот работает локально и подключен к вашему локальному backend
- Можете разрабатывать и тестировать изменения
- Все сообщения в Telegram обрабатываются локальным backend

---

### Вернуть бота на сервер

```bash
./bot_switch_to_remote.sh
```

**Что происходит:**
1. ✅ Останавливает локального бота
2. ✅ Запускает бота на удаленном сервере

**После выполнения:**
- Бот работает на production сервере
- Обрабатывает запросы в production базе данных
- Готов к нормальной работе

---

## 📝 Типичный рабочий процесс

### Начало работы над ботом

```bash
# 1. Убедитесь что локальный backend запущен
docker-compose up -d backend db

# 2. Переключите бота на локальный режим
./bot_switch_to_local.sh

# 3. Начинайте разработку!
# Все изменения в backend/telegram_requests/bot/ будут применяться
```

### Тестирование изменений

```bash
# Смотрите логи бота в реальном времени
docker logs -f agent_assistant_telegram_bot_local

# Отправьте тестовое сообщение в Telegram
# Проверьте что оно обработалось правильно
```

### Деплой изменений

```bash
# 1. Закоммитьте изменения
git add .
git commit -m "Улучшения бота"

# 2. Отправьте на GitHub
git push origin main

# 3. Автодеплой запустится автоматически на сервере!

# 4. После успешного деплоя верните бота на сервер
./bot_switch_to_remote.sh
```

---

## 🛠️ Полезные команды

### Локальный бот

```bash
# Запуск (через скрипт)
./bot_switch_to_local.sh

# Просмотр логов
docker logs -f agent_assistant_telegram_bot_local

# Перезапуск
docker-compose -f docker-compose.bot.local.yml restart

# Остановка
docker-compose -f docker-compose.bot.local.yml down

# Пересборка и запуск
docker-compose -f docker-compose.bot.local.yml up -d --build
```

### Удаленный бот

```bash
# Запуск (через скрипт)
./bot_switch_to_remote.sh

# Просмотр логов
ssh root@188.225.75.124
cd /opt/agent_assistant
docker-compose -f docker-compose.prod.yml logs -f telegram-bot

# Статус
ssh root@188.225.75.124 "cd /opt/agent_assistant && docker-compose -f docker-compose.prod.yml ps telegram-bot"
```

---

## ⚙️ Конфигурация

### Локальный бот
- **Конфиг:** `docker-compose.bot.local.yml`
- **API URL:** `http://host.docker.internal:8000/api`
- **Контейнер:** `agent_assistant_telegram_bot_local`

### Удаленный бот
- **Конфиг:** `docker-compose.prod.yml`
- **API URL:** `http://backend:8000/api`
- **Сервер:** `217.151.231.96`

---

## 🔍 Проверка статуса

### Где сейчас работает бот?

```bash
# Локально
docker ps | grep telegram_bot_local

# Удаленно
ssh root@217.151.231.96 "docker ps | grep telegram-bot"
```

Должен работать **только один**!

---

## ⚠️ Важные замечания

### Перед началом работы с локальным ботом:

✅ **Убедитесь что локальный backend запущен:**
```bash
curl http://localhost:8000/api/
# Должен вернуть JSON ответ
```

✅ **Убедитесь что .env файл настроен:**
```bash
grep BOT_TOKEN .env
# Должен показать ваш bot token
```

### После завершения работы:

✅ **Всегда возвращайте бота на сервер:**
```bash
./bot_switch_to_remote.sh
```

❌ **НЕ коммитьте с запущенным локальным ботом!**
Сначала верните бота на сервер, потом делайте push.

---

## 🐛 Troubleshooting

### Бот не отвечает

```bash
# 1. Проверьте логи
docker logs agent_assistant_telegram_bot_local

# 2. Проверьте что backend доступен
curl http://localhost:8000/api/

# 3. Перезапустите бота
docker-compose -f docker-compose.bot.local.yml restart
```

### Ошибка "Connection refused"

**Проблема:** Локальный бот не может подключиться к backend

**Решение:**
```bash
# Убедитесь что backend запущен
docker-compose up -d backend db

# Проверьте что порт 8000 доступен
curl http://localhost:8000/api/
```

### Оба бота не работают

**Проблема:** Случайно остановили оба бота

**Решение:**
```bash
# Запустите удаленного (production всегда важнее)
./bot_switch_to_remote.sh

# Или локального (для разработки)
./bot_switch_to_local.sh
```

### Ошибка при SSH подключении

**Проблема:** Не удается подключиться к серверу

**Решение:**
```bash
# Проверьте доступность сервера
ping 217.151.231.96

# Проверьте SSH ключи
ssh root@217.151.231.96 "echo OK"
```

---

## 📊 Архитектура

```
┌─────────────────────────────────────────────┐
│            ЛОКАЛЬНАЯ РАЗРАБОТКА             │
├─────────────────────────────────────────────┤
│                                             │
│  Telegram API                               │
│       ↓                                     │
│  Локальный Бот (Docker)                     │
│       ↓                                     │
│  http://host.docker.internal:8000/api       │
│       ↓                                     │
│  Локальный Backend (Docker)                 │
│       ↓                                     │
│  Локальная PostgreSQL (Docker)              │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│               PRODUCTION                    │
├─────────────────────────────────────────────┤
│                                             │
│  Telegram API                               │
│       ↓                                     │
│  Удаленный Бот (Docker на сервере)          │
│       ↓                                     │
│  http://backend:8000/api                    │
│       ↓                                     │
│  Production Backend (Docker на сервере)     │
│       ↓                                     │
│  Production PostgreSQL (Docker на сервере)  │
│  Сервер: 217.151.231.96                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist

### Перед началом разработки:
- [ ] Локальный backend запущен (`docker-compose up -d backend db`)
- [ ] .env файл настроен с BOT_TOKEN
- [ ] Запущен `./bot_switch_to_local.sh`
- [ ] Бот отвечает на тестовые сообщения

### Перед деплоем:
- [ ] Все изменения протестированы локально
- [ ] Код закоммичен
- [ ] Запущен `./bot_switch_to_remote.sh`
- [ ] Выполнен `git push origin main`
- [ ] Автодеплой успешно завершился

### После деплоя:
- [ ] Удаленный бот запущен
- [ ] Бот отвечает на сообщения
- [ ] Логи не содержат ошибок

---

**Готово к работе!** 🚀

