# LLM Integration для Agent Assistant

Модуль интеграции с LLM (GPT-4o) для анализа запросов кастинг-директоров и автоматического создания проектов.

## 📋 **Компоненты**

### **1. Файлы конфигурации**
- `llm_schema.json` - JSON Schema для валидации ответов LLM
- `llm_prompt.txt` - Промпт для GPT-4o с примерами
- `llm_config.yaml` - Конфигурация LLM сервиса (опционально)

### **2. Сервисы**
- `openai_service.py` - Интеграция с OpenAI GPT-4o API
- `services.py` - Главный LLMService (выбирает между OpenAI и эмулятором)
- `validators.py` - Валидация ответов LLM
- `error_logging.py` - Логирование ошибок

## 🚀 **Установка и настройка**

> 📖 **Полная документация:** См. [docs/technical/OPENAI_SETUP.md](../../docs/technical/OPENAI_SETUP.md)

### **Шаг 1: Установка зависимостей**

Библиотека `openai` уже установлена в `requirements.txt`:

```bash
openai==1.3.0
```

### **Шаг 2: Настройка переменных окружения**

Добавьте в файл `.env` в корне проекта:

```bash
# OpenAI API Settings
OPENAI_API_KEY=sk-ваш-ключ-api
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=4000
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT=60
```

### **Шаг 3: Создание конфигурационного файла (опционально)**

Создайте файл `backend/llm_config.yaml`:

```yaml
llm:
  use_emulator: false  # false - использовать OpenAI, true - использовать эмулятор
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

## 💻 **Использование**

### **Базовое использование**

```python
from llm.services import LLMService

# Инициализация сервиса
llm_service = LLMService()

# Анализ запроса
request_data = {
    'id': 123,
    'text': 'Ищем актеров для комедийного фильма...',
    'author_username': 'ivan_petrov'
}

artists_data = []  # Список доступных артистов (опционально)

# Получение результата
result = llm_service.analyze_request(request_data, artists_data)

# result содержит:
# {
#     'project_analysis': {...},
#     'contacts': {...},
#     'confidence': 0.85,
#     'used_emulator': False,
#     'model': 'gpt-4o'
# }
```

### **Тестирование подключения**

```python
# Проверка статуса сервиса
status = llm_service.test_connection()
# {
#     'emulator_available': True,
#     'openai_available': True,
#     'current_mode': 'openai'
# }

# Получение информации о сервисе
info = llm_service.get_service_info()
# {
#     'service': 'openai',
#     'model_info': {
#         'model': 'gpt-4o',
#         'temperature': 0.3,
#         ...
#     }
# }
```

## 📊 **Структура ответа LLM**

Полная структура ответа описана в `llm_schema.json`. Основные разделы:

### **1. Project Analysis**
```json
{
  "project_analysis": {
    "project_title": "Название проекта",
    "project_type": "Фильм",
    "genre": "Комедия",
    "description": "Описание",
    "premiere_date": "2025-03-15",
    "roles": [...]
  }
}
```

### **2. Роли**
```json
{
  "role_type": "Актер",
  "character_name": "Главный герой",
  "description": "Полное описание",
  "age_min": 25,
  "age_max": 30,
  "gender": "male",
  "media_presence": "doesnt_matter",
  "height": "175-185 см",
  "body_type": "Спортивное",
  "skills_required": {
    "acting_skills": ["Актерское мастерство", "Комедия"],
    "special_skills": ["Вождение"]
  }
}
```

### **3. Контакты**
```json
{
  "contacts": {
    "casting_director": {
      "name": "Иван Петров",
      "email": "ivan@example.com",
      "confidence": 0.9
    },
    "director": {...},
    "producers": [...],
    "production_company": {...}
  }
}
```

## 🔄 **Переключение между OpenAI и эмулятором**

### **Автоматическое переключение**

Сервис автоматически выбирает режим:
1. Если `OPENAI_API_KEY` не установлен → **эмулятор**
2. Если ключ есть, но `use_emulator: true` в конфиге → **эмулятор**
3. Если ключ есть и `use_emulator: false` → **OpenAI**

### **Fallback на эмулятор**

При ошибке OpenAI API сервис автоматически переключается на эмулятор.

## ⚙️ **Настройка промпта**

Промпт находится в файле `llm_prompt.txt`. Вы можете:
- Изменить системные инструкции
- Добавить новые примеры (few-shot learning)
- Уточнить требования к формату ответа

## 🧪 **Тестирование**

```python
# Тест подключения к OpenAI
from llm.openai_service import OpenAIService

service = OpenAIService()
is_connected = service.test_connection()  # True/False

# Тест полного анализа
from llm.services import LLMService

llm = LLMService()
result = llm.analyze_request({
    'id': 1,
    'text': 'Тестовый запрос для кастинга'
}, [])

print(result['used_emulator'])  # False если используется OpenAI
print(result['model'])  # 'gpt-4o'
```

## 📝 **Логирование**

Все события логируются:
- Успешные вызовы API
- Ошибки и fallback на эмулятор
- Валидация ответов
- Retry попытки

Логи доступны в Django логах.

## 🐛 **Troubleshooting**

### **Проблема: "OPENAI_API_KEY не указан"**
**Решение:** Добавьте ключ в `.env` файл

### **Проблема: "Connection timeout"**
**Решение:** Увеличьте `OPENAI_TIMEOUT` в настройках

### **Проблема: "Invalid JSON response"**
**Решение:** LLM автоматически использует JSON mode, но если проблема повторяется - проверьте промпт

### **Проблема: "Rate limit exceeded"**
**Решение:** Увеличьте `OPENAI_MAX_RETRIES` или используйте эмулятор

## 📚 **Дополнительные ресурсы**

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [GPT-4o Model Card](https://openai.com/index/hello-gpt-4o/)
- [JSON Mode Guide](https://platform.openai.com/docs/guides/structured-outputs)

