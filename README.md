# Agent Assistant - Система автоматизации актерского агентства

Система для автоматизации работы актерского агентства с интеграцией LLM для анализа запросов и создания проектов.

## 🚀 Основные возможности

- **Анализ запросов через LLM** - автоматический анализ входящих запросов с предложением подходящих артистов
- **Управление артистами** - полная база данных артистов с навыками, фото и контактами
- **Создание проектов** - автоматическое создание проектов на основе анализа запросов
- **Поиск совпадений** - интеллектуальный поиск дубликатов персон, компаний и проектов
- **Telegram интеграция** - получение заявок через Telegram бота
- **Обучение LLM** - экспорт данных для тонкой настройки модели

## 📈 Текущий статус проекта

**Фаза 1: MVP для Агентов** - 85% завершено ✅
- Полностью функциональный LLM эмулятор + подключение к OpenAI GPT-4o
- Модальное рабочее место с автоматическим анализом запросов
- Подбор артистов с фильтрацией и поиском совпадений
- Управление персонами (КД, режиссёры, продюсеры)
- 750+ тестов (backend + frontend) - все проходят
- Оптимизация производительности (улучшение на 83.7%)

**Следующие этапы:**
- Фаза 2: Функционал для Кастинг-директоров (0%)
- Фаза 3: Функционал для Артистов (10%)
- Фаза 4: Интеграции и улучшения (20%)
- Фаза 5: Production Ready (5%)

📋 **Детальный план:** [docs/planning/module_plan_layer5.md](docs/planning/module_plan_layer5.md)

## 🏗️ Архитектура

### Backend (Django + PostgreSQL)
- **Django REST Framework** - API для фронтенда
- **PostgreSQL** - основная база данных
- **LLM интеграция** - GPT-4o для анализа запросов
- **LLM эмулятор** - система тестирования без реального LLM
- **Валидация JSON** - система валидации ответов LLM с повторными попытками
- **Fuzzy matching** - поиск совпадений с помощью `rapidfuzz`
- **Docker** - контейнеризация

### Frontend (React + TypeScript)
- **React 18** с TypeScript
- **Vite** - быстрый сборщик
- **LLM типы** - полные TypeScript типы для LLM интеграции
- **LLM сервис** - сервис для работы с анализом запросов
- **Fuse.js** - клиентский fuzzy matching
- **Axios** - HTTP клиент

## 📊 Схема базы данных

### Основные модели

#### Request (Запросы)
```python
class Request(models.Model):
    telegram_id = models.CharField(max_length=100, unique=True)
    text = models.TextField()
    author_name = models.CharField(max_length=200)
    author_username = models.CharField(max_length=100, blank=True)
    author_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    original_created_at = models.DateTimeField(null=True, blank=True)
    
    # Новые поля для LLM интеграции
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
    analysis_status = models.CharField(max_length=20, choices=ANALYSIS_STATUS_CHOICES, default='new')
```

#### Project (Проекты)
```python
class Project(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    project_type = models.ForeignKey(ProjectType, on_delete=models.PROTECT)
    genre = models.ForeignKey(Genre, on_delete=models.PROTECT)
    premiere_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Новые поля для LLM интеграции
    request = models.OneToOneField('telegram_requests.Request', on_delete=models.SET_NULL, null=True, blank=True)
    project_type_raw = models.CharField(max_length=100, blank=True, null=True)
```

#### ProjectRole (Роли в проекте)
```python
class ProjectRole(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='roles')
    role_type = models.ForeignKey(RoleType, on_delete=models.PROTECT)
    character_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    age_range = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Новые поля для LLM интеграции
    suggested_artists = models.ManyToManyField('artists.Artist', blank=True)
    skills_required = models.JSONField(blank=True, null=True)
```

#### Artist (Артисты)
```python
class Artist(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20)
    backup_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    telegram_username = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='artists/photos/', blank=True)
    bio = models.TextField(blank=True)
    clothing_size = models.CharField(max_length=10, blank=True)
    shoe_size = models.CharField(max_length=10, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    weight = models.PositiveIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
```

## 🤖 LLM интеграция

### Конфигурация
- **Файл настроек:** `backend/llm_config.yaml`
- **Пороги поиска:** `backend/search_config.yaml`
- **Модель:** GPT-4o (настраивается)
- **Эмулятор:** Включен по умолчанию для тестирования

### Компоненты
- **LLMEmulatorService** - эмулятор для тестирования без реального LLM
- **LLMResponseValidator** - валидация JSON ответов с повторными попытками
- **LLMService** - основной сервис для работы с LLM
- **TypeScript типы** - полные типы для фронтенда

### Workflow анализа запроса
1. **Получение запроса** - пользователь нажимает "Анализировать запрос"
2. **Отправка в LLM** - запрос + данные артистов отправляются в GPT-4o (или эмулятор)
3. **Валидация ответа** - проверка структуры JSON ответа с повторными попытками
4. **Предзаполнение формы** - данные передаются в форму создания проекта
5. **Проверка агентом** - агент проверяет и корректирует данные
6. **Сохранение проекта** - проект сохраняется в базу данных

### Экспорт обучающих данных
- **Команда:** `python manage.py export_training_dataset`
- **Формат:** JSONL файлы по 50 записей
- **Триггер:** Кнопка в админ-панели
- **Назначение:** Fine-tuning модели OpenAI

