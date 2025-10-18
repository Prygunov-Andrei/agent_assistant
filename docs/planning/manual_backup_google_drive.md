# План системы ручного бэкапа с Google Drive

## 🎯 Концепция
**Ручной бэкап базы данных с автоматической загрузкой на Google Drive через админ-интерфейс**

### Основные принципы:
- ✅ **Ручное управление** - бэкап только по требованию админа
- ✅ **Google Drive** - надежное облачное хранение
- ✅ **Админ-интерфейс** - кнопка в настройках, видна только админу
- ✅ **Простота** - минимум настроек, максимум надежности

## 🏗️ Архитектура системы

### Компоненты:
1. **Backend API** - создание бэкапа и загрузка на Google Drive
2. **Frontend UI** - кнопка в админ-панели
3. **Google Drive API** - интеграция с облачным хранилищем
4. **Модель BackupRecord** - отслеживание бэкапов в БД

### Поток данных:
```
Админ нажимает кнопку → Frontend → Backend API → Создание бэкапа → Загрузка на Google Drive → Сохранение ссылки в БД
```

## 📋 Детальный план реализации

### Этап 1: Backend - Google Drive интеграция

#### 1.1 Установка зависимостей
```bash
# Добавить в requirements.txt
google-api-python-client==2.108.0
google-auth-httplib2==0.1.1
google-auth-oauthlib==1.1.0
```

#### 1.2 Настройка Google Drive API
- Создать проект в Google Cloud Console
- Включить Google Drive API
- Создать Service Account
- Скачать JSON ключ
- Создать папку "AgentAssistant_Backups" в Google Drive
- Получить ID папки и добавить переменные окружения:
  ```
  GOOGLE_DRIVE_CREDENTIALS_FILE=/app/credentials/google_drive_credentials.json
  GOOGLE_DRIVE_FOLDER_ID=your_folder_id
  GOOGLE_DRIVE_BACKUP_FOLDER_NAME=AgentAssistant_Backups
  GOOGLE_DRIVE_MAX_BACKUPS=10
  ```

#### 1.3 Модель BackupRecord
```python
class BackupRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    google_drive_file_id = models.CharField(max_length=255, unique=True)
    google_drive_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[
        ('creating', 'Создание'),
        ('uploading', 'Загрузка'),
        ('completed', 'Завершен'),
        ('failed', 'Ошибка'),
    ])
    error_message = models.TextField(blank=True, null=True)
```

#### 1.4 Сервис Google Drive
```python
class GoogleDriveService:
    def __init__(self):
        self.credentials = self._load_credentials()
        self.service = self._build_service()
        self.max_backups = settings.GOOGLE_DRIVE_MAX_BACKUPS
    
    def upload_backup(self, file_path: str, filename: str) -> dict:
        """Загружает файл бэкапа на Google Drive"""
        pass
    
    def delete_backup(self, file_id: str) -> bool:
        """Удаляет файл с Google Drive"""
        pass
    
    def list_backups(self) -> list:
        """Получает список всех бэкапов"""
        pass
    
    def cleanup_old_backups(self) -> int:
        """Удаляет старые бэкапы, оставляя только последние N"""
        # Получить все бэкапы, отсортированные по дате
        # Удалить самые старые, если их больше max_backups
        pass
```

#### 1.5 API Endpoints
```python
# URLs
path('api/backups/', include('backups.urls')),

# Views
class BackupCreateView(APIView):
    """Создание нового бэкапа"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        # 1. Создать BackupRecord со статусом 'creating'
        # 2. Запустить асинхронную задачу создания бэкапа
        # 3. Вернуть ID задачи
        pass

class BackupListView(ListAPIView):
    """Список всех бэкапов"""
    permission_classes = [IsAdminUser]
    serializer_class = BackupRecordSerializer

class BackupDownloadView(APIView):
    """Получение ссылки для скачивания"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, backup_id):
        # Получить ссылку на скачивание с Google Drive
        pass
```

### Этап 2: Backend - Создание бэкапов

#### 2.1 Сервис создания бэкапов
```python
class BackupService:
    def create_backup(self, user) -> BackupRecord:
        """Создает бэкап базы данных"""
        # 1. Создать BackupRecord
        # 2. Создать SQL дамп
        # 3. Сжать файл
        # 4. Загрузить на Google Drive
        # 5. Обновить статус
        pass
    
    def _create_sql_dump(self) -> str:
        """Создает SQL дамп базы данных"""
        pass
    
    def _compress_file(self, file_path: str) -> str:
        """Сжимает файл бэкапа"""
        pass
```

#### 2.2 Celery задачи (опционально)
```python
@shared_task
def create_backup_task(backup_id: str):
    """Асинхронная задача создания бэкапа"""
    # Для больших баз данных - выполнение в фоне
    pass
```

### Этап 3: Frontend - Админ интерфейс

#### 3.1 Компонент BackupManager
```typescript
interface BackupRecord {
  id: string;
  filename: string;
  file_size: number;
  created_at: string;
  status: 'creating' | 'uploading' | 'completed' | 'failed';
  google_drive_url: string;
}

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateBackup = async () => {
    // Вызов API для создания бэкапа
  };
  
  const handleDownloadBackup = (backupId: string) => {
    // Получение ссылки для скачивания
  };
  
  return (
    <div className="backup-manager">
      <h3>Резервное копирование базы данных</h3>
      
      <div className="backup-actions">
        <button 
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="btn btn-primary"
        >
          {isCreating ? 'Создание бэкапа...' : 'Создать бэкап'}
        </button>
      </div>
      
      <div className="backups-list">
        {/* Список существующих бэкапов */}
      </div>
    </div>
  );
};
```

