# Добавление поля "Права использования" для рекламных проектов

## Описание задачи

Для проектов типа "Реклама" необходимо добавить специальное поле **"Права использования"** (usage rights), которое содержит юридическую информацию о правах рекламодателя на использование материала.

### Примеры прав из реальных запросов:
- "Интернет на 2 года, территория РФ"
- "ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, интернет"
- "Эфирное ТВ 3 месяца, digital 1 год, СНГ"
- "Права: ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, Интернет"

### Структура распарсенных прав:
```json
{
  "raw_text": "ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, интернет на 2 года, территория РФ",
  "types": ["ТВ-ролик", "ОЛВ-ролик", "OOH", "DOOH", "Радио", "Интернет"],
  "duration": "2 года",
  "territory": "РФ"
}
```

## Зачем это нужно

1. **Юридическая важность**: В рекламе права использования - критичная информация для контракта
2. **Часто указывается в запросах**: Почти всегда присутствует в запросах на рекламу
3. **Влияет на ставки**: От прав зависит оплата артистов
4. **LLM может извлечь и распарсить**: GPT-4 умеет находить и структурировать эту информацию
5. **Относится ко всему проекту**: Права общие для всех ролей в рекламе

## Утвержденные решения

### Вопрос 1: Структура хранения
✅ **Решение:** Один JSONField `usage_rights_parsed` содержит:
```json
{
  "raw_text": "сырой текст из запроса",
  "types": ["массив типов прав"],
  "duration": "срок",
  "territory": "территория"
}
```

### Вопрос 2: Права на проект или роль?
✅ **Решение:** Права относятся ко ВСЕМУ проекту (не к отдельным ролям)

LLM должен искать права в:
- Начале/конце запроса
- В блоках с ключевыми словами: "Права:", "Rights:", "Эксплуатация:"
- В `special_conditions` или `notes` ролей (но применять к проекту)

### Вопрос 3: Где показывать в UI?
✅ **Решение:** В ОТДЕЛЬНОМ блоке после выбора типа проекта

```
┌─────────────────────────────────────┐
│ Тип проекта: [Реклама         ▼]   │
└─────────────────────────────────────┘
          ↓ появляется блок
┌─────────────────────────────────────┐
│ 📜 Права использования              │
│                                     │
│ Сырой текст:                        │
│ [ТВ-ролик, ОЛВ-ролик, интернет...] │
│                                     │
│ Распарсенные данные:                │
│ • Типы: ТВ-ролик, ОЛВ-ролик, OOH   │
│ • Срок: 2 года                      │
│ • Территория: РФ                    │
└─────────────────────────────────────┘
```

### Вопрос 4: Редактирование
✅ **Решение:** Простой вариант - редактируемый TextField для сырого текста + read-only отображение распарсенных компонентов для проверки

LLM парсит → Пользователь проверяет → Можно отредактировать сырой текст

---

## Анализ текущего состояния

### 1. Backend - Модель Project

**Файл:** `backend/projects/models.py`

**Статус:** ❌ Поля НЕТ

**Нужно добавить:**
```python
# Права использования (для рекламы)
usage_rights_parsed = models.JSONField(
    blank=True,
    null=True,
    verbose_name="Права использования (распарсенные)",
    help_text="Структурированная информация о правах для рекламы: {raw_text, types, duration, territory}"
)
```

**Миграция:** Потребуется создать и применить

---

### 2. Backend - LLM Schema

**Файл:** `backend/llm/llm_schema.json`

**Статус:** ❌ Поля НЕТ

**Нужно добавить в `project_analysis.properties`:**
```json
"usage_rights_parsed": {
  "type": ["object", "null"],
  "description": "Распарсенные права использования (только для рекламы)",
  "properties": {
    "raw_text": {
      "type": "string",
      "description": "Исходный текст о правах из запроса"
    },
    "types": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Типы прав: ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, Интернет, Печать, и т.д."
    },
    "duration": {
      "type": ["string", "null"],
      "description": "Срок действия прав: '2 года', '3 месяца', 'бессрочно' или null"
    },
    "territory": {
      "type": ["string", "null"],
      "description": "Территория действия: 'РФ', 'СНГ', 'Весь мир', 'Европа' или null"
    }
  }
}
```

---

### 3. Backend - LLM Prompt

**Файл:** `backend/llm/llm_prompt.txt`

**Статус:** ⚠️ Нужно добавить детальные инструкции

