# ⚡ Быстрый старт Agent Assistant

> **3 команды для запуска проекта**

---

## 🚀 Локальная разработка

### Запуск всего проекта

```bash
./scripts/deploy/start_dev.sh
```

**Что запустится:**
- ✅ PostgreSQL база данных
- ✅ Redis
- ✅ Backend (Django с hot reload)
- ✅ Frontend (Vite с HMR)
- ✅ Nginx
- 🤖 Telegram бот (опционально, скрипт спросит)

**Доступ:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

### Остановка проекта

```bash
./scripts/deploy/stop_all.sh
```

Останавливает все контейнеры и очищает ресурсы.

---

## 🤖 Управление Telegram ботом

### Включить/выключить бота

```bash
./scripts/bot/bot_dev_toggle.sh
```

Toggle скрипт - автоматически определяет статус и переключает.

### Проверка дубликатов

```bash
./scripts/bot/bot_check_duplicates.sh
```

Проверяет нет ли нескольких экземпляров бота (один токен = один бот).

---

## 🔥 Hot Reload - работает автоматически!

После запуска просто редактируйте код:

**Backend (Python):**
- Изменения в `.py` файлах → автоперезагрузка Django за 1-2 сек

**Frontend (React/TypeScript):**
- Изменения в `.tsx/.ts/.css` → мгновенное обновление в браузере (HMR)

**НЕ НУЖНО пересобирать контейнеры!**

---

## 📊 Просмотр логов

```bash
# Все сервисы
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f

# Только backend
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f backend

# Только frontend
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f frontend

# Telegram бот
docker logs -f agent_assistant_telegram_bot_dev
```

---

## 🐛 Что делать если не работает?

### Backend не запускается

```bash
# Проверить логи
docker logs agent_assistant_backend

# Перезапустить
./scripts/deploy/stop_all.sh
./scripts/deploy/start_dev.sh
```

### Frontend показывает белый экран

```bash
# Проверить логи
docker logs agent_assistant_frontend

# Очистить кэш браузера: Cmd+Shift+R (Mac) или Ctrl+Shift+R (Windows/Linux)
```

### Бот не отвечает

```bash
# Проверить запущен ли
./scripts/bot/bot_check_duplicates.sh

# Перезапустить
./scripts/bot/bot_dev_toggle.sh  # Выкл
./scripts/bot/bot_dev_toggle.sh  # Вкл
```

### База данных не запускается

```bash
# Полная очистка и перезапуск (⚠️ удалит данные!)
docker-compose -f docker/docker-compose.yml down -v
./scripts/deploy/start_dev.sh
```

---

## 📚 Полная документация

Нужна дополнительная информация?

| Тема | Документ |
|------|----------|
| **Локальная разработка** | [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) ⭐ |
| **Telegram бот** | [TELEGRAM_BOT_GUIDE.md](TELEGRAM_BOT_GUIDE.md) |
| **Production деплой** | [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md) |
| **Автодеплой** | [GITHUB_WEBHOOK_SETUP.md](GITHUB_WEBHOOK_SETUP.md) |
| **Резервные копии** | [EMAIL_BACKUP_QUICK_SETUP.md](EMAIL_BACKUP_QUICK_SETUP.md) |

---

## ✅ Checklist первого запуска

- [ ] Docker установлен и запущен
- [ ] Файл `.env` создан (скопировать из `.env.example`)
- [ ] В `.env` заполнены: `SECRET_KEY`, `BOT_TOKEN`, `OPENAI_API_KEY`
- [ ] Выполнен `./scripts/deploy/start_dev.sh`
- [ ] Frontend открывается на http://localhost:3000
- [ ] Backend отвечает на http://localhost:8000/api/

---

**Готово! Можно начинать разработку! 🎉**

