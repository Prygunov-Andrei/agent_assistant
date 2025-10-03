# Система тестирования

## Структура тестов

```
tests/
├── unit/                    # Unit тесты по приложениям
│   ├── artists/            # Тесты для приложения artists
│   ├── companies/          # Тесты для приложения companies
│   ├── projects/           # Тесты для приложения projects
│   ├── people/             # Тесты для приложения people
│   ├── users/              # Тесты для приложения users
│   ├── telegram_requests/  # Тесты для приложения telegram_requests
│   └── llm/                # Тесты для приложения llm
├── integration/            # Интеграционные тесты
├── e2e/                    # End-to-end тесты
├── fixtures/               # Общие фикстуры
├── utils/                  # Утилиты для тестов
└── conftest.py            # Общая конфигурация pytest
```

## Запуск тестов

### Все тесты
```bash
# Из корня проекта
./scripts/test_all.sh

# Или из backend директории
python -m pytest tests/ -v
```

### Unit тесты
```bash
# Все unit тесты
python -m pytest tests/unit/ -v

# Тесты конкретного приложения
python -m pytest tests/unit/companies/ -v

# Тесты с маркерами
python -m pytest tests/unit/ -m models -v
python -m pytest tests/unit/ -m services -v
```

### Интеграционные тесты
```bash
python -m pytest tests/integration/ -v
```

### Тесты с покрытием
```bash
python -m pytest tests/ --cov=. --cov-report=html
```

## Маркеры тестов

- `unit` - Unit тесты
- `integration` - Интеграционные тесты
- `e2e` - End-to-end тесты
- `api` - API тесты
- `models` - Тесты моделей
- `views` - Тесты представлений
- `services` - Тесты сервисов
- `slow` - Медленные тесты
- `security` - Тесты безопасности

## Добавление новых тестов

1. **Unit тесты** - добавляйте в `tests/unit/{app_name}/`
2. **Интеграционные тесты** - добавляйте в `tests/integration/`
3. **E2E тесты** - добавляйте в `tests/e2e/`

## Фикстуры

Общие фикстуры доступны в `conftest.py`:
- `api_client` - API клиент
- `authenticated_api_client` - Аутентифицированный API клиент
- `user` - Пользователь
- `admin_user` - Администратор

## Конфигурация

- `pytest.ini` - основная конфигурация pytest
- `conftest.py` - общие фикстуры и настройки
