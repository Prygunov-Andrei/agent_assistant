# Руководство по предотвращению проблем с кэшированием

> ⚠️ **Примечание:** Этот документ актуален для **PRODUCTION режима**.  
> В локальной разработке с hot reload (см. [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)) кэширование не проблема - изменения применяются автоматически.

## Проблема (в Production)

При обновлении кода frontend браузеры продолжают использовать старые версии файлов из кэша, что приводит к тому, что пользователи не видят новый функционал.

## Решение

Реализован многоуровневый подход к cache-busting:

### 1. Vite - автоматическая генерация хэшей в именах файлов

**Файл:** `frontend/vite.config.ts`

```typescript
build: {
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[name]-[hash].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]'
    }
  }
}
```

При каждой сборке Vite генерирует уникальные имена файлов с хэшами (например, `index-BRhnJEVw.js`). При изменении кода хэш меняется, браузер загружает новый файл.

### 2. HTTP заголовки для разных типов контента

**Файл:** `nginx/conf.d/default.conf`

```nginx
# HTML страницы - НЕ кэшируем
location / {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Статические ассеты с хэшами - кэшируем агрессивно
location ~* ^/assets/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Логика:**
- HTML файлы (`index.html`) всегда загружаются заново (не кэшируются)
- Assets с хэшами в именах кэшируются на год (они уникальные)
- При обновлении кода: index.html загружается заново и содержит новые имена файлов с новыми хэшами

### 3. Конфигурация serve (для production mode)

**Файл:** `frontend/serve.json`

```json
{
  "headers": [
    {
      "source": "**/*.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "**/assets/**/*.@(js|css)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 4. Meta теги в HTML

**Файл:** `frontend/index.html`

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

Дополнительная защита на уровне HTML.

## Правильный процесс обновления

### После изменения frontend кода:

#### Вариант 1: Использовать готовый скрипт (рекомендуется)
```bash
./scripts/deploy/rebuild_frontend.sh
```

#### Вариант 2: Вручную
```bash
# 1. Остановить frontend и nginx
docker-compose -f docker/docker-compose.yml --env-file .env stop frontend nginx

# 2. Пересобрать frontend (с очисткой кэша)
docker-compose -f docker/docker-compose.yml --env-file .env build --no-cache frontend

# 3. Запустить сервисы
docker-compose -f docker/docker-compose.yml --env-file .env up -d frontend nginx
```

### ⚠️ ВАЖНО: Всегда используйте флаг `--env-file .env`!

При запуске docker-compose команд вручную **обязательно** указывайте:
```bash
docker-compose -f docker/docker-compose.yml --env-file .env ...
```

Без этого флага переменные окружения не загрузятся, и backend не запустится!

## Для пользователей (после деплоя)

После обновления системы пользователи должны:

1. **Жесткое обновление страницы:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Или очистить кэш браузера:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content

3. **Или открыть в режиме инкогнито** для проверки

## Автоматизация

Для продакшен деплоя добавить в CI/CD:

```bash
# После успешного деплоя
echo "DEPLOY_VERSION=$(date +%Y%m%d_%H%M%S)" >> .env
docker-compose build --no-cache frontend
docker-compose up -d frontend nginx
```

## Проверка работы cache-busting

```bash
# Проверить заголовки для HTML
curl -I http://localhost:3000/

# Должно быть:
# Cache-Control: no-cache, no-store, must-revalidate

# Проверить заголовки для JS/CSS
curl -I http://localhost:3000/assets/index-XXXXX.js

# Должно быть:
# Cache-Control: public, max-age=31536000, immutable
```

## Резюме

✅ **HTML файлы** - всегда загружаются свежие (no-cache)
✅ **Assets с хэшами** - кэшируются на год (immutable)
✅ **При каждой сборке** - новые хэши → браузер загружает новые файлы
✅ **Скрипт rebuild_frontend.sh** - для быстрой пересборки

Теперь проблемы с устаревшим кэшем не будет!

---

## См. также

- [DEPLOYMENT_IMPORTANT_NOTES.md](DEPLOYMENT_IMPORTANT_NOTES.md) - Важные заметки перед деплоем
- [DEPLOYMENT.md](DEPLOYMENT.md) - Полная инструкция по развёртыванию
- [QUICK_DEPLOY_CHECKLIST.md](QUICK_DEPLOY_CHECKLIST.md) - Быстрый чек-лист

