# 📚 Документация Agent Assistant

Центральный репозиторий всей документации проекта.

---

## 🗂️ Структура документации

### 📋 Планирование (`planning/`)
- **[module_plan_layer5.md](planning/module_plan_layer5.md)** - Главный план разработки проекта (110 дней)
- **[module_planning_checklist.md](planning/module_planning_checklist.md)** - Чек-лист для планирования модулей

### 🔧 Техническая документация (`technical/`)
- **[LLM_Integration_Concept.md](technical/LLM_Integration_Concept.md)** - Концепция интеграции LLM для анализа запросов
- **[module_podbora.md](technical/module_podbora.md)** - Модуль подбора артистов по ролям
- **[OPENAI_SETUP.md](technical/OPENAI_SETUP.md)** - Настройка OpenAI API

### 🚀 Развёртывание (`deployment/`)
- **[QUICK_DEPLOY_CHECKLIST.md](deployment/QUICK_DEPLOY_CHECKLIST.md)** - Быстрый чек-лист для деплоя ⭐ (начните с этого!)
- **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - Полная инструкция по развёртыванию
- **[DEPLOYMENT_PRODUCTION.md](deployment/DEPLOYMENT_PRODUCTION.md)** - Деплой на production
- **[GITHUB_WEBHOOK_SETUP.md](deployment/GITHUB_WEBHOOK_SETUP.md)** - Настройка GitHub webhooks

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

**Последнее обновление:** 16 октября 2025
