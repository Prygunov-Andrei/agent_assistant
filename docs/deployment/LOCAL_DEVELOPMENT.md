# 🔥 Локальная разработка с Hot Reload

## Обзор

Настроен удобный workflow для локальной разработки с автоматическим применением изменений:

- **Backend**: Django `runserver` с автоперезагрузкой
- **Frontend**: Vite HMR (Hot Module Replacement) с мгновенным обновлением
- **НЕ ТРЕБУЕТСЯ** пересборка контейнеров при изменении кода!

---

## 🚀 Быстрый старт

### 1. Запуск в режиме разработки

```bash
./scripts/deploy/start_dev.sh
```

Эта команда:
- Запускает все сервисы (DB, Redis, Backend, Frontend, Nginx)
- Включает hot reload для backend и frontend
- Монтирует исходники в контейнеры

### 2. Разработка

Просто редактируйте код:

**Backend (Python/Django):**
- Измените любой `.py` файл
- Django runserver автоматически перезагрузится (~1-2 сек)
- Обновите страницу в браузере

**Frontend (TypeScript/React):**
- Измените любой `.tsx`, `.ts`, `.css` файл
- Vite HMR мгновенно обновит страницу (без перезагрузки!)
- Изменения видны сразу

### 3. Остановка

```bash
./scripts/deploy/stop_all.sh
```

---

## 📁 Структура конфигураций

```
docker/
├── docker-compose.yml          # Базовая конфигурация
├── docker-compose.dev.yml      # Override для разработки (hot reload)
└── docker-compose.prod.yml     # Production конфигурация

frontend/
├── Dockerfile                  # Development (Vite dev server)
└── Dockerfile.prod             # Production (Nginx + static build)

backend/
├── Dockerfile                  # Development
└── Dockerfile.prod             # Production
```

---

## 🔧 Технические детали

### Backend

**Development:**
```yaml
command: python manage.py runserver 0.0.0.0:8000
volumes:
  - ../backend:/app  # Исходники монтируются
environment:
  - DEBUG=True
  - PYTHONUNBUFFERED=1
```

**Production:**
```yaml
command: gunicorn agent_assistant.wsgi:application --bind 0.0.0.0:8000
volumes:
  - media_files:/app/media  # Только data volumes
  - static_files:/app/staticfiles
```

### Frontend

**Development:**
```yaml
command: npm run dev -- --host 0.0.0.0
volumes:
  - ../frontend/src:/app/src  # Исходники монтируются
  - ../frontend/vite.config.ts:/app/vite.config.ts
  - /app/node_modules  # Anonymous volume
environment:
  - CHOKIDAR_USEPOLLING=true  # Для Docker на macOS/Windows
```

**Production:**
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

---

## 💡 Лучшие практики

### 1. Всегда используйте start_dev.sh для локальной работы

```bash
# ✅ ПРАВИЛЬНО
./scripts/deploy/start_dev.sh

# ❌ НЕПРАВИЛЬНО (запустит production режим)
docker-compose -f docker/docker-compose.yml up -d
```

### 2. Проверяйте логи при отладке

```bash
# Backend логи
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  logs -f backend

# Frontend логи
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  logs -f frontend

# Все логи сразу
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  logs -f
```

### 3. Перезапуск отдельных сервисов

Если нужно перезапустить только один сервис:

```bash
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  --env-file .env \
  restart backend
```

### 4. Очистка и пересборка

Если что-то пошло не так:

```bash
# Полная очистка
./scripts/deploy/stop_all.sh
docker-compose -f docker/docker-compose.yml down -v

# Пересборка
./scripts/deploy/start_dev.sh
```

---

## 🐛 Troubleshooting

### Frontend: изменения не применяются

**Проблема:** Vite не видит изменения файлов в Docker на macOS.

**Решение:** В `vite.config.ts` включен polling mode:
```typescript
server: {
  watch: {
    usePolling: true,
    interval: 100
  }
}
```

Также проверьте переменные окружения в `docker-compose.dev.yml`:
```yaml
environment:
  - CHOKIDAR_USEPOLLING=true
  - WATCHPACK_POLLING=true
```

### Backend: изменения не применяются

**Проблема:** Используется Gunicorn вместо runserver.

**Решение:** Убедитесь что запускаете через `start_dev.sh`, который использует `docker-compose.dev.yml` с командой `runserver`.

Проверьте:
```bash
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  ps backend

# Должно показать command: python manage.py runserver
```

### Порты заняты

**Проблема:** `Error: port 3000 already in use`

**Решение:**
```bash
# Найти процесс
lsof -ti:3000
lsof -ti:8000

# Убить процесс
kill -9 <PID>

# Или остановить все контейнеры
./scripts/deploy/stop_all.sh
```

### Volumes не монтируются

**Проблема:** Изменения в коде не отражаются в контейнере.

**Решение:**
```bash
# Пересоздать контейнеры
docker-compose -f docker/docker-compose.yml \
  -f docker/docker-compose.dev.yml \
  --env-file .env \
  up -d --force-recreate
```

---

## 📊 Сравнение: Dev vs Production

| Аспект | Development | Production |
|--------|-------------|------------|
| **Backend сервер** | Django runserver | Gunicorn |
| **Frontend сервер** | Vite dev server | Nginx + static files |
| **Hot Reload** | ✅ Да | ❌ Нет |
| **Source maps** | ✅ Да | ❌ Нет |
| **DEBUG** | True | False |
| **Volumes** | Исходники монтируются | Только data |
| **Сборка при изменениях** | ❌ Не требуется | ✅ Требуется |
| **Скорость изменений** | ~1-2 сек | ~2-5 мин (rebuild) |

---

## 🎯 Workflow: От разработки до production

### 1. Локальная разработка

```bash
# Запуск
./scripts/deploy/start_dev.sh

# Разработка (автоматические изменения)
# ... редактируете код ...

# Коммит
git add .
git commit -m "feat: новая функция"
```

### 2. Тестирование

```bash
# Запуск всех тестов
./scripts/test/test_all.sh

# Или отдельно
docker-compose exec backend pytest
docker-compose exec frontend npm test
```

### 3. Деплой на production

```bash
# Просто пуш в main
git push origin main

# Автоматически:
# 1. GitHub webhook вызывает deploy.sh на сервере
# 2. Сервер получает изменения (git pull)
# 3. Пересобирает контейнеры (docker-compose.prod.yml)
# 4. Запускает миграции
# 5. Собирает статику
# 6. Перезапускает сервисы
```

---

## 📚 Дополнительные ресурсы

- [DEPLOYMENT.md](DEPLOYMENT.md) - Общий гайд по деплою
- [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md) - Production деплой
- [DEPLOYMENT_IMPORTANT_NOTES.md](DEPLOYMENT_IMPORTANT_NOTES.md) - Важные заметки
- [CACHE_BUSTING_GUIDE.md](CACHE_BUSTING_GUIDE.md) - Cache busting для frontend

---

**Теперь разработка быстрая и удобная! 🚀**

