# План реализации: Множественные контакты для Персон

## Цель
Добавить возможность хранения нескольких контактов (до 5 телефонов, email'ов, Telegram) для каждой Персоны с автоматическим дополнением при обнаружении новых контактов.

## Этапы реализации

### 1. Backend: Модель данных (People)

#### 1.1. Изменения в модели Person
**Файл:** `backend/people/models.py`

**Было:**
```python
phone = models.CharField(max_length=20, blank=True, null=True)
email = models.EmailField(blank=True, null=True)
telegram_username = models.CharField(max_length=50, blank=True, null=True)
```

**Станет:**
```python
phones = models.JSONField(
    default=list,
    blank=True,
    verbose_name="Телефоны",
    help_text="Массив телефонов (максимум 5)"
)
emails = models.JSONField(
    default=list,
    blank=True,
    verbose_name="Email адреса",
    help_text="Массив email (максимум 5)"
)
telegram_usernames = models.JSONField(
    default=list,
    blank=True,
    verbose_name="Telegram аккаунты",
    help_text="Массив Telegram username (максимум 5)"
)
```

**Добавить свойства для обратной совместимости:**
```python
@property
def phone(self):
    """Основной телефон (первый в списке)"""
    return self.phones[0] if self.phones else None

@property
def email(self):
    """Основной email (первый в списке)"""
    return self.emails[0] if self.emails else None

@property
def telegram_username(self):
    """Основной Telegram (первый в списке)"""
    return self.telegram_usernames[0] if self.telegram_usernames else None
```

#### 1.2. Миграция данных
**Файл:** создать `backend/people/migrations/000X_migrate_contacts_to_arrays.py`

- Преобразовать существующие одиночные контакты в массивы
- Перенести старые `phone` → `phones[0]`, `email` → `emails[0]`, `telegram_username` → `telegram_usernames[0]`
- Удалить старые поля

#### 1.3. Валидация
**Файл:** `backend/people/models.py`

Добавить метод `clean()`:
```python
def clean(self):
    # Ограничение максимум 5 контактов
    if len(self.phones) > 5:
        raise ValidationError("Максимум 5 телефонов")
    if len(self.emails) > 5:
        raise ValidationError("Максимум 5 email")
    if len(self.telegram_usernames) > 5:
        raise ValidationError("Максимум 5 Telegram")
```

### 2. Backend: Сериализаторы

#### 2.1. Обновить PersonSerializer
**Файл:** `backend/people/serializers.py`

- Изменить поля `phone`, `email`, `telegram_username` на `phones`, `emails`, `telegram_usernames`
- Добавить вычисляемые поля `primary_phone`, `primary_email`, `primary_telegram` (для обратной совместимости)

### 3. Backend: Система поиска

#### 3.1. Обновить поиск по контактам
**Файл:** `backend/people/views.py` (метод `search()`)

**Было:**
```python
if phone:
    search_filters |= Q(phone__icontains=phone)
```

**Станет:**
```python
if phone:
    search_filters |= Q(phones__contains=[phone])  # JSONField contains
```

Аналогично для `email` и `telegram`.

#### 3.2. Обновить fuzzy matching
**Файл:** `backend/people/services.py`

- Изменить `search_matches()` для поиска по массивам контактов
- При сравнении проверять ВСЕ контакты в массиве

### 4. Backend: Дедупликация и автодополнение

#### 4.1. Создать сервис автодополнения контактов
**Файл:** `backend/people/contact_manager.py` (новый)

```python
class PersonContactManager:
    """Управление контактами персон с автодополнением"""
    
    def add_contact_if_new(self, person, contact_type, contact_value):
        """
        Добавить контакт, если его еще нет
        
        Args:
            person: объект Person
            contact_type: 'phone', 'email' или 'telegram'
            contact_value: значение контакта
            
        Returns:
            (added: bool, notification: dict или None)
        """
        # Логика добавления нового контакта
        # Возвращает уведомление для агента
```

#### 4.2. Интеграция в обработку запросов
**Файл:** `backend/telegram_requests/services.py`

При обработке нового запроса:
1. Поиск существующей персоны по имени
2. Проверка контактов из запроса
3. Если найдена персона И есть новый контакт → вызвать `add_contact_if_new()`
4. Создать уведомление для агента

#### 4.3. Система уведомлений
**Файл:** `backend/people/models.py` (новая модель)

```python
class PersonContactAddition(models.Model):
    """Уведомление о добавлении нового контакта к персоне"""
    
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    contact_type = models.CharField(max_length=20)  # phone/email/telegram
    contact_value = models.CharField(max_length=255)
    added_from_request = models.ForeignKey('telegram_requests.TelegramRequest')
    added_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True)
    is_confirmed = models.BooleanField(default=False)
```

### 5. Frontend: Типы

#### 5.1. Обновить типы
**Файл:** `frontend/src/types/people.ts`

```typescript
export interface Person {
  // ... существующие поля
  phones: string[];
  emails: string[];
  telegram_usernames: string[];
  
  // Для обратной совместимости
  phone?: string;
  email?: string;
  telegram_username?: string;
}

export interface PersonFormData {
  // ... существующие поля
  phones?: string[];
  emails?: string[];
  telegram_usernames?: string[];
}
```

### 6. Frontend: Компоненты

#### 6.1. Компонент управления контактами
**Файл:** `frontend/src/components/people/ContactsManager.tsx` (новый)

```typescript
interface ContactsManagerProps {
  type: 'phone' | 'email' | 'telegram';
  contacts: string[];
  onChange: (contacts: string[]) => void;
  maxContacts?: number;
}
```

Функциональность:
- Список текущих контактов
- Кнопка "Добавить {тип контакта}"
- Кнопка удаления для каждого контакта
- Валидация максимум 5 контактов

#### 6.2. Обновить PersonForm
**Файл:** `frontend/src/components/people/PersonForm.tsx`

Заменить одиночные поля на `ContactsManager`:
```tsx
<ContactsManager
  type="phone"
  contacts={formData.phones || []}
  onChange={(phones) => setFormData(prev => ({ ...prev, phones }))}
  maxContacts={5}
/>
```

#### 6.3. Обновить PersonContacts (отображение)
**Файл:** `frontend/src/components/people/PersonContacts.tsx`

Показывать все контакты со свернутым/развернутым списком:
- По умолчанию: первый контакт + "(еще 2)"
- По клику: раскрыть все контакты

#### 6.4. Компонент уведомлений о новых контактах
**Файл:** `frontend/src/components/people/ContactAdditionNotification.tsx` (новый)

Показывать уведомление:
```
ℹ️ К персоне "Иванов Иван" добавлен новый телефон +7-999-123-45-67
   из запроса #123 от 16.10.2025
   [Просмотреть] [Подтвердить] [Отклонить]
```

### 7. Frontend: Сервисы

#### 7.1. Обновить peopleService
**Файл:** `frontend/src/services/people.ts`

Добавить методы:
```typescript
async getContactAdditions(personId?: number): Promise<ContactAddition[]>
async confirmContactAddition(additionId: number): Promise<void>
async rejectContactAddition(additionId: number): Promise<void>
```

### 8. Тестирование

#### 8.1. Backend тесты
**Файл:** `backend/people/tests.py`

- Тест добавления множественных контактов
- Тест валидации максимум 5 контактов
- Тест поиска по массивам контактов
- Тест автодополнения контактов
- Тест создания уведомлений

#### 8.2. Frontend тесты
**Файл:** `frontend/src/components/people/__tests__/ContactsManager.test.tsx`

- Тест добавления/удаления контактов
- Тест валидации максимума
- Тест отображения контактов

### 9. Миграция существующих данных

#### 9.1. Скрипт миграции
**Файл:** `backend/people/management/commands/migrate_contacts.py`

```bash
python manage.py migrate_contacts
```

Преобразует все существующие персоны с одиночными контактами в массивы.

---

## Порядок выполнения

1. ✅ Backend: модель и миграция (1.1, 1.2, 1.3)
2. ✅ Backend: сериализаторы (2.1)
3. ✅ Backend: поиск (3.1, 3.2)
4. ✅ Backend: автодополнение и уведомления (4.1, 4.2, 4.3)
5. ✅ Frontend: типы (5.1)
6. ✅ Frontend: компоненты (6.1, 6.2, 6.3, 6.4)
7. ✅ Frontend: сервисы (7.1)
8. ✅ Тестирование (8.1, 8.2)
9. ✅ Миграция данных (9.1)

## Риски и зависимости

- **Обратная совместимость:** Старые запросы могут использовать одиночные поля → обеспечить через @property
- **Производительность:** JSONField может быть медленнее → добавить индексы
- **UI/UX:** Множественные контакты не должны загромождать интерфейс → сворачиваемые списки

## Оценка времени
- Backend: ~4-6 часов
- Frontend: ~4-6 часов
- Тестирование: ~2-3 часа
- **Всего: ~10-15 часов**