## 🔒 Безопасность

**⚠️ ВАЖНО:** Никогда не коммитьте секретные токены в репозиторий!

### Переменные окружения
- Создайте файл `.env` на основе `env.example`
- Добавьте `.env` в `.gitignore`
- Используйте переменные окружения для всех секретных данных

### Секретные данные
- **Telegram Bot Token** - получить у @BotFather
- **OpenAI API Key** - получить на platform.openai.com
- **Django Secret Key** - сгенерировать случайную строку

## 🚀 Установка и запуск

### Требования
- Docker и Docker Compose
- Node.js 20+ (для разработки фронтенда)
- Python 3.9+ (для разработки бэкенда)

### Запуск через Docker

**Полный запуск (ВСЕ сервисы + Telegram бот):**
```bash
# Клонирование репозитория
git clone <repository-url>
cd agent_assistant

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл, добавив ваши токены

# Запуск ВСЕГО проекта (рекомендуется)
./scripts/deploy/start_all.sh

# Остановка всех сервисов
./scripts/deploy/stop_all.sh
```

**Запуск БЕЗ Telegram бота (для разработки):**
```bash
./scripts/deploy/start.sh
```

**Ручной запуск:**
```bash
# Запуск всех сервисов
docker-compose -f docker/docker-compose.yml up -d

# Применение миграций
docker-compose -f docker/docker-compose.yml exec backend python manage.py migrate

# Создание суперпользователя
docker-compose -f docker/docker-compose.yml exec backend python manage.py createsuperuser
```

📚 **Подробная инструкция:** [docs/deployment/QUICK_DEPLOY_CHECKLIST.md](docs/deployment/QUICK_DEPLOY_CHECKLIST.md)

### Разработка

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Структура проекта

```
agent_assistant/
├── backend/                # Django бэкенд
│   ├── agent_assistant/   # Настройки Django
│   ├── api/               # API endpoints
│   ├── artists/           # Артисты
│   ├── companies/         # Компании
│   ├── core/              # Общие компоненты
│   ├── llm/               # LLM интеграция
│   ├── people/            # Персоны (КД, режиссёры, продюсеры)
│   ├── projects/          # Проекты и роли
│   ├── telegram_requests/ # Telegram бот
│   └── users/             # Пользователи
├── frontend/              # React фронтенд
│   └── src/
│       ├── components/    # React компоненты
│       ├── services/      # API сервисы
│       ├── types/         # TypeScript типы
│       └── pages/         # Страницы
├── docs/                  # 📚 Документация
│   ├── planning/          # Планирование проекта
│   ├── technical/         # Техническая документация
│   ├── deployment/        # Инструкции по деплою
│   └── bot/               # Документация бота
├── docker/                # 🐳 Docker конфигурации
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── docker-compose.bot.yml
├── scripts/               # 🔧 Скрипты
│   ├── deploy/            # Скрипты деплоя
│   ├── bot/               # Управление ботом
│   └── test/              # Тестовые скрипты
├── nginx/                 # Nginx конфигурация
├── .env.example           # Пример переменных окружения
└── README.md              # Этот файл
```

## 🧪 Тестирование

### Запуск всех тестов
```bash
./scripts/test/test_all.sh
```

### Backend тесты
```bash
./scripts/test/test_backend.sh
# или напрямую
cd backend && pytest
```

### Frontend тесты
```bash
./scripts/test/test_frontend.sh
# или напрямую
cd frontend && npm test
```

**Результаты:** 750+ тестов проходят успешно (450 backend + 299 frontend)

## 📚 API документация

### Основные endpoints

#### Запросы
- `GET /api/requests/` - список запросов
- `POST /api/requests/{id}/analyze/` - анализ запроса через LLM
- `GET /api/requests/{id}/text/` - получение текста запроса

#### Проекты
- `GET /api/projects/` - список проектов
- `POST /api/projects/` - создание проекта
- `PUT /api/projects/{id}/` - редактирование проекта

#### Артисты
- `GET /api/artists/` - список артистов
- `GET /api/artists/for-selection/` - артисты для выбора в ролях
- `POST /api/artists/search/` - поиск артистов

#### Поиск совпадений
- `POST /api/persons/search-matches/` - поиск совпадений персон
- `POST /api/companies/search-matches/` - поиск совпадений компаний
- `POST /api/projects/search-matches/` - поиск совпадений проектов

## 🔧 Конфигурация

### Переменные окружения
```bash
# Backend
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/agent_assistant
SECRET_KEY=your_secret_key

# Frontend
VITE_API_URL=http://localhost:8000/api
```

### LLM настройки
Файл `backend/llm_config.yaml`:
```yaml
llm:
  model: "gpt-4o"
  temperature: 0.7
  max_tokens: 2000
  timeout: 30

search:
  person_threshold: 0.8
  company_threshold: 0.8
  project_threshold: 0.8
```

## 📈 Производительность

- **Поддержка:** 1-10 агентов одновременно
- **LLM запросы:** с повторными попытками при ошибках
- **Кэширование:** для часто запрашиваемых данных
- **Индексы:** для полей поиска в базе данных

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

Для вопросов и предложений создавайте Issues в репозитории.