#### 3.2 Интеграция в Settings
```typescript
// В SettingsPage.tsx добавить новую вкладку
const SettingsPage: React.FC = () => {
  const tabs = [
    { id: 'general', label: 'Общие' },
    { id: 'bulk-import', label: 'Импорт персон' },
    { id: 'backup', label: 'Резервное копирование' }, // ← Новая вкладка
  ];
  
  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case 'backup':
        return <BackupManager />;
      // ... другие вкладки
    }
  };
};
```

### Этап 4: Безопасность и мониторинг

#### 4.1 Права доступа
- Все пользователи с `is_staff=True` могут создавать бэкапы
- Проверка прав на уровне API и UI
- Логирование всех операций с бэкапами

#### 4.2 Обработка ошибок
```python
class BackupError(Exception):
    """Базовый класс для ошибок бэкапа"""
    pass

class GoogleDriveError(BackupError):
    """Ошибки работы с Google Drive"""
    pass

class DatabaseBackupError(BackupError):
    """Ошибки создания бэкапа БД"""
    pass
```

#### 4.3 Логирование
- Логирование всех операций в файл
- Отслеживание ошибок и успешных операций
- Статистика использования бэкапов

## 🔧 Технические детали

### Структура файлов:
```
backend/
├── backups/
│   ├── __init__.py
│   ├── models.py          # BackupRecord
│   ├── serializers.py     # BackupRecordSerializer
│   ├── views.py           # API views
│   ├── urls.py            # URL patterns
│   ├── services.py         # GoogleDriveService, BackupService
│   └── tasks.py           # Celery tasks (опционально)

frontend/src/
├── components/
│   └── BackupManager/
│       ├── BackupManager.tsx
│       ├── BackupList.tsx
│       └── BackupManager.css
└── services/
    └── backupService.ts   # API клиент
```

### Переменные окружения:
```bash
# Google Drive
GOOGLE_DRIVE_CREDENTIALS_FILE=/app/credentials/google_drive_credentials.json
GOOGLE_DRIVE_FOLDER_ID=1ABC123DEF456GHI789JKL
GOOGLE_DRIVE_BACKUP_FOLDER_NAME=AgentAssistant_Backups
GOOGLE_DRIVE_MAX_BACKUPS=10  # Максимум 10 бэкапов

# Database
DB_BACKUP_TIMEOUT=300  # 5 минут на создание бэкапа
```

### Формат файлов бэкапов:
```
agent_assistant_backup_2025-10-17_15-30-45.sql.gz
├── Префикс: agent_assistant_backup_
├── Дата: 2025-10-17
├── Время: 15-30-45
└── Расширение: .sql.gz
```

## 📊 UI/UX дизайн

### Вкладка "Резервное копирование":
```
┌─────────────────────────────────────────┐
│ 🔄 Резервное копирование базы данных    │
├─────────────────────────────────────────┤
│                                         │
│  📊 Статистика:                         │
│  • Последний бэкап: 17.10.2025 15:30   │
│  • Размер: 2.3 MB                      │
│  • Статус: ✅ Успешно                   │
│                                         │
│  [🔄 Создать новый бэкап]              │
│                                         │
│  📁 История бэкапов:                    │
│  ┌─────────────────────────────────────┐ │
│  │ 📄 agent_assistant_backup_2025-10-17│ │
│  │    15:30 • 2.3 MB • ✅              │ │
│  │    [📥 Скачать] [🗑️ Удалить]        │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 📄 agent_assistant_backup_2025-10-16│ │
│  │    14:20 • 2.1 MB • ✅              │ │
│  │    [📥 Скачать] [🗑️ Удалить]        │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🚀 Этапы внедрения

### Этап 1: Подготовка (1-2 дня)
- [ ] Настройка Google Cloud Console
- [ ] Создание Service Account
- [ ] Установка зависимостей

### Этап 2: Backend (2-3 дня)
- [ ] Модель BackupRecord
- [ ] Google Drive сервис
- [ ] API endpoints
- [ ] Тестирование

### Этап 3: Frontend (1-2 дня)
- [ ] Компонент BackupManager
- [ ] Интеграция в Settings
- [ ] Стилизация

### Этап 4: Тестирование (1 день)
- [ ] Тестирование создания бэкапов
- [ ] Тестирование загрузки на Google Drive
- [ ] Тестирование скачивания
- [ ] Тестирование прав доступа

## 💡 Преимущества данного подхода

1. **Простота** - минимум настроек, максимум функциональности
2. **Безопасность** - бэкапы в облаке, доступ только админу
3. **Надежность** - Google Drive как проверенное хранилище
4. **Контроль** - ручное управление, никаких автоматических процессов
5. **Масштабируемость** - легко добавить новые функции
6. **Мониторинг** - полная видимость процесса в UI

## 🔮 Возможные расширения в будущем

- Автоматические бэкапы по расписанию
- Интеграция с другими облачными хранилищами
- Шифрование бэкапов
- Восстановление из бэкапа через UI
- Уведомления в Telegram/Email
- Аналитика использования бэкапов
