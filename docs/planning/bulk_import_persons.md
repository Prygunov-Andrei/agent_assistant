# План реализации: Массовый импорт персон из Excel

## Обзор
Система массового добавления персон в базу данных через загрузку XLSX-файла с интеллектуальным обнаружением дубликатов и возможностью обновления существующих записей.

## Цель
Упростить процесс первичного заполнения базы данных персонами для новых агентов, позволяя импортировать списки контактов из Excel-файлов.

---

## Формат входного файла (XLSX)

### Структура столбцов

| № | Столбец | Описание | Обязательность | Формат |
|---|---------|----------|----------------|--------|
| 1 | Тип персоны | Роль/специализация | Обязательно | КД, Режиссер, Продюсер, и т.д. |
| 2 | Фамилия | Фамилия персоны | Обязательно | Текст |
| 3 | Имя | Имя персоны | Обязательно | Текст |
| 4 | Телефоны | Номера телефонов | Опционально | Через пробел: +79001234567 +79009876543 |
| 5 | Telegram | Никнеймы/ID в Telegram | Опционально | Через пробел: @ivanov @ivanov_official |
| 6 | Email | Адреса электронной почты | Опционально | Через пробел: ivan@mail.ru ivan.work@gmail.com |
| 7 | Кинопоиск | Ссылка на профиль | Опционально | https://www.kinopoisk.ru/name/12345/ |

### Пример строки
```
Режиссер | Иванов | Иван | +79001234567 +79009876543 | @ivanov @ivanov_official | ivan@mail.ru ivan.work@gmail.com | https://www.kinopoisk.ru/name/12345/
```

---

## Архитектура решения

### Backend (Django/Python)

#### 1. Новые файлы и модули

```
backend/people/
├── bulk_import.py          # Основная логика импорта
├── duplicate_finder.py     # Поиск дубликатов персон
├── excel_parser.py         # Парсинг XLSX файлов
└── serializers.py          # Дополнить для импорта
```

#### 2. API Endpoints

##### 2.1 Загрузка и предварительная обработка
```
POST /api/people/bulk-import/upload/
```
**Запрос:**
- Multipart/form-data с XLSX файлом

**Ответ:**
```json
{
  "import_id": "uuid",
  "total_rows": 150,
  "valid_rows": 145,
  "invalid_rows": 5,
  "preview": [
    {
      "row_number": 1,
      "data": {
        "person_type": "Режиссер",
        "last_name": "Иванов",
        "first_name": "Иван",
        "phones": ["+79001234567", "+79009876543"],
        "telegrams": ["@ivanov", "@ivanov_official"],
        "emails": ["ivan@mail.ru", "ivan.work@gmail.com"],
        "kinopoisk_url": "https://www.kinopoisk.ru/name/12345/"
      },
      "validation_errors": [],
      "potential_duplicates": [
        {
          "person_id": 123,
          "match_score": 95,
          "match_reasons": ["Точное совпадение ФИО", "Совпадает телефон +79001234567"],
          "existing_data": {
            "full_name": "Иванов Иван Петрович",
            "person_type": "Режиссер",
            "contacts": [...]
          }
        }
      ]
    }
  ],
  "errors": [
    {
      "row_number": 10,
      "errors": ["Не указано имя", "Неверный формат email"]
    }
  ]
}
```

##### 2.2 Подтверждение и выполнение импорта
```
POST /api/people/bulk-import/confirm/
```
**Запрос:**
```json
{
  "import_id": "uuid",
  "decisions": [
    {
      "row_number": 1,
      "action": "create",  // create | update | skip
      "person_id": null    // Только для action=update
    },
    {
      "row_number": 2,
      "action": "update",
      "person_id": 123
    },
    {
      "row_number": 3,
      "action": "skip"
    }
  ]
}
```

**Ответ:**
```json
{
  "status": "completed",
  "statistics": {
    "created": 120,
    "updated": 25,
    "skipped": 5,
    "errors": 0
  },
  "details": [
    {
      "row_number": 1,
      "action": "created",
      "person_id": 456,
      "full_name": "Иванов Иван"
    }
  ]
}
```

