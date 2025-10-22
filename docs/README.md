# 📚 Документация Agent Assistant

Центральный репозиторий всей документации проекта.

---

## ⚡ Быстрый старт

### 🔥 Локальная разработка (начните здесь!)

1. **[QUICK_START.md](deployment/QUICK_START.md)** ⭐ - 3 команды для запуска
2. **[LOCAL_DEVELOPMENT.md](deployment/LOCAL_DEVELOPMENT.md)** - Полный гайд по dev режиму с hot reload
3. **[TELEGRAM_BOT_GUIDE.md](deployment/TELEGRAM_BOT_GUIDE.md)** - Управление Telegram ботом

### 🚀 Production деплой

1. **[DEPLOYMENT_PRODUCTION.md](deployment/DEPLOYMENT_PRODUCTION.md)** - Настройка и запуск на сервере
2. **[GITHUB_WEBHOOK_SETUP.md](deployment/GITHUB_WEBHOOK_SETUP.md)** - Автоматический деплой
3. **[DEPLOYMENT_IMPORTANT_NOTES.md](deployment/DEPLOYMENT_IMPORTANT_NOTES.md)** - Важные примечания

### 📦 Дополнительная информация

- **[CACHE_BUSTING_GUIDE.md](deployment/CACHE_BUSTING_GUIDE.md)** - Кэширование (для production)
- **[EMAIL_BACKUP_QUICK_SETUP.md](deployment/EMAIL_BACKUP_QUICK_SETUP.md)** - Резервные копии

---

## 🗂️ Полная структура документации

### 📋 Планирование (`planning/`)
- **[module_plan_layer5.md](planning/module_plan_layer5.md)** - Главный план разработки проекта (110 дней)
- **[bulk_import_persons.md](planning/bulk_import_persons.md)** - План реализации массового импорта персон
- **[multiple_contacts_for_persons.md](planning/multiple_contacts_for_persons.md)** - План множественных контактов для персон
- **[module_planning_checklist.md](planning/module_planning_checklist.md)** - Чек-лист для планирования модулей

### 🔧 Техническая документация (`technical/`)
- **[LLM_Integration_Concept.md](technical/LLM_Integration_Concept.md)** - Концепция интеграции LLM для анализа запросов
- **[module_podbora.md](technical/module_podbora.md)** - Модуль подбора артистов по ролям
- **[OPENAI_SETUP.md](technical/OPENAI_SETUP.md)** - Настройка OpenAI API

### 🚀 Развёртывание (`deployment/`)

**Локальная разработка:**
- **[QUICK_START.md](deployment/QUICK_START.md)** ⭐ - Быстрый старт (3 команды)
- **[LOCAL_DEVELOPMENT.md](deployment/LOCAL_DEVELOPMENT.md)** - Hot reload, dev режим
- **[TELEGRAM_BOT_GUIDE.md](deployment/TELEGRAM_BOT_GUIDE.md)** - Управление ботом

**Production:**
- **[DEPLOYMENT_PRODUCTION.md](deployment/DEPLOYMENT_PRODUCTION.md)** - Настройка сервера
- **[GITHUB_WEBHOOK_SETUP.md](deployment/GITHUB_WEBHOOK_SETUP.md)** - Автодеплой
- **[DEPLOYMENT_IMPORTANT_NOTES.md](deployment/DEPLOYMENT_IMPORTANT_NOTES.md)** - Важные правила

**Дополнительно:**
- **[CACHE_BUSTING_GUIDE.md](deployment/CACHE_BUSTING_GUIDE.md)** - Кэширование
- **[EMAIL_BACKUP_QUICK_SETUP.md](deployment/EMAIL_BACKUP_QUICK_SETUP.md)** - Email backup

---

## 🔗 Дополнительные ресурсы

### Backend:
- `backend/llm/README.md` - Документация LLM модуля
- `backend/tests/README.md` - Документация по тестированию

### Frontend:
- `frontend/README.md` - Документация фронтенда

### Корневая документация:
- `../README.md` - Главный README проекта

---

## 📞 Поддержка

Если что-то не работает:
1. Проверьте [deployment/QUICK_START.md](deployment/QUICK_START.md) - раздел "Что делать если не работает?"
2. Посмотрите логи: `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f`
3. Проверьте статус: `docker ps --filter "name=agent_assistant"`

---

## 📊 История изменений

**22 октября 2025** - Крупное обновление:
- ✅ Добавлен hot reload для локальной разработки
- ✅ Упрощена система управления Telegram ботом  
- ✅ Полная реорганизация документации
- ✅ Создан QUICK_START.md - 3 команды для запуска
- ✅ Четкое разделение dev/production
- ✅ Удалены временные репорты и устаревшие документы
- ✅ Корень проекта содержит только README.md

**17 октября 2025** - Создана структура документации

---

**Последнее обновление:** 22 октября 2025