**Добавить в раздел "ОСОБЕННОСТИ":**
```
ОСОБЕННОСТИ ДЛЯ РЕКЛАМНЫХ ПРОЕКТОВ:

Если project_type = "Реклама", ОБЯЗАТЕЛЬНО ищи информацию о ПРАВАХ ИСПОЛЬЗОВАНИЯ.

ГДЕ ИСКАТЬ ПРАВА:
- В начале или конце запроса
- После ключевых слов: "Права:", "Rights:", "Эксплуатация:", "Использование:"
- В special_conditions или notes ролей
- В любом месте запроса где упоминаются медиа-каналы

ТИПЫ ПРАВ (что извлекать в массив types):
- ТВ, ТВ-ролик, Эфирное ТВ, Кабельное ТВ
- ОЛВ, ОЛВ-ролик (онлайн-видео реклама)
- Интернет, Digital, Online
- OOH (наружная реклама)
- DOOH (цифровая наружная реклама)
- Радио
- Печать, Пресса
- Кинотеатры
- Социальные сети

СРОК ДЕЙСТВИЯ (duration):
- "2 года", "3 месяца", "6 месяцев", "1 год"
- "бессрочно", "без ограничений"
- null если не указан

ТЕРРИТОРИЯ (territory):
- "РФ", "Россия"
- "СНГ"
- "Весь мир", "Worldwide"
- "Европа", "Азия"
- null если не указана

СТРУКТУРА ОТВЕТА:
{
  "raw_text": "Точная цитата из запроса о правах",
  "types": ["ТВ-ролик", "Интернет", "Радио"],
  "duration": "2 года",
  "territory": "РФ"
}

ЕСЛИ:
- Проект НЕ реклама → usage_rights_parsed = null
- Права не указаны в запросе → usage_rights_parsed = null
- Указаны только типы без срока/территории → duration и territory = null
```

**Обновить пример в структуре ответа:**
```
"usage_rights_parsed": {
  "raw_text": "ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, интернет на 2 года, территория РФ",
  "types": ["ТВ-ролик", "ОЛВ-ролик", "OOH", "DOOH", "Радио", "Интернет"],
  "duration": "2 года",
  "territory": "РФ"
}
```

---

### 4. Backend - Serializers

**Файл:** `backend/projects/serializers.py`

**Нужно добавить в `ProjectSerializer.Meta.fields`:**
```python
'usage_rights_parsed'
```

**И в `extra_kwargs`:**
```python
'usage_rights_parsed': {
    'help_text': 'Распарсенные права использования (для рекламы)',
    'required': False,
    'allow_null': True
}
```

---

### 5. Frontend - Types

**Файлы:** 
- `frontend/src/types/projects.ts`
- `frontend/src/types/index.ts`

**Добавить интерфейс:**
```typescript
export interface UsageRightsParsed {
  raw_text: string;
  types: string[];
  duration?: string | null;
  territory?: string | null;
}
```

**Добавить в ProjectExpanded, ProjectWithLLM:**
```typescript
usage_rights_parsed?: UsageRightsParsed | null;
```

---

### 6. Frontend - RequestsTable.tsx (Создание)

**Изменения:**

1. **State:**
```typescript
const [usageRightsParsed, setUsageRightsParsed] = useState<any>(null);
```

2. **Извлечение из LLM:**
```typescript
if (analysisResult.project_analysis.usage_rights_parsed) {
  setUsageRightsParsed(analysisResult.project_analysis.usage_rights_parsed);
}
```

3. **UI блок (показывать только если projectType?.name === 'Реклама'):**
```tsx
{projectType?.name === 'Реклама' && (
  <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fde047' }}>
    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#854d0e', marginBottom: '16px' }}>
      📜 Права использования
    </h3>
    
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
        Текст прав
      </label>
      <textarea 
        value={usageRightsParsed?.raw_text || ''}
        onChange={(e) => { 
          setUsageRightsParsed({
            ...usageRightsParsed,
            raw_text: e.target.value
          }); 
          setHasUnsavedChanges(true); 
        }}
        rows={3}
        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
        placeholder="ТВ-ролик, интернет на 2 года, территория РФ"
      />
    </div>
    
    {/* Распарсенные компоненты (read-only для проверки) */}
    {usageRightsParsed && (usageRightsParsed.types?.length > 0 || usageRightsParsed.duration || usageRightsParsed.territory) && (
      <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', border: '1px solid #fde047' }}>
        <div style={{ fontWeight: 'bold', color: '#854d0e', marginBottom: '8px' }}>
          Распарсенные данные:
        </div>
        {usageRightsParsed.types?.length > 0 && (
          <div style={{ marginBottom: '4px', color: '#78350f' }}>
            <strong>Типы:</strong> {usageRightsParsed.types.join(', ')}
          </div>
        )}
        {usageRightsParsed.duration && (
          <div style={{ marginBottom: '4px', color: '#78350f' }}>
            <strong>Срок:</strong> {usageRightsParsed.duration}
          </div>
        )}
        {usageRightsParsed.territory && (
          <div style={{ color: '#78350f' }}>
            <strong>Территория:</strong> {usageRightsParsed.territory}
          </div>
        )}
      </div>
    )}
  </div>
)}
```

