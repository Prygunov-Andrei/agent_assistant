# 🚀 Настройка OpenAI GPT-4o для Agent Assistant

## 📋 **Что сделано:**

✅ Создан `OpenAIService` для работы с GPT-4o API  
✅ Создан промпт с примерами для анализа запросов  
✅ Создана JSON Schema для валидации ответов  
✅ Интегрировано автоматическое переключение между OpenAI и эмулятором  
✅ Добавлены настройки в Django settings  

---

## ⚙️ **Настройка (шаг за шагом):**

### **Шаг 1: Получить API ключ OpenAI**

1. Зайдите на https://platform.openai.com/
2. Войдите или зарегистрируйтесь
3. Перейдите в "API keys"
4. Создайте новый API ключ
5. Скопируйте ключ (он будет показан только один раз!)

### **Шаг 2: Добавить ключ в файл `.env`**

Найдите или создайте файл `.env` в корне проекта:

```bash
/Users/andrei_prygunov/Dev/agent_assistant/.env
```

Добавьте следующие строки:

```bash
# OpenAI API Settings
OPENAI_API_KEY=sk-ваш-ключ-здесь
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=4000
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT=60
```

**ВАЖНО:** Замените `sk-ваш-ключ-здесь` на ваш реальный ключ!

### **Шаг 3: Создать конфигурационный файл (опционально)**

Создайте файл `backend/llm_config.yaml`:

```yaml
llm:
  use_emulator: false  # false = использовать OpenAI, true = использовать эмулятор
  model: 'gpt-4o'
  temperature: 0.3
  max_tokens: 4000
  max_retries: 3
  timeout: 60

validation:
  required_fields:
    - 'project_analysis.project_title'
    - 'project_analysis.project_type'
    - 'project_analysis.roles'
  json_schema_strict: true
  retry_on_invalid_json: true
  max_retry_attempts: 3
```

**ВАЖНО:** `use_emulator: false` включает OpenAI!

### **Шаг 4: Перезапустить бэкенд**

```bash
# Остановите бэкенд (Ctrl+C)
# Затем запустите снова:
cd backend
python3 manage.py runserver
```

---

## 🧪 **Проверка работы:**

### **Вариант 1: Через Django shell**

```bash
cd backend
python3 manage.py shell
```

```python
from llm.services import LLMService

# Создаем сервис
llm = LLMService()

# Проверяем статус
status = llm.test_connection()
print(status)
# Ожидаем: {'emulator_available': True, 'openai_available': True, 'current_mode': 'openai'}

# Проверяем информацию о сервисе
info = llm.get_service_info()
print(info)
# Ожидаем: {'service': 'openai', 'model_info': {...}}

# Тестовый анализ
result = llm.analyze_request({
    'id': 1,
    'text': 'Ищем актера для комедийного фильма, мужчина 25-30 лет'
}, [])

print(f"Использован: {result.get('model', 'emulator')}")
print(f"Название проекта: {result['project_analysis']['project_title']}")
```

### **Вариант 2: Через интерфейс**

1. Откройте фронтенд
2. Перейдите в "Запросы"
3. Кликните на любой запрос
4. Должен появиться прогресс-бар "Анализ LLM..."
5. Форма заполнится автоматически (данные от GPT-4o!)

---

## 🔄 **Как понять что используется OpenAI а не эмулятор?**

### **1. Проверка в логах бэкенда:**

В консоли бэкенда должна появиться строка:
```
OpenAI Service initialized successfully
Using OpenAI GPT-4o for request analysis
```

Если используется эмулятор, будет:
```
Using LLM Emulator for request analysis
```

### **2. Проверка в браузере (консоль):**

Откройте DevTools (F12) → Console → при клике на запрос должно появиться:
```javascript
llm.ts: LLM Response: {
  ...
  "used_emulator": false,  // ← false = OpenAI!
  "model": "gpt-4o",       // ← модель OpenAI
  ...
}
```

### **3. Проверка качества результата:**

**Эмулятор** всегда возвращает одинаковый результат:
- Название: "Друзья навсегда"
- Роли: "Главный герой", "Подруга главного героя"

**GPT-4o** анализирует реальный текст запроса:
- Название извлекается из текста
- Роли создаются на основе описания
- Все поля заполняются точно по запросу

---

## 💰 **Стоимость использования OpenAI:**

### **GPT-4o цены (на май 2024):**
- **Input:** $5 за 1M токенов
- **Output:** $15 за 1M токенов

### **Примерная стоимость одного запроса:**
- Промпт: ~1500 токенов
- Текст запроса: ~200 токенов
- Ответ: ~800 токенов
- **Итого:** ~2500 токенов ≈ **$0.02** (2 цента) за запрос

### **100 запросов = ~$2**

---

## ⚠️ **Troubleshooting:**

### **Проблема 1: "OPENAI_API_KEY не указан"**

**Причина:** Ключ не добавлен в `.env`  
**Решение:** Проверьте файл `.env`, добавьте строку `OPENAI_API_KEY=sk-...`

### **Проблема 2: "OpenAI API connection test failed"**

**Причина:** Неверный ключ или нет интернета  
**Решение:** 
- Проверьте ключ на https://platform.openai.com/
- Проверьте интернет соединение
- Проверьте что ключ не истек

### **Проблема 3: "Rate limit exceeded"**

**Причина:** Превышен лимит запросов  
**Решение:** 
- Подождите 1 минуту
- Увеличьте лимиты в OpenAI аккаунте
- Используйте эмулятор временно

### **Проблема 4: Все равно используется эмулятор**

**Причина:** `use_emulator: true` в конфиге  
**Решение:** 
- Откройте `backend/llm_config.yaml`
- Измените `use_emulator: false`
- Перезапустите бэкенд

### **Проблема 5: "Invalid JSON response"**

**Причина:** GPT-4o вернул невалидный JSON (редко)  
**Решение:** Автоматически включается retry, максимум 3 попытки

---

## 📊 **Мониторинг использования OpenAI:**

1. Зайдите на https://platform.openai.com/usage
2. Смотрите статистику по дням
3. Настройте лимиты расходов (рекомендуется $10-20/месяц для тестирования)

---

## 🔐 **Безопасность:**

⚠️ **НИКОГДА НЕ КОММИТЬТЕ `.env` ФАЙЛ В GIT!**

Файл `.env` уже добавлен в `.gitignore`

Если случайно закоммитили ключ:
1. Удалите ключ на https://platform.openai.com/
2. Создайте новый ключ
3. Обновите `.env`

---

## 📞 **Контакты для помощи:**

- OpenAI Docs: https://platform.openai.com/docs
- OpenAI Support: https://help.openai.com/
- GitHub Issues: (если используете open source)

---

## ✅ **Checklist готовности:**

- [ ] API ключ получен
- [ ] Ключ добавлен в `.env`
- [ ] `llm_config.yaml` создан (опционально)
- [ ] `use_emulator: false` установлен
- [ ] Бэкенд перезапущен
- [ ] Тест через shell успешен
- [ ] Тест через интерфейс успешен
- [ ] В логах видно "Using OpenAI GPT-4o"
- [ ] Результаты анализа корректны

**Готово! 🎉**