##### 2.3 Скачивание шаблона
```
GET /api/people/bulk-import/template/
```
**Ответ:** XLSX файл с примером заполнения

#### 3. Логика поиска дубликатов

**Файл:** `backend/people/duplicate_finder.py`

**Критерии поиска:**
1. **Точное совпадение ФИО** (100% score)
   - Полное совпадение фамилии и имени
   
2. **Частичное совпадение ФИО** (70-90% score)
   - Фамилия совпадает + первая буква имени
   - Использовать fuzzy matching (библиотека `fuzzywuzzy` или `rapidfuzz`)
   
3. **Совпадение контактов** (80-100% score)
   - Любой телефон совпадает
   - Любой Telegram совпадает
   - Любой Email совпадает
   
4. **Комбинированный score**
   - Взвешенная сумма всех критериев
   - Порог для показа пользователю: 60%

**Пример кода:**
```python
class PersonDuplicateFinder:
    def find_duplicates(self, person_data):
        """
        Поиск похожих персон в БД
        Возвращает список с % совпадения
        """
        candidates = []
        
        # Поиск по ФИО
        fio_matches = self._find_by_fio(
            person_data['last_name'], 
            person_data['first_name']
        )
        
        # Поиск по контактам
        contact_matches = self._find_by_contacts(
            person_data['phones'],
            person_data['telegrams'],
            person_data['emails']
        )
        
        # Объединение и ранжирование
        return self._rank_candidates(fio_matches, contact_matches)
```

#### 4. Парсер Excel

**Файл:** `backend/people/excel_parser.py`

```python
import openpyxl
from typing import List, Dict

class ExcelPersonParser:
    COLUMNS = {
        'A': 'person_type',
        'B': 'last_name',
        'C': 'first_name',
        'D': 'phones',
        'E': 'telegrams',
        'F': 'emails',
        'G': 'kinopoisk_url'
    }
    
    def parse_file(self, file_path) -> List[Dict]:
        """Парсит XLSX файл и возвращает список записей"""
        workbook = openpyxl.load_workbook(file_path)
        sheet = workbook.active
        
        records = []
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2), start=2):
            record = self._parse_row(row, row_idx)
            if record:
                records.append(record)
                
        return records
    
    def _parse_row(self, row, row_number) -> Dict:
        """Парсит одну строку"""
        data = {
            'row_number': row_number,
            'person_type': row[0].value,
            'last_name': row[1].value,
            'first_name': row[2].value,
            'phones': self._split_contacts(row[3].value),
            'telegrams': self._split_contacts(row[4].value),
            'emails': self._split_contacts(row[5].value),
            'kinopoisk_url': row[6].value,
        }
        return data
    
    def _split_contacts(self, value) -> List[str]:
        """Разделяет контакты через пробел"""
        if not value:
            return []
        return [c.strip() for c in str(value).split() if c.strip()]
```

#### 5. Сервис импорта

**Файл:** `backend/people/bulk_import.py`

