# Настройка GitHub Webhook для автоматического деплоя

## Что нужно сделать в GitHub

1. **Перейти в настройки репозитория:**
   - Откройте https://github.com/Prygunov-Andrei/agent_assistant
   - Нажмите на вкладку "Settings" (вверху справа)

2. **Настроить Webhook:**
   - В левом меню выберите "Webhooks"
   - Нажмите "Add webhook"

3. **Заполнить параметры:**
   - **Payload URL:** `http://217.151.231.96:9000/deploy`
   - **Content type:** `application/json`
   - **Secret:** (оставить пустым)
   - **Which events:** Выбрать "Just the push event"
   - **Active:** ✅ (галочка должна стоять)

4. **Сохранить:**
   - Нажмите "Add webhook"

## Проверка работы

После настройки webhook будет автоматически вызывать деплой при каждом push в main ветку.

Для тестирования сделайте любой коммит:
```bash
git add .
git commit -m "test: проверка автоматического деплоя"
git push origin main
```

## Логи webhook

Логи webhook сохраняются в файл `/opt/agent_assistant/webhook.log` на сервере.

## Текущий статус

✅ Webhook сервер запущен на порту 9000  
✅ Скрипт деплоя работает корректно  
✅ Все контейнеры запущены и работают  
⏳ Ожидается настройка GitHub webhook в интерфейсе
