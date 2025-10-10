# Статус интеграции с OpenAI для анализа запросов от КД

## ⚙️ Текущая конфигурация

### Режим работы: **OpenAI GPT-4o** (без fallback на эмулятор)

```yaml
llm:
  use_emulator: false              # OpenAI включен
  fallback_to_emulator: false      # ❌ Эмулятор отключен как fallback
  model: 'gpt-4o'                  # Модель GPT-4o
  temperature: 0.3                 # Низкая креативность
  max_tokens: 4000                 # Максимум токенов
  max_retries: 3                   # Попытки при ошибках
  timeout: 60                      # Таймаут в секундах
```

---

## 🔴 Текущий статус: API ключ недействителен

### Проблема
API ключ OpenAI не прошел аутентификацию:
```
Error code: 401 - Incorrect API key provided
```

### Что происходит сейчас

При попытке анализа запроса от КД:
- ✅ Система пытается использовать OpenAI GPT-4o
- ❌ OpenAI возвращает ошибку 401 (неверный API ключ)
- ❌ Fallback на эмулятор **отключен**
- ❌ **Возвращается ошибка 503 Service Unavailable**

### Ответ API при ошибке
```json
{
  "error": "OpenAI сервис недоступен",
  "details": "OpenAI service is not available. Please configure OPENAI_API_KEY...",
  "processing_time": 0.123,
  "used_emulator": false,
  "suggestion": "Пожалуйста, настройте OPENAI_API_KEY в переменных окружения или включите fallback_to_emulator в конфигурации"
}
```

---

## ✅ Решение: Настройка валидного API ключа

### Вариант 1: Настроить валидный OpenAI API ключ (рекомендуется)

1. Получите новый API ключ:
   - Перейдите на https://platform.openai.com/api-keys
   - Создайте новый ключ: **Create new secret key**
   - Скопируйте ключ (показывается только один раз!)

2. Обновите файл `.env` в корне проекта:
   ```bash
   OPENAI_API_KEY=sk-proj-ваш_новый_ключ_здесь
   ```

3. Перезапустите backend:
   ```bash
   docker-compose restart backend
   ```

4. Проверьте подключение:
   ```bash
   cd backend
   python3 test_openai_connection.py
   ```

### Вариант 2: Включить эмулятор как fallback (для тестирования)

Если вы хотите, чтобы при ошибке OpenAI система использовала эмулятор:

1. Откройте `backend/llm_config.yaml`
2. Измените:
   ```yaml
   llm:
     use_emulator: false
     fallback_to_emulator: true  # ← Изменить на true
   ```
3. Перезапустите backend

⚠️ **Примечание:** Эмулятор возвращает **тестовые данные**, не реальный анализ.

### Вариант 3: Использовать только эмулятор (без OpenAI)

Для полного тестирования без OpenAI:

1. Откройте `backend/llm_config.yaml`
2. Измените:
   ```yaml
   llm:
     use_emulator: true  # ← Изменить на true
     fallback_to_emulator: false
   ```
3. Перезапустите backend

---

## 🎯 Как работает система после настройки

### Схема обработки запроса от КД

```
Запрос от КД → API endpoint (/api/requests/{id}/analyze/)
                    ↓
             LLMService.analyze_request()
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
  OpenAI доступен?        OpenAI недоступен
        ↓                       ↓
  GPT-4o анализ          fallback_to_emulator?
        ↓                 ┌─────┴─────┐
   ✅ Результат      Да ↓         ↓ Нет
                  Эмулятор    ❌ Ошибка 503
                       ↓
                  ✅ Результат
```

### Что извлекает GPT-4o из запроса КД

✅ **Информация о проекте:**
- Название проекта
- Тип (Фильм, Сериал, Реклама, Клип и т.д.)
- Жанр
- Описание
- Дата премьеры

✅ **Роли для кастинга:**
- Название роли / персонажа
- Описание роли
- Возраст (диапазон)
- Пол
- Внешность (рост, телосложение, цвет волос/глаз)
- Требования к навыкам
- Гонорар
- Даты и локация съемок

✅ **Контакты команды:**
- Кастинг-директор
- Режиссер
- Продюсеры
- Продюсерская компания

---

## 📊 Тестирование

### Тест 1: Проверка подключения к OpenAI
```bash
cd /Users/andrei_prygunov/Dev/agent_assistant/backend
python3 test_openai_connection.py
```

**Ожидаемый результат (после настройки ключа):**
```
✅ API ключ найден
✅ OpenAI сервис инициализирован
✅ Подключение к OpenAI API успешно!
✅ Анализ выполнен успешно!
```

### Тест 2: Проверка эмулятора (опционально)
```bash
cd /Users/andrei_prygunov/Dev/agent_assistant/backend
python3 test_emulator_mode.py
```

### Тест 3: API запрос через curl
```bash
curl -X POST http://localhost:8000/api/requests/1/analyze/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"use_emulator": false}'
```

**Успешный ответ (200 OK):**
```json
{
  "project_analysis": {
    "project_title": "Название проекта",
    "project_type": "Фильм",
    "genre": "Драма",
    "roles": [...]
  },
  "contacts": {...},
  "confidence": 0.85,
  "processing_time": 2.45,
  "used_emulator": false
}
```

**Ответ при ошибке (503 Service Unavailable):**
```json
{
  "error": "OpenAI сервис недоступен",
  "details": "...",
  "processing_time": 0.123,
  "used_emulator": false,
  "suggestion": "Пожалуйста, настройте OPENAI_API_KEY..."
}
```

---

## 📝 Изменения в коде

### 1. llm_config.yaml
Добавлен параметр `fallback_to_emulator` для контроля fallback логики.

### 2. llm/services.py - LLMService.analyze_request()
- Проверяет настройку `fallback_to_emulator`
- При `fallback_to_emulator: false` выбрасывает исключение вместо использования эмулятора
- Возвращает ошибку `ValueError` если OpenAI недоступен

### 3. llm/views.py - analyze_request()
- Добавлена специальная обработка `ValueError` (OpenAI недоступен)
- Возвращает HTTP 503 вместо 500 при недоступности сервиса
- Добавлено поле `suggestion` с подсказкой для пользователя
- Исправлено определение `used_emulator` из результата анализа

---

## 💡 Рекомендации

### Для production
- ✅ Используйте валидный OpenAI API ключ
- ✅ `use_emulator: false`
- ✅ `fallback_to_emulator: false` (строгий режим)
- ✅ Настройте мониторинг ошибок 503

### Для разработки
- ✅ Можно включить `fallback_to_emulator: true`
- ✅ Позволяет тестировать систему даже при проблемах с OpenAI

### Для тестирования
- ✅ `use_emulator: true` - работа только с эмулятором
- ✅ Не требует API ключа
- ✅ Моментальные результаты

---

**Дата обновления:** 10 октября 2025  
**Статус:** Эмулятор отключен, требуется валидный API ключ OpenAI