```python
class BulkImportService:
    def __init__(self):
        self.parser = ExcelPersonParser()
        self.duplicate_finder = PersonDuplicateFinder()
        self.validator = PersonDataValidator()
    
    def process_upload(self, file, user):
        """Обработка загруженного файла"""
        # 1. Сохранить файл временно
        import_session = self._create_import_session(file, user)
        
        # 2. Парсить файл
        records = self.parser.parse_file(import_session.file_path)
        
        # 3. Валидация каждой записи
        validated_records = []
        for record in records:
            validation_result = self.validator.validate(record)
            if validation_result.is_valid:
                # 4. Поиск дубликатов
                duplicates = self.duplicate_finder.find_duplicates(record)
                record['potential_duplicates'] = duplicates
            else:
                record['validation_errors'] = validation_result.errors
            
            validated_records.append(record)
        
        # 5. Сохранить результаты в сессию
        import_session.records = validated_records
        import_session.save()
        
        return import_session
    
    def execute_import(self, import_session, decisions):
        """Выполнение импорта с учетом решений пользователя"""
        results = {
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': 0,
            'details': []
        }
        
        for decision in decisions:
            record = import_session.get_record(decision['row_number'])
            
            try:
                if decision['action'] == 'create':
                    person = self._create_person(record)
                    results['created'] += 1
                    
                elif decision['action'] == 'update':
                    person = self._update_person(
                        decision['person_id'], 
                        record
                    )
                    results['updated'] += 1
                    
                else:  # skip
                    results['skipped'] += 1
                    continue
                
                results['details'].append({
                    'row_number': decision['row_number'],
                    'action': decision['action'],
                    'person_id': person.id,
                    'full_name': person.full_name
                })
                
            except Exception as e:
                results['errors'] += 1
                results['details'].append({
                    'row_number': decision['row_number'],
                    'action': 'error',
                    'error': str(e)
                })
        
        return results
    
    def _create_person(self, record):
        """Создание новой персоны с контактами"""
        person = Person.objects.create(
            last_name=record['last_name'],
            first_name=record['first_name'],
            person_type=record['person_type'],
            kinopoisk_url=record['kinopoisk_url']
        )
        
        # Создать контакты
        self._create_contacts(person, record)
        
        return person
    
    def _update_person(self, person_id, record):
        """Обновление существующей персоны"""
        person = Person.objects.get(id=person_id)
        
        # Обновить базовые данные (если нужно)
        if not person.kinopoisk_url and record['kinopoisk_url']:
            person.kinopoisk_url = record['kinopoisk_url']
            person.save()
        
        # Добавить новые контакты (без дублирования)
        self._create_contacts(person, record, skip_existing=True)
        
        return person
    
    def _create_contacts(self, person, record, skip_existing=False):
        """Создание контактов для персоны"""
        # Телефоны
        for phone in record['phones']:
            if skip_existing and self._contact_exists(person, 'phone', phone):
                continue
            Contact.objects.create(
                person=person,
                contact_type='phone',
                value=phone
            )
        
        # Telegram
        for telegram in record['telegrams']:
            if skip_existing and self._contact_exists(person, 'telegram', telegram):
                continue
            Contact.objects.create(
                person=person,
                contact_type='telegram',
                value=telegram
            )
        
        # Email
        for email in record['emails']:
            if skip_existing and self._contact_exists(person, 'email', email):
                continue
            Contact.objects.create(
                person=person,
                contact_type='email',
                value=email
            )
```

#### 6. Views

**Файл:** `backend/people/views.py` (дополнить)

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .bulk_import import BulkImportService

bulk_import_service = BulkImportService()

