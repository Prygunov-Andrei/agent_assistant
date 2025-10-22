# 🤖 Telegram бот - Руководство по управлению

## Обзор

Telegram бот получает запросы от кастинг-директоров и передает их в систему для обработки.

**Важно:** Один токен Telegram = один активный бот. Запуск нескольких экземпляров одновременно вызовет конфликты!

---

## 🔥 Локальная разработка (DEV режим)

### Запуск при старте проекта

```bash
./scripts/deploy/start_dev.sh

# Скрипт спросит: "Запустить Telegram бота? (y/n)"
# - y → бот запустится автоматически
# - n → бот не запустится (можно запустить позже)
```

### Включение/выключение бота

```bash
# Toggle скрипт - автоматически определяет статус
./scripts/bot/bot_dev_toggle.sh

# Если бот запущен → остановит
# Если бот остановлен → запустит
```

### Проверка дубликатов

```bash
# Проверить нет ли нескольких экземпляров
./scripts/bot/bot_check_duplicates.sh

# Если найдены дубликаты - предложит остановить все
```

### Просмотр логов

```bash
# Логи dev бота
docker logs -f agent_assistant_telegram_bot_dev

# Или через docker-compose
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  -f docker/docker-compose.bot.dev.yml \
  logs -f telegram-bot
```

---

## 🚀 Production режим

### Автоматический запуск

На production сервере бот запускается автоматически вместе с основным деплоем:

```bash
# На сервере при деплое
docker-compose -f docker/docker-compose.prod.yml up -d

# Бот включен в docker-compose.prod.yml
```

### Управление на production

```bash
# SSH на сервер
ssh root@YOUR_SERVER_IP
cd /opt/agent_assistant

# Логи бота
docker-compose -f docker/docker-compose.prod.yml logs -f telegram-bot

# Перезапуск бота
docker-compose -f docker/docker-compose.prod.yml restart telegram-bot

# Остановка бота
docker-compose -f docker/docker-compose.prod.yml stop telegram-bot
```

---

## 🔄 Переключение токена (Local ↔ Remote)

**Сценарий:** Вы хотите протестировать бота локально с реальным токеном, который сейчас используется на production сервере.

### Переключение на локальный

```bash
./scripts/bot/bot_switch_to_local.sh
```

**Что происходит:**
1. Останавливает бота на production сервере (через SSH)
2. Ждет 15 сек (освобождение токена Telegram)
3. Запускает бота локально
4. Локальный бот подключается к локальному backend

### Возврат на production

```bash
./scripts/bot/bot_switch_to_remote.sh
```

**Что происходит:**
1. Останавливает локального бота
2. Ждет 15 сек (освобождение токена)
3. Запускает бота на production сервере (через SSH)

**⚠️ Важно:**
- Для работы нужен SSH доступ к серверу
- Проверьте `SSH_KEY` в скриптах (по умолчанию `~/.ssh/id_rsa_server`)
- Эти скрипты НЕ для ежедневной разработки, только для тестирования!

---

## 🗂️ Структура файлов

### Docker Compose конфигурации

```
docker/
├── docker-compose.bot.dev.yml    # DEV режим (используется с docker-compose.dev.yml)
├── docker-compose.bot.yml         # Для переключения local/remote (устарел)
├── docker-compose.bot.local.yml   # Для переключения на локальный (устарел)
└── docker-compose.prod.yml        # Production (бот внутри)
```

### Скрипты управления

```
scripts/bot/
├── bot_dev_toggle.sh              # ✅ Вкл/Выкл в DEV режиме
├── bot_check_duplicates.sh        # ✅ Проверка дубликатов
├── bot_switch_to_local.sh         # ✅ Переключение токена на локальный
├── bot_switch_to_remote.sh        # ✅ Переключение токена на production
├── bot_start_docker.sh            # ⚠️  Устарел (используйте bot_dev_toggle.sh)
└── bot_stop_docker.sh             # ⚠️  Устарел (используйте bot_dev_toggle.sh)
```

---

## 🐛 Troubleshooting

### Бот не запускается

**Проблема:** `docker logs agent_assistant_telegram_bot_dev` показывает ошибку.

**Решения:**

1. **Проверить BOT_TOKEN:**
   ```bash
   grep BOT_TOKEN .env
   # Должен быть непустой токен от @BotFather
   ```

2. **Проверить backend:**
   ```bash
   docker ps | grep backend
   # Backend должен быть запущен
   
   curl http://localhost:8000/api/
   # Должен ответить (может быть 404 или 401, но не "connection refused")
   ```

3. **Проверить сеть:**
   ```bash
   docker network inspect docker_agent_network
   # Бот и backend должны быть в одной сети
   ```

### Ошибка "Conflict: terminated by other getUpdates"