4. **Очистка при смене типа с "Реклама" на другой:**
- НЕ очищаем `usageRightsParsed` (пользователь мог случайно изменить тип)
- Просто скрываем блок
- При отправке: если тип НЕ "Реклама" → отправляем `null`

5. **Отправка в API:**
```typescript
const projectPayload = {
  // ... existing fields
  usage_rights_parsed: projectType?.name === 'Реклама' ? usageRightsParsed : null
};
```

---

### 7. Frontend - ProjectFormModal.tsx (Редактирование)

**Аналогичные изменения:**
- State `usageRightsParsed`
- Предзаполнение из `projectData.usage_rights_parsed`
- Тот же UI блок с условным отображением
- Сохранение при update

---

## План внедрения (пошаговый)

### Этап 1: Backend - База данных и модели ⏱️ 5 мин

**Файлы:** `backend/projects/models.py`

```python
# В модель Project добавить:
usage_rights_parsed = models.JSONField(
    blank=True,
    null=True,
    default=None,
    verbose_name="Права использования",
    help_text="Структурированная информация о правах для рекламы: {raw_text, types, duration, territory}"
)
```

**Команды:**
```bash
docker-compose -f docker/docker-compose.yml --env-file .env exec backend python manage.py makemigrations
docker-compose -f docker/docker-compose.yml --env-file .env exec backend python manage.py migrate
```

---

### Этап 2: Backend - Serializers ⏱️ 3 мин

**Файл:** `backend/projects/serializers.py`

В `ProjectSerializer.Meta.fields` добавить:
```python
'usage_rights_parsed'
```

В `extra_kwargs` добавить:
```python
'usage_rights_parsed': {
    'help_text': 'Права использования (для рекламы)',
    'required': False,
    'allow_null': True
}
```

Перезапустить backend

---

### Этап 3: Backend - LLM Schema ⏱️ 5 мин

**Файл:** `backend/llm/llm_schema.json`

В `project_analysis.properties` добавить:
```json
"usage_rights_parsed": {
  "type": ["object", "null"],
  "description": "Распарсенные права использования материала (только для рекламы)",
  "additionalProperties": false,
  "properties": {
    "raw_text": {
      "type": "string",
      "description": "Исходный текст о правах из запроса"
    },
    "types": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Типы прав: ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, Интернет, и т.д."
    },
    "duration": {
      "type": ["string", "null"],
      "description": "Срок: '2 года', '3 месяца', 'бессрочно' или null"
    },
    "territory": {
      "type": ["string", "null"],
      "description": "Территория: 'РФ', 'СНГ', 'Весь мир' или null"
    }
  },
  "required": ["raw_text", "types"]
}
```

---

### Этап 4: Backend - LLM Prompt ⏱️ 10 мин

**Файл:** `backend/llm/llm_prompt.txt`

Добавить после основных правил извлечения:

```
═══════════════════════════════════════════════════════════
ОСОБЕННОСТИ ДЛЯ РЕКЛАМНЫХ ПРОЕКТОВ
═══════════════════════════════════════════════════════════

Если project_type = "Реклама", ОБЯЗАТЕЛЬНО ищи информацию о ПРАВАХ ИСПОЛЬЗОВАНИЯ!

📍 ГДЕ ИСКАТЬ:
- В начале или конце запроса
- После слов: "Права:", "Rights:", "Эксплуатация:", "Использование:"
- В полях special_conditions, notes любой роли
- В описании проекта

📝 ЧТО ИЗВЛЕКАТЬ:

1. RAW_TEXT - Точная цитата о правах из запроса

2. TYPES (массив) - Типы прав использования:
   • ТВ, ТВ-ролик, Эфирное ТВ, Кабельное ТВ
   • ОЛВ, ОЛВ-ролик (онлайн-видео реклама)
   • Интернет, Digital, Online
   • OOH (наружная реклама)
   • DOOH (цифровая наружная реклама)  
   • Радио
   • Печать, Пресса
   • Кинотеатры, Cinema
   • Социальные сети, Social Media

3. DURATION - Срок действия:
   • "2 года", "3 месяца", "6 месяцев", "1 год"
   • "бессрочно", "без ограничений"
   • null если не указан

4. TERRITORY - Территория:
   • "РФ", "Россия"
   • "СНГ"
   • "Весь мир", "Worldwide"
   • "Европа", "Азия", "США"
   • null если не указана

✅ ПРИМЕРЫ ПАРСИНГА:

Запрос: "Права: ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, интернет"
→ {
    "raw_text": "Права: ТВ-ролик, ОЛВ-ролик, OOH, DOOH, Радио, интернет",
    "types": ["ТВ-ролик", "ОЛВ-ролик", "OOH", "DOOH", "Радио", "Интернет"],
    "duration": null,
    "territory": null
  }

Запрос: "Интернет на 2 года, территория РФ"
→ {
    "raw_text": "Интернет на 2 года, территория РФ",
    "types": ["Интернет"],
    "duration": "2 года",
    "territory": "РФ"
  }

Запрос: "Эфирное ТВ 3 месяца, digital 1 год, СНГ"
→ {
    "raw_text": "Эфирное ТВ 3 месяца, digital 1 год, СНГ",
    "types": ["Эфирное ТВ", "Digital"],
    "duration": "3 месяца для ТВ, 1 год для digital",
    "territory": "СНГ"
  }

❌ ЕСЛИ:
- Проект НЕ "Реклама" → usage_rights_parsed = null
- Права не найдены в запросе → usage_rights_parsed = null
- НЕ ВЫДУМЫВАЙ права если их нет!
```

Обновить пример структуры ответа:
```
"usage_rights_parsed": {
  "raw_text": "ТВ-ролик, интернет на 2 года, РФ",
  "types": ["ТВ-ролик", "Интернет"],
  "duration": "2 года",
  "territory": "РФ"
} или null
```

---

### Этап 5: Frontend - Types ⏱️ 2 мин

**Файл:** `frontend/src/types/projects.ts`

Добавить интерфейс:
```typescript
export interface UsageRightsParsed {
  raw_text: string;
  types: string[];
  duration?: string | null;
  territory?: string | null;
}
```

В `ProjectExpanded`, `ProjectWithLLM`, `ProjectSearchResult` добавить:
```typescript
usage_rights_parsed?: UsageRightsParsed | null;
```

---

### Этап 6: Frontend - RequestsTable.tsx ⏱️ 15 мин

**1. State:**
```typescript
const [usageRightsParsed, setUsageRightsParsed] = useState<any>(null);
```

**2. Извлечение из LLM в `handleAutoAnalysis`:**
```typescript
if (analysisResult.project_analysis.usage_rights_parsed) {
  setUsageRightsParsed(analysisResult.project_analysis.usage_rights_parsed);
}
```

**3. Очистка в `handleConfirmClose`:**
```typescript
setUsageRightsParsed(null);
```

**4. UI блок - вставить ПОСЛЕ блока "Основная информация о проекте":**

Создать отдельный блок который появляется только когда `projectType?.name === 'Реклама'`

**5. Payload при создании:**
```typescript
usage_rights_parsed: projectType?.name === 'Реклама' ? usageRightsParsed : null
```

---

### Этап 7: Frontend - ProjectFormModal.tsx ⏱️ 10 мин

Аналогично `RequestsTable.tsx`:
- State
- Prefill из `projectData.usage_rights_parsed`
- UI блок
- Update payload

---

### Этап 8: Тестирование ⏱️ 10 мин

1. ✅ Проанализировать рекламный запрос с правами
2. ✅ Проверить что LLM распарсил правильно
3. ✅ Создать проект - права должны сохраниться
4. ✅ Открыть проект - права должны отображаться
5. ✅ Изменить тип на "Фильм" - блок должен скрыться
6. ✅ Вернуть тип на "Реклама" - блок появляется обратно
7. ✅ Редактировать права - должно сохраняться

---

## Временная оценка

| Этап | Время |
|------|-------|
| Backend модели + миграция | 5 мин |
| Backend serializers | 3 мин |
| LLM schema | 5 мин |
| LLM prompt | 10 мин |
| Frontend types | 2 мин |
| Frontend RequestsTable | 15 мин |
| Frontend ProjectFormModal | 10 мин |
| Тестирование | 10 мин |
| **ИТОГО** | **~60 мин** |

---

## Приступаю к реализации!

План утвержден. Начинаю с Этапа 1.