@api_view(['POST'])
def bulk_import_upload(request):
    """Загрузка и предварительная обработка файла"""
    if 'file' not in request.FILES:
        return Response(
            {'error': 'Файл не предоставлен'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Валидация файла
    if not file.name.endswith('.xlsx'):
        return Response(
            {'error': 'Неверный формат файла. Требуется XLSX'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Обработка
    try:
        import_session = bulk_import_service.process_upload(
            file, 
            request.user
        )
        serializer = ImportSessionSerializer(import_session)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def bulk_import_confirm(request):
    """Выполнение импорта с учетом решений пользователя"""
    import_id = request.data.get('import_id')
    decisions = request.data.get('decisions', [])
    
    # Получить сессию импорта
    import_session = ImportSession.objects.get(id=import_id)
    
    # Выполнить импорт
    results = bulk_import_service.execute_import(import_session, decisions)
    
    return Response(results)

@api_view(['GET'])
def bulk_import_template(request):
    """Скачивание шаблона Excel"""
    from django.http import FileResponse
    template_path = 'templates/person_import_template.xlsx'
    return FileResponse(
        open(template_path, 'rb'),
        as_attachment=True,
        filename='person_import_template.xlsx'
    )
```

#### 7. URLs

**Файл:** `backend/people/urls.py` (дополнить)

```python
from django.urls import path
from . import views

urlpatterns = [
    # ... существующие URL
    path('bulk-import/upload/', views.bulk_import_upload, name='bulk-import-upload'),
    path('bulk-import/confirm/', views.bulk_import_confirm, name='bulk-import-confirm'),
    path('bulk-import/template/', views.bulk_import_template, name='bulk-import-template'),
]
```

#### 8. Модели (дополнительные)

**Файл:** `backend/people/models.py` (дополнить)

```python
class ImportSession(models.Model):
    """Сессия импорта для отслеживания"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='imports/')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('uploaded', 'Загружен'),
            ('processing', 'Обработка'),
            ('pending', 'Ожидает подтверждения'),
            ('completed', 'Завершен'),
            ('failed', 'Ошибка')
        ],
        default='uploaded'
    )
    records_data = models.JSONField(default=dict)  # Хранение обработанных записей
    
    class Meta:
        db_table = 'people_import_sessions'
```

#### 9. Зависимости

**Файл:** `backend/requirements.txt` (дополнить)

```
openpyxl>=3.1.2
rapidfuzz>=3.5.2  # Для fuzzy matching имен
```

---

### Frontend (React/TypeScript)

#### 1. Новые компоненты

```
frontend/src/
├── pages/
│   └── Settings/
│       └── BulkImport/
│           ├── BulkImportPage.tsx         # Главная страница импорта
│           ├── FileUploader.tsx           # Загрузчик файла
│           ├── ImportPreview.tsx          # Предпросмотр данных
│           ├── ConflictResolver.tsx       # Разрешение конфликтов
│           ├── DuplicateCard.tsx          # Карточка дубликата
│           ├── ImportProgress.tsx         # Прогресс импорта
│           ├── ImportResults.tsx          # Результаты
│           └── UserInstruction.tsx        # Инструкция
├── services/
│   └── bulkImportService.ts               # API сервис
└── types/
    └── bulkImport.ts                      # TypeScript типы
```

#### 2. Типы TypeScript

**Файл:** `frontend/src/types/bulkImport.ts`

```typescript
export interface PersonImportRow {
  row_number: number;
  data: {
    person_type: string;
    last_name: string;
    first_name: string;
    phones: string[];
    telegrams: string[];
    emails: string[];
    kinopoisk_url?: string;
  };
  validation_errors: string[];
  potential_duplicates: PotentialDuplicate[];
}

export interface PotentialDuplicate {
  person_id: number;
  match_score: number;
  match_reasons: string[];
  existing_data: {
    full_name: string;
    person_type: string;
    contacts: Contact[];
  };
}

export interface ImportDecision {
  row_number: number;
  action: 'create' | 'update' | 'skip';
  person_id?: number;
}

export interface ImportSession {
  import_id: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  preview: PersonImportRow[];
  errors: ImportError[];
}

export interface ImportResult {
  status: string;
  statistics: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  details: ImportDetail[];
}
```

#### 3. API сервис

**Файл:** `frontend/src/services/bulkImportService.ts`

```typescript
import api from './api';

class BulkImportService {
  async uploadFile(file: File): Promise<ImportSession> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/people/bulk-import/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
  
  async confirmImport(
    importId: string, 
    decisions: ImportDecision[]
  ): Promise<ImportResult> {
    const response = await api.post('/people/bulk-import/confirm/', {
      import_id: importId,
      decisions,
    });
    
    return response.data;
  }
  
  async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/people/bulk-import/template/', {
      responseType: 'blob',
    });
    
    return response.data;
  }
}

export default new BulkImportService();
```

#### 4. Главная страница импорта

**Файл:** `frontend/src/pages/Settings/BulkImport/BulkImportPage.tsx`

```typescript
import React, { useState } from 'react';
import FileUploader from './FileUploader';
import ImportPreview from './ImportPreview';
import ConflictResolver from './ConflictResolver';
import ImportResults from './ImportResults';
import UserInstruction from './UserInstruction';

type Step = 'instruction' | 'upload' | 'preview' | 'resolve' | 'results';

const BulkImportPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('instruction');
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [decisions, setDecisions] = useState<ImportDecision[]>([]);
  const [results, setResults] = useState<ImportResult | null>(null);

  const handleFileUploaded = (session: ImportSession) => {
    setImportSession(session);
    setCurrentStep('preview');
  };

  const handlePreviewConfirmed = () => {
    setCurrentStep('resolve');
  };

  const handleDecisionsConfirmed = async (finalDecisions: ImportDecision[]) => {
    setDecisions(finalDecisions);
    
    // Выполнить импорт
    const result = await bulkImportService.confirmImport(
      importSession!.import_id,
      finalDecisions
    );
    
    setResults(result);
    setCurrentStep('results');
  };

  const handleStartOver = () => {
    setCurrentStep('instruction');
    setImportSession(null);
    setDecisions([]);
    setResults(null);
  };

  return (
    <div className="bulk-import-page">
      <h1>Массовый импорт персон</h1>
      
      {/* Stepper */}
      <div className="stepper">
        <Step active={currentStep === 'instruction'}>Инструкция</Step>
        <Step active={currentStep === 'upload'}>Загрузка</Step>
        <Step active={currentStep === 'preview'}>Предпросмотр</Step>
        <Step active={currentStep === 'resolve'}>Дубликаты</Step>
        <Step active={currentStep === 'results'}>Результаты</Step>
      </div>

      {/* Контент */}
      <div className="step-content">
        {currentStep === 'instruction' && (
          <UserInstruction onStart={() => setCurrentStep('upload')} />
        )}
        
        {currentStep === 'upload' && (
          <FileUploader onFileUploaded={handleFileUploaded} />
        )}
        
        {currentStep === 'preview' && importSession && (
          <ImportPreview
            session={importSession}
            onConfirm={handlePreviewConfirmed}
            onCancel={handleStartOver}
          />
        )}
        
        {currentStep === 'resolve' && importSession && (
          <ConflictResolver
            session={importSession}
            onConfirm={handleDecisionsConfirmed}
            onCancel={handleStartOver}
          />
        )}
        
        {currentStep === 'results' && results && (
          <ImportResults
            results={results}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;
```

#### 5. Компонент инструкции

**Файл:** `frontend/src/pages/Settings/BulkImport/UserInstruction.tsx`

```typescript
import React from 'react';
import bulkImportService from '../../../services/bulkImportService';

interface Props {
  onStart: () => void;
}

const UserInstruction: React.FC<Props> = ({ onStart }) => {
  const handleDownloadTemplate = async () => {
    const blob = await bulkImportService.downloadTemplate();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'шаблон_импорта_персон.xlsx';
    link.click();
  };

  return (
    <div className="user-instruction">
      <h2>Как импортировать персон из Excel?</h2>
      
      <div className="instruction-content">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-text">
            <h3>Подготовьте Excel файл</h3>
            <p>
              Создайте файл в формате XLSX с таблицей персон. 
              Вы можете скачать готовый шаблон для заполнения.
            </p>
            <button 
              className="btn-download-template"
              onClick={handleDownloadTemplate}
            >
              📥 Скачать шаблон
            </button>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-text">
            <h3>Структура файла</h3>
            <p>Файл должен содержать следующие столбцы:</p>
            <table className="structure-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Столбец</th>
                  <th>Описание</th>
                  <th>Пример</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Тип персоны</td>
                  <td>Роль (обязательно)</td>
                  <td>КД, Режиссер, Продюсер</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Фамилия</td>
                  <td>Фамилия (обязательно)</td>
                  <td>Иванов</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Имя</td>
                  <td>Имя (обязательно)</td>
                  <td>Иван</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Телефоны</td>
                  <td>Через пробел (опционально)</td>
                  <td>+79001234567 +79009876543</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Telegram</td>
                  <td>Через пробел (опционально)</td>
                  <td>@ivanov @ivanov_official</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Email</td>
                  <td>Через пробел (опционально)</td>
                  <td>ivan@mail.ru ivan.work@gmail.com</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>Кинопоиск</td>
                  <td>Ссылка на профиль (опционально)</td>
                  <td>https://www.kinopoisk.ru/name/12345/</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-text">
            <h3>Загрузите файл</h3>
            <p>
              После подготовки файла загрузите его в систему. 
              Мы автоматически проверим данные и найдем возможные дубликаты.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-text">
            <h3>Разрешите конфликты</h3>
            <p>
              Если система найдет похожие персоны в базе, 
              вы сможете решить - создать новую запись или обновить существующую.
            </p>
          </div>
        </div>

        <div className="important-notes">
          <h3>⚠️ Важно:</h3>
          <ul>
            <li>Фамилия и Имя - обязательные поля</li>
            <li>Контакты можно указывать через пробел (несколько в одной ячейке)</li>
            <li>Система автоматически найдет дубликаты и предложит их обновить</li>
            <li>Максимальный размер файла - 5 МБ</li>
            <li>Рекомендуется начинать с небольших файлов (до 100 персон)</li>
          </ul>
        </div>
      </div>

      <div className="actions">
        <button 
          className="btn-primary btn-large"
          onClick={onStart}
        >
          Начать импорт →
        </button>
      </div>
    </div>
  );
};

export default UserInstruction;
```

#### 6. Компонент загрузчика

**Файл:** `frontend/src/pages/Settings/BulkImport/FileUploader.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import bulkImportService from '../../../services/bulkImportService';

interface Props {
  onFileUploaded: (session: ImportSession) => void;
}

const FileUploader: React.FC<Props> = ({ onFileUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Валидация
    if (!file.name.endsWith('.xlsx')) {
      setError('Пожалуйста, загрузите файл в формате .xlsx');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const session = await bulkImportService.uploadFile(file);
      onFileUploaded(session);
    } catch (err) {
      setError('Ошибка при загрузке файла. Проверьте формат и попробуйте снова.');
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  return (
    <div className="file-uploader">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Загрузка и анализ файла...</p>
          </div>
        ) : (
          <>
            <div className="dropzone-icon">📁</div>
            {isDragActive ? (
              <p>Отпустите файл здесь...</p>
            ) : (
              <>
                <p className="main-text">
                  Перетащите файл Excel сюда
                </p>
                <p className="sub-text">или</p>
                <button className="btn-select">
                  Выберите файл
                </button>
                <p className="hint">
                  Поддерживается только формат .xlsx (до 5 МБ)
                </p>
              </>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
```

#### 7. Компонент разрешения конфликтов

**Файл:** `frontend/src/pages/Settings/BulkImport/ConflictResolver.tsx`

```typescript
import React, { useState } from 'react';
import DuplicateCard from './DuplicateCard';

interface Props {
  session: ImportSession;
  onConfirm: (decisions: ImportDecision[]) => void;
  onCancel: () => void;
}

const ConflictResolver: React.FC<Props> = ({ session, onConfirm, onCancel }) => {
  const [decisions, setDecisions] = useState<Map<number, ImportDecision>>(
    new Map()
  );

  const rowsWithDuplicates = session.preview.filter(
    row => row.potential_duplicates.length > 0
  );

  const handleDecision = (
    rowNumber: number, 
    action: 'create' | 'update' | 'skip',
    personId?: number
  ) => {
    setDecisions(prev => {
      const newDecisions = new Map(prev);
      newDecisions.set(rowNumber, { row_number: rowNumber, action, person_id: personId });
      return newDecisions;
    });
  };

  const handleConfirm = () => {
    // Добавить решения для строк без дубликатов (автоматически создать)
    const allDecisions = session.preview.map(row => {
      if (decisions.has(row.row_number)) {
        return decisions.get(row.row_number)!;
      }
      return {
        row_number: row.row_number,
        action: 'create' as const
      };
    });

    onConfirm(allDecisions);
  };

  const allDecided = rowsWithDuplicates.every(row => 
    decisions.has(row.row_number)
  );

  return (
    <div className="conflict-resolver">
      <div className="header">
        <h2>Разрешение конфликтов</h2>
        <p>
          Найдено {rowsWithDuplicates.length} записей с возможными дубликатами.
          Пожалуйста, примите решение для каждой записи.
        </p>
      </div>

      <div className="progress-bar">
        <div className="progress">
          <div 
            className="progress-fill"
            style={{ 
              width: `${(decisions.size / rowsWithDuplicates.length) * 100}%` 
            }}
          />
        </div>
        <span className="progress-text">
          {decisions.size} / {rowsWithDuplicates.length} решений принято
        </span>
      </div>

      <div className="conflicts-list">
        {rowsWithDuplicates.map(row => (
          <div key={row.row_number} className="conflict-item">
            <div className="new-data">
              <h3>Новая персона (строка {row.row_number})</h3>
              <div className="person-info">
                <p><strong>Тип:</strong> {row.data.person_type}</p>
                <p><strong>ФИО:</strong> {row.data.last_name} {row.data.first_name}</p>
                {row.data.phones.length > 0 && (
                  <p><strong>Телефоны:</strong> {row.data.phones.join(', ')}</p>
                )}
                {row.data.telegrams.length > 0 && (
                  <p><strong>Telegram:</strong> {row.data.telegrams.join(', ')}</p>
                )}
                {row.data.emails.length > 0 && (
                  <p><strong>Email:</strong> {row.data.emails.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="duplicates">
              <h4>Найдены похожие персоны:</h4>
              {row.potential_duplicates.map(duplicate => (
                <DuplicateCard
                  key={duplicate.person_id}
                  duplicate={duplicate}
                  selected={
                    decisions.get(row.row_number)?.action === 'update' &&
                    decisions.get(row.row_number)?.person_id === duplicate.person_id
                  }
                  onSelect={() => handleDecision(row.row_number, 'update', duplicate.person_id)}
                />
              ))}
            </div>

            <div className="actions">
              <button
                className={`btn ${decisions.get(row.row_number)?.action === 'create' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleDecision(row.row_number, 'create')}
              >
                ✨ Создать новую персону
              </button>
              <button
                className={`btn ${decisions.get(row.row_number)?.action === 'skip' ? 'btn-warning' : 'btn-secondary'}`}
                onClick={() => handleDecision(row.row_number, 'skip')}
              >
                ⏭️ Пропустить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="footer-actions">
        <button className="btn-secondary" onClick={onCancel}>
          Отмена
        </button>
        <button 
          className="btn-primary btn-large"
          onClick={handleConfirm}
          disabled={!allDecided}
        >
          Подтвердить и выполнить импорт →
        </button>
      </div>
    </div>
  );
};

export default ConflictResolver;
```

#### 8. Интеграция в настройки

**Файл:** `frontend/src/pages/Settings/SettingsPage.tsx` (дополнить)

```typescript
import React from 'react';
import { Tab, Tabs } from '../../components/Tabs';
import BulkImportPage from './BulkImport/BulkImportPage';

const SettingsPage: React.FC = () => {
  return (
    <div className="settings-page">
      <h1>Настройки</h1>
      
      <Tabs>
        <Tab label="Общие">
          {/* Существующие настройки */}
        </Tab>
        
        <Tab label="Импорт персон">
          <BulkImportPage />
        </Tab>
        
        <Tab label="Профиль">
          {/* Существующие настройки профиля */}
        </Tab>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
```

---

## Этапы реализации

### Этап 1: Backend - Базовая инфраструктура (2-3 дня)
- [ ] Установить зависимости (openpyxl, rapidfuzz)
- [ ] Создать модель ImportSession
- [ ] Создать миграцию для ImportSession
- [ ] Создать ExcelPersonParser
- [ ] Написать unit-тесты для парсера

### Этап 2: Backend - Поиск дубликатов (2-3 дня)
- [ ] Создать PersonDuplicateFinder
- [ ] Реализовать алгоритмы сравнения:
  - [ ] Точное совпадение ФИО
  - [ ] Fuzzy matching ФИО
  - [ ] Сравнение по контактам
- [ ] Написать unit-тесты для duplicate finder

### Этап 3: Backend - Сервис импорта (3-4 дня)
- [ ] Создать BulkImportService
- [ ] Реализовать process_upload
- [ ] Реализовать execute_import
- [ ] Реализовать создание/обновление персон с контактами
- [ ] Написать integration-тесты

### Этап 4: Backend - API endpoints (1-2 дня)
- [ ] Создать views для импорта
- [ ] Создать serializers
- [ ] Настроить URLs
- [ ] Создать шаблон Excel файла
- [ ] Протестировать API через Postman/curl

### Этап 5: Frontend - Типы и сервисы (1 день)
- [ ] Создать TypeScript типы
- [ ] Создать bulkImportService
- [ ] Настроить API endpoints

### Этап 6: Frontend - Базовые компоненты (2-3 дня)
- [ ] Создать BulkImportPage с stepper
- [ ] Создать UserInstruction
- [ ] Создать FileUploader с drag&drop
- [ ] Стилизация компонентов

### Этап 7: Frontend - Обработка конфликтов (3-4 дня)
- [ ] Создать ImportPreview
- [ ] Создать ConflictResolver
- [ ] Создать DuplicateCard
- [ ] Создать ImportProgress
- [ ] Реализовать state management

### Этап 8: Frontend - Результаты (1-2 дня)
- [ ] Создать ImportResults
- [ ] Добавить экспорт лога
- [ ] Добавить возможность начать заново

### Этап 9: Интеграция (1-2 дня)
- [ ] Интегрировать в SettingsPage
- [ ] Добавить навигацию
- [ ] Добавить права доступа

### Этап 10: Тестирование (2-3 дня)
- [ ] E2E тесты полного флоу
- [ ] Тестирование с реальными файлами
- [ ] Тестирование edge cases
- [ ] Исправление багов

### Этап 11: Документация (1 день)
- [ ] Обновить README
- [ ] Создать пользовательскую документацию
- [ ] Создать видео-инструкцию (опционально)

---

## Тестирование

### Backend тесты

```python
# tests/unit/people/test_bulk_import.py
def test_excel_parser_valid_file():
    """Тест парсинга валидного файла"""
    pass

def test_duplicate_finder_exact_match():
    """Тест нахождения точного дубликата"""
    pass

def test_duplicate_finder_fuzzy_match():
    """Тест нахождения частичного совпадения"""
    pass

def test_duplicate_finder_contact_match():
    """Тест нахождения по контактам"""
    pass

def test_bulk_import_create_person():
    """Тест создания новой персоны"""
    pass

def test_bulk_import_update_person():
    """Тест обновления существующей персоны"""
    pass
```

### Frontend тесты

```typescript
// tests/unit/BulkImport/FileUploader.test.tsx
describe('FileUploader', () => {
  it('should accept xlsx files', () => {});
  it('should reject non-xlsx files', () => {});
  it('should show error for large files', () => {});
});

// tests/integration/BulkImport.test.tsx
describe('Bulk Import Flow', () => {
  it('should complete full import flow', async () => {});
  it('should handle duplicates correctly', async () => {});
});
```

---

## Безопасность

1. **Валидация файлов:**
   - Проверка расширения
   - Проверка размера
   - Проверка MIME-type
   - Защита от zip-bomb

2. **Валидация данных:**
   - Санитизация входных данных
   - Проверка форматов контактов
   - Защита от SQL injection

3. **Права доступа:**
   - Только авторизованные пользователи
   - Rate limiting на API
   - Логирование всех операций

---

## Производительность

1. **Backend:**
   - Обработка файлов в фоне (Celery - опционально)
   - Batch insert для контактов
   - Индексы на поля для поиска

2. **Frontend:**
   - Виртуализация списков (react-window)
   - Ленивая загрузка компонентов
   - Оптимизация ре-рендеров

---

## Инструкция для пользователя (краткая версия для UI)

### Как импортировать персон?

1. **Скачайте шаблон** - используйте готовый шаблон Excel
2. **Заполните данные** - добавьте информацию о персонах
3. **Загрузите файл** - перетащите или выберите файл
4. **Разрешите конфликты** - если найдены дубликаты, примите решение
5. **Готово!** - персоны добавлены в систему

**Важно:**
- Фамилия и Имя обязательны
- Контакты можно указывать через пробел
- Система автоматически найдет дубликаты
- Максимальный размер файла - 5 МБ

---

## Возможные расширения (будущее)

1. **CSV импорт** - поддержка CSV файлов
2. **Импорт из других систем** - API интеграция
3. **Экспорт персон** - выгрузка в Excel
4. **Шаблоны импорта** - сохранение настроек импорта
5. **История импортов** - журнал всех операций
6. **Массовое обновление** - групповое редактирование
7. **Валидация через API** - проверка данных внешними сервисами

---

## Оценка времени

**Total: 21-29 рабочих дней (4-6 недель)**

- Backend: 8-12 дней
- Frontend: 7-11 дней
- Тестирование: 2-3 дня
- Интеграция и отладка: 2-3 дня
- Документация: 1 день
- Буфер на непредвиденное: 1 день

