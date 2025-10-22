# Important Deployment Notes

> ⚠️ **Примечание:** Этот документ описывает правила для **PRODUCTION режима**.  
> Для локальной разработки используйте [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) и [QUICK_START.md](QUICK_START.md)

---

## ⚠️ Критически важная информация для PRODUCTION

## 🔴 Критически важные правила

### 1. ВСЕГДА используйте флаг `--env-file .env`

При **любых** ручных операциях с docker-compose:

```bash
# ✅ ПРАВИЛЬНО
docker-compose -f docker/docker-compose.yml --env-file .env up -d
docker-compose -f docker/docker-compose.yml --env-file .env restart backend
docker-compose -f docker/docker-compose.yml --env-file .env build frontend

# ❌ НЕПРАВИЛЬНО - backend упадет с ошибкой SECRET_KEY
docker-compose -f docker/docker-compose.yml up -d
docker-compose -f docker/docker-compose.yml restart backend
```

**Почему это важно:**
- Без `--env-file .env` переменные окружения не загружаются
- Backend не запустится (ошибка: "SECRET_KEY must not be empty")
- Telegram бот не подключится
- OpenAI API не будет работать

### 2. Используйте готовые скрипты

Скрипты уже содержат все необходимые флаги:

```bash
# Запустить всю систему
./scripts/deploy/start_all.sh

# Остановить всю систему
./scripts/deploy/stop_all.sh

# Пересобрать frontend после изменений
./scripts/deploy/rebuild_frontend.sh
```

### 3. После изменений frontend ОБЯЗАТЕЛЬНО пересобирать (только Production)

> 💡 **Примечание:** В локальной разработке с hot reload (см. [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)) пересборка НЕ НУЖНА - изменения применяются автоматически!

В production frontend работает в production mode - статические файлы компилируются при сборке Docker образа.

**После любых изменений в `frontend/src/` на production:**

```bash
./scripts/deploy/rebuild_frontend.sh
```

Или вручную:
```bash
docker-compose -f docker/docker-compose.prod.yml --env-file .env build --no-cache frontend
docker-compose -f docker/docker-compose.prod.yml --env-file .env restart frontend nginx
```

### 4. Очистка кэша браузера после деплоя

После обновления попросите пользователей обновить страницу:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

Или открыть в режиме инкогнито для проверки.

---

## 🛠️ Типичные проблемы и решения

### Проблема: Backend постоянно перезапускается

**Причина:** Не указан `--env-file .env`

**Решение:**
```bash
./scripts/deploy/stop_all.sh
./scripts/deploy/start_all.sh
```

### Проблема: Frontend показывает старую версию

**Причина:** Не пересобран образ после изменений или кэш браузера

**Решение:**
```bash
./scripts/deploy/rebuild_frontend.sh
# И очистить кэш браузера (Ctrl+Shift+R)
```

### Проблема: Изменения в коде не отображаются

**Frontend:**
```bash
./scripts/deploy/rebuild_frontend.sh
```

**Backend:**
```bash
docker-compose -f docker/docker-compose.yml --env-file .env restart backend
```

---

## 📝 Checklist перед деплоем

- [ ] Файл `.env` создан и заполнен всеми ключами
- [ ] `SECRET_KEY` установлен (не пустой!)
- [ ] `DEBUG=False` для продакшена
- [ ] После изменений frontend выполнен `rebuild_frontend.sh`
- [ ] Все контейнеры запущены через `start_all.sh` или с флагом `--env-file .env`
- [ ] Проверено в режиме инкогнито браузера
- [ ] Backend отвечает на `http://localhost:8000/api/`
- [ ] Frontend отвечает на `http://localhost:3000/`

---

## 🚀 Правильная последовательность деплоя

### Первичный деплой:

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd agent_assistant

# 2. Создать .env
cp .env.example .env
# Заполнить все ключи в .env!

# 3. Запустить всё
./scripts/deploy/start_all.sh
```

### Обновление кода:

```bash
# 1. Получить изменения
git pull

# 2. Если менялся backend
docker-compose -f docker/docker-compose.yml --env-file .env build --no-cache backend
docker-compose -f docker/docker-compose.yml --env-file .env restart backend

# 3. Если менялся frontend
./scripts/deploy/rebuild_frontend.sh

# 4. Если менялись зависимости (requirements.txt, package.json)
./scripts/deploy/stop_all.sh
./scripts/deploy/start_all.sh

# 5. Если были миграции БД
docker-compose -f docker/docker-compose.yml --env-file .env exec backend python manage.py migrate
```

---

## 🎯 Памятка: Три золотых правила

1. **Всегда `--env-file .env`** при ручных командах docker-compose
2. **Всегда пересобирать frontend** после изменений в `frontend/src/`
3. **Всегда очищать кэш браузера** после обновления

---

## 📚 Дополнительная документация

- **Общий деплой:** `docs/deployment/DEPLOYMENT.md`
- **Cache-busting:** `docs/deployment/CACHE_BUSTING_GUIDE.md`
- **Production деплой:** `docs/deployment/DEPLOYMENT_PRODUCTION.md`
- **Массовый импорт:** `docs/planning/bulk_import_persons.md`

