# Руководство по пересборке контейнеров

## Проблема

При разработке возникают проблемы с кэшированием на разных уровнях:
1. **Docker** кэширует образы (слои)
2. **Vite** кэширует сборку JavaScript (node_modules/.vite)
3. **TypeScript** кэширует компиляцию (*.tsbuildinfo)
4. **Браузер** кэширует JS/CSS файлы
5. **Nginx** кэширует static assets
6. **Python** кэширует модули (__pycache__, *.pyc)
7. **Gunicorn** не перезагружает модули автоматически

## Быстрые команды

### Frontend изменился
```bash
./scripts/deploy/rebuild_frontend.sh
```

### Backend изменился
```bash
./scripts/deploy/rebuild_backend.sh
```

### Полная пересборка всего
```bash
./scripts/deploy/stop_all.sh
docker-compose -f docker/docker-compose.yml build --no-cache
./scripts/deploy/start_all.sh
```

## Что делать при изменениях

### 1. Изменения в Frontend (src/components, src/services, etc.)

**ПРАВИЛЬНО:**
```bash
./scripts/deploy/rebuild_frontend.sh
```

**НЕПРАВИЛЬНО** (пересоздаст БД!):
```bash
docker-compose -f docker/docker-compose.yml up -d frontend  # ❌ Пересоздаст зависимости!
```

### 2. Изменения в Backend (views.py, models.py, serializers.py, etc.)

**ПРАВИЛЬНО:**
```bash
./scripts/deploy/rebuild_backend.sh
```

**НЕПРАВИЛЬНО:**
```bash
docker-compose -f docker/docker-compose.yml restart backend  # ❌ Не обновит код!
docker-compose -f docker/docker-compose.yml up -d backend    # ❌ Пересоздаст БД!
```

### 3. Изменения в Nginx конфиге

```bash
docker-compose -f docker/docker-compose.yml restart nginx
```

### 4. Изменения в docker-compose.yml или Dockerfile

```bash
./scripts/deploy/stop_all.sh
docker-compose -f docker/docker-compose.yml build --no-cache [service]
./scripts/deploy/start_all.sh
```

## Отладка проблем с кэшем

### Frontend не обновляется в браузере

1. **Проверь какой JS файл загружается:**
   - Открой DevTools (F12) → Network
   - Перезагрузи страницу
   - Найди `index-*.js`
   - Посмотри размер и дату

2. **Очисть кэш браузера:**
   - Safari: Cmd+Option+E
   - Chrome: Cmd+Shift+Delete
   - Или открой в приватном окне (Cmd+Shift+P)

3. **Проверь что в контейнере:**
   ```bash
   docker-compose -f docker/docker-compose.yml exec frontend ls -la /app/dist/assets/
   ```

4. **Открой напрямую (минуя Nginx):**
   ```
   http://localhost:3000
   ```

### Backend не применяет изменения

1. **Очисть Python кэш:**
   ```bash
   docker-compose -f docker/docker-compose.yml exec backend sh -c "find /app -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null; find /app -name '*.pyc' -delete"
   ```

2. **Проверь что код в контейнере обновился:**
   ```bash
   docker-compose -f docker/docker-compose.yml exec backend grep -A 5 "def my_function" /app/myapp/views.py
   ```

3. **Перезапусти Gunicorn:**
   ```bash
   docker-compose -f docker/docker-compose.yml restart backend
   ```

## Почему `up -d` пересоздаёт БД?

Когда используется `docker-compose up -d <service>`, Docker Compose **пересоздаёт зависимости** если они изменились или отсутствуют. Это приводит к пересозданию БД!

**Правильно (без пересоздания зависимостей):**
```bash
docker-compose up -d --no-deps <service>
```

**Ещё правильнее (через наши скрипты):**
```bash
./scripts/deploy/rebuild_frontend.sh  # Для frontend
./scripts/deploy/rebuild_backend.sh   # Для backend
```

## Workflow разработки

### Типичный цикл изменений:

1. **Изменил код в `frontend/src/`:**
   ```bash
   ./scripts/deploy/rebuild_frontend.sh
   # Затем в браузере: Cmd+Shift+R
   ```

2. **Изменил код в `backend/`:**
   ```bash
   ./scripts/deploy/rebuild_backend.sh
   # Проверка: docker-compose -f docker/docker-compose.yml logs backend --tail=20
   ```

3. **Изменил обе части:**
   ```bash
   ./scripts/deploy/stop_all.sh
   docker-compose -f docker/docker-compose.yml build frontend backend
   ./scripts/deploy/start_all.sh
   ```

4. **Всё сломалось:**
   ```bash
   ./scripts/deploy/stop_all.sh
   docker-compose -f docker/docker-compose.yml build --no-cache
   ./scripts/deploy/start_all.sh
   ```

## Проверка что изменения применились

### Frontend
```bash
# Проверка файла в контейнере
docker-compose -f docker/docker-compose.yml exec frontend ls -la /app/dist/assets/

# Проверка что сервер отдаёт правильный файл
curl -I http://localhost:3000/assets/index-*.js

# Проверка размера
docker inspect agent_assistant_frontend --format='Image: {{.Image}}'
```

### Backend
```bash
# Проверка кода в контейнере
docker-compose -f docker/docker-compose.yml exec backend grep "my_code" /app/myapp/views.py

# Проверка логов
docker-compose -f docker/docker-compose.yml logs backend --tail=50

# Проверка образа
docker inspect agent_assistant_backend --format='Image: {{.Image}} Created: {{.Created}}'
```

## Рекомендации

1. **Всегда используй скрипты** из `scripts/deploy/`
2. **Не используй** `docker-compose up -d <service>` напрямую
3. **Для быстрых изменений frontend** - используй `rebuild_frontend.sh`
4. **Для изменений backend** - используй `rebuild_backend.sh`
5. **После пересборки** - всегда очищай кэш браузера (Cmd+Shift+R)
6. **В приватном окне** браузера нет кэша - используй для тестирования

## Автоматизация в будущем

Планируется добавить:
- Hot reload для frontend (Vite dev server в Docker)
- Auto-reload для backend (watchdog/nodemon для Python)
- Volume mapping для исходников (для разработки)
- Разные docker-compose.yml для dev и prod