**Причина:** Запущено несколько экземпляров бота с одним токеном.

**Решение:**
```bash
# Проверить дубликаты
./scripts/bot/bot_check_duplicates.sh

# Остановить все боты
docker stop $(docker ps -q --filter "name=telegram")
docker rm $(docker ps -aq --filter "name=telegram")

# Запустить только нужного
./scripts/bot/bot_dev_toggle.sh
```

### Бот запущен но не отвечает

**Проблема:** Бот показывает "healthy" но не обрабатывает сообщения.

**Решения:**

1. **Проверить логи:**
   ```bash
   docker logs -f agent_assistant_telegram_bot_dev
   # Ищите ошибки подключения к API
   ```

2. **Проверить API_BASE_URL:**
   ```bash
   docker exec agent_assistant_telegram_bot_dev env | grep API_BASE_URL
   # Должно быть: http://backend:8000/api
   ```

3. **Проверить доступность API из контейнера:**
   ```bash
   docker exec agent_assistant_telegram_bot_dev curl -I http://backend:8000/api/
   # Должен ответить 200 или 401 (но не connection refused)
   ```

### Бот на production конфликтует с локальным

**Проблема:** Запустили локального бота, забыв остановить production.

**Решение:**
```bash
# 1. Остановить локального
./scripts/bot/bot_dev_toggle.sh

# 2. Проверить что production работает
ssh root@YOUR_SERVER_IP "docker ps | grep telegram"

# 3. Если нужно - перезапустить production
./scripts/bot/bot_switch_to_remote.sh
```

---

## 📝 Best Practices

### Для ежедневной разработки:

1. **НЕ запускайте бота если он не нужен для текущей задачи**
   - Backend и Frontend работают независимо
   - Бот нужен только для тестирования Telegram интеграции

2. **Используйте `bot_dev_toggle.sh` для управления**
   - Удобный toggle вкл/выкл
   - Автоматически показывает логи

3. **Проверяйте дубликаты перед запуском**
   ```bash
   ./scripts/bot/bot_check_duplicates.sh
   ```

### Для тестирования с production токеном:

1. **Предупредите команду** - вы временно "заберете" бота с production

2. **Используйте скрипты переключения:**
   ```bash
   # Взять токен
   ./scripts/bot/bot_switch_to_local.sh
   
   # Тестируете...
   
   # Вернуть токен
   ./scripts/bot/bot_switch_to_remote.sh
   ```

3. **Не забудьте вернуть токен** на production после тестирования!

### Для production:

1. **Не трогайте production бота во время работы**
   - Бот запускается автоматически при деплое
   - Перезапускается при падении (restart: unless-stopped)

2. **Мониторьте логи:**
   ```bash
   ssh root@YOUR_SERVER_IP
   docker-compose -f docker/docker-compose.prod.yml logs -f telegram-bot
   ```

3. **При проблемах - проверьте healthcheck:**
   ```bash
   docker inspect agent_assistant_telegram_bot | grep -A 10 Health
   ```

---

## 🎯 Workflow примеры

### Сценарий 1: Разработка без бота

```bash
# 1. Запуск проекта
./scripts/deploy/start_dev.sh
# Выбираем "n" на вопрос про бота

# 2. Разработка backend/frontend
# ... работаем с кодом ...

# 3. Остановка
./scripts/deploy/stop_all.sh
```

### Сценарий 2: Тестирование Telegram интеграции

```bash
# 1. Запуск проекта с ботом
./scripts/deploy/start_dev.sh
# Выбираем "y" на вопрос про бота

# 2. Тестируем в Telegram
# Отправляем сообщения боту, проверяем обработку

# 3. Смотрим логи
docker logs -f agent_assistant_telegram_bot_dev

# 4. Если нужно перезапустить бота
./scripts/bot/bot_dev_toggle.sh  # Выкл
./scripts/bot/bot_dev_toggle.sh  # Вкл

# 5. Остановка
./scripts/deploy/stop_all.sh
```

### Сценарий 3: Тестирование с production данными

```bash
# 1. Предупредить команду!
# Вы временно заберете бота с production

# 2. Переключить токен
./scripts/bot/bot_switch_to_local.sh

# 3. Тестирование
# Бот теперь работает локально

# 4. Вернуть токен
./scripts/bot/bot_switch_to_remote.sh
```

---

## 📚 Дополнительная информация

- **Исходный код бота:** `backend/telegram_requests/bot/bot.py`
- **Dockerfile бота:** `backend/telegram_requests/bot/Dockerfile`
- **Общая документация:** [docs/bot/BOT_SWITCH_GUIDE.md](../bot/BOT_SWITCH_GUIDE.md)
- **Документация DEV режима:** [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

---

**Теперь управление ботом простое и предсказуемое! 🎉**

