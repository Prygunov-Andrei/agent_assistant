# 📚 Документация Agent Assistant

Папка с документацией проекта.

## 📄 Файлы

### Деплой и инфраструктура:
- **[QUICK_DEPLOY_CHECKLIST.md](QUICK_DEPLOY_CHECKLIST.md)** - Быстрый чеклист для деплоя (⭐ начните с этого!)
- **[../DEPLOYMENT.md](../DEPLOYMENT.md)** - Полная инструкция по развёртыванию в Docker
- **[../backend/telegram_requests/bot/README.md](../backend/telegram_requests/bot/README.md)** - Документация Telegram бота

### Планирование:
- **[module_planning_checklist.md](module_planning_checklist.md)** - Чеклист планирования модулей

---

## 🚀 Быстрый старт

### Для первого запуска:
1. Прочитайте [DEPLOYMENT.md](../DEPLOYMENT.md) - полная инструкция
2. Создайте `.env` из `env.example`
3. Запустите `./start.sh`

### Для последующих деплоев:
1. Откройте [QUICK_DEPLOY_CHECKLIST.md](QUICK_DEPLOY_CHECKLIST.md)
2. Следуйте чеклисту
3. Готово! 🎉

---

## 🔑 Ключевые моменты

### Docker Networking (ВАЖНО!)
**Используйте имена СЕРВИСОВ из docker-compose.yml:**
- ✅ `backend` (правильно)
- ❌ `agent_assistant_backend` (неправильно)
- ❌ `localhost` (для контейнеров неправильно)

### .env конфигурация
```bash
API_BASE_URL=http://backend:8000/api
DB_HOST=db
REDIS_URL=redis://redis:6379/1
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend,yourdomain.com
```

---

## 📞 Поддержка

Если что-то не работает:
1. Проверьте [QUICK_DEPLOY_CHECKLIST.md](QUICK_DEPLOY_CHECKLIST.md) - раздел Troubleshooting
2. Посмотрите логи: `docker-compose logs -f`
3. Проверьте статус: `docker-compose ps`

---

Подробнее в [DEPLOYMENT.md](../DEPLOYMENT.md)


