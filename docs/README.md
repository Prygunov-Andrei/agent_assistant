# 📚 Документация Agent Assistant

Центральный репозиторий всей документации проекта.

---

## 🗂️ Структура документации

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
- **[DEPLOYMENT_IMPORTANT_NOTES.md](deployment/DEPLOYMENT_IMPORTANT_NOTES.md)** - ⚠️ ВАЖНО! Прочитать в первую очередь
- **[QUICK_DEPLOY_CHECKLIST.md](deployment/QUICK_DEPLOY_CHECKLIST.md)** - Быстрый чек-лист для деплоя ⭐
- **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - Полная инструкция по развёртыванию
- **[CACHE_BUSTING_GUIDE.md](deployment/CACHE_BUSTING_GUIDE.md)** - Решение проблем с кэшированием frontend
- **[DEPLOYMENT_PRODUCTION.md](deployment/DEPLOYMENT_PRODUCTION.md)** - Деплой на production сервер
- **[GITHUB_WEBHOOK_SETUP.md](deployment/GITHUB_WEBHOOK_SETUP.md)** - Настройка GitHub webhooks
- **[UPDATE_SERVER_AFTER_REORGANIZATION.md](deployment/UPDATE_SERVER_AFTER_REORGANIZATION.md)** - Обновление сервера после реорганизации

### 🤖 Telegram Bot (`bot/`)
- **[BOT_SWITCH_GUIDE.md](bot/BOT_SWITCH_GUIDE.md)** - Руководство по переключению бота между локальным и production режимами

---

## 🚀 Быстрый старт

### Для первого запуска:
1. Прочитайте [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)
2. Создайте `.env` из `.env.example` в корне проекта
3. Запустите `./scripts/deploy/start.sh`

### Для разработки:
1. Ознакомьтесь с [planning/module_plan_layer5.md](planning/module_plan_layer5.md)
2. Изучите [technical/LLM_Integration_Concept.md](technical/LLM_Integration_Concept.md)
3. Настройте LLM по [technical/OPENAI_SETUP.md](technical/OPENAI_SETUP.md)

### Для деплоя:
1. Следуйте [deployment/QUICK_DEPLOY_CHECKLIST.md](deployment/QUICK_DEPLOY_CHECKLIST.md)

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
1. Проверьте [deployment/QUICK_DEPLOY_CHECKLIST.md](deployment/QUICK_DEPLOY_CHECKLIST.md) - раздел Troubleshooting
2. Посмотрите логи: `docker-compose -f docker/docker-compose.yml logs -f`
3. Проверьте статус: `docker-compose -f docker/docker-compose.yml ps`

---

**Последнее обновление:** 17 октября 2025
