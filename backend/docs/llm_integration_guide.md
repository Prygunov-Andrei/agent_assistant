# Руководство по LLM интеграции

## Обзор

Данное руководство описывает интеграцию Large Language Model (LLM) в систему Agent Assistant для автоматического анализа запросов и создания проектов.

## 🎯 Цели интеграции

1. **Автоматический анализ запросов** - LLM анализирует входящие запросы и предлагает структурированные данные для создания проектов
2. **Предложение артистов** - LLM рекомендует подходящих артистов для ролей на основе анализа запроса
3. **Предзаполнение форм** - Автоматическое заполнение полей формы создания проекта
4. **Обучение модели** - Экспорт данных для тонкой настройки LLM

## 🏗️ Архитектура

### Компоненты системы

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │      LLM        │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ LLM Status  │ │◄──►│ │ LLM Service  │ │◄──►│ │   GPT-4o    │ │
│ │ Indicator   │ │    │ │              │ │    │ │             │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ Analysis    │ │◄──►│ │ Emulator     │ │    │                 │
│ │ Modal       │ │    │ │ Service      │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ Project     │ │◄──►│ │ Validation   │ │    │                 │
│ │ Form        │ │    │ │ Service      │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Поток данных

1. **Запрос на анализ** - Пользователь нажимает "Анализировать запрос"
2. **Подготовка данных** - Сбор текста запроса и данных артистов
3. **Отправка в LLM** - Формирование промпта и отправка в GPT-4o
4. **Валидация ответа** - Проверка структуры JSON ответа
5. **Предзаполнение формы** - Передача данных в форму создания проекта
6. **Проверка агентом** - Агент проверяет и корректирует данные
7. **Сохранение проекта** - Проект сохраняется в базу данных

## ⚙️ Конфигурация

### Файл llm_config.yaml

```yaml
llm:
  # Основные настройки
  model: "gpt-4o"
  temperature: 0.7
  max_tokens: 2000
  timeout: 30
  
  # Настройки повторных попыток
  max_retries: 3
  retry_delay: 1.0
  
  # Настройки валидации
  strict_validation: true
  fallback_to_emulator: true

# Промпты для различных типов запросов
prompts:
  analysis_prompt: |
    Проанализируй следующий запрос на кастинг и предложи структурированные данные для создания проекта.
    
    Запрос: {request_text}
    
    Доступные артисты: {artists_data}
    
    Верни ответ в формате JSON:
    {{
      "project_title": "Название проекта",
      "project_type": "Тип проекта",
      "genre": "Жанр",
      "description": "Описание проекта",
      "premiere_date": "YYYY-MM-DD",
      "roles": [
        {{
          "role_type": "Тип роли",
          "character_name": "Имя персонажа",
          "description": "Описание роли",
          "age_range": "Возрастной диапазон",
          "gender": "Пол",
          "suggested_artists": [1, 2, 3],
          "skills_required": {{
            "acting_skills": ["навык1", "навык2"],
            "physical_skills": ["навык1"],
            "languages": ["язык1"],
            "special_requirements": ["требование1"]
          }}
        }}
      ]
    }}

# Настройки экспорта данных для обучения
export:
  records_per_file: 50
  output_directory: "training_data"
  include_metadata: true
```

### Файл search_config.yaml

```yaml
# Пороги схожести для поиска совпадений
thresholds:
  person:
    name: 0.8
    email: 0.9
    phone: 0.9
    telegram: 0.8
  
  company:
    name: 0.8
    contact_person: 0.7
  
  project:
    title: 0.8
    description: 0.6

# Лимиты поиска
limits:
  max_results: 10
  min_confidence: 0.5
```

## 🔧 Реализация

### Backend сервисы

#### LLMService
```python
class LLMService:
    def __init__(self):
        self.config = self._load_config()
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def analyze_request(self, request_data, artists_data):
        """Анализ запроса через LLM"""
        prompt = self._build_prompt(request_data, artists_data)
        
        try:
            response = self.client.chat.completions.create(
                model=self.config['llm']['model'],
                messages=[{"role": "user", "content": prompt}],
                temperature=self.config['llm']['temperature'],
                max_tokens=self.config['llm']['max_tokens']
            )
            
            result = self._parse_response(response.choices[0].message.content)
            return self._validate_result(result)
            
        except Exception as e:
            if self.config['llm']['fallback_to_emulator']:
                return self._fallback_to_emulator(request_data, artists_data)
            raise e
```

#### LLMEmulatorService
```python
class LLMEmulatorService:
    """Эмулятор LLM для тестирования"""
    
    def analyze_request(self, request_data, artists_data):
        """Эмуляция анализа запроса"""
        # Логика эмуляции на основе ключевых слов в запросе
        if "драма" in request_data['text'].lower():
            return self._generate_drama_project(request_data, artists_data)
        elif "комедия" in request_data['text'].lower():
            return self._generate_comedy_project(request_data, artists_data)
        else:
            return self._generate_default_project(request_data, artists_data)
```

#### ValidationService
```python
class ValidationService:
    """Сервис валидации ответов LLM"""
    
    def validate_analysis_result(self, result):
        """Валидация структуры JSON ответа"""
        required_fields = ['project_title', 'project_type', 'roles']
        
        for field in required_fields:
            if field not in result:
                raise ValidationError(f"Отсутствует обязательное поле: {field}")
        
        # Валидация ролей
        for role in result.get('roles', []):
            self._validate_role(role)
        
        return True
```

### Frontend компоненты

#### LLMStatusIndicator
```typescript
interface LLMStatusIndicatorProps {
  status: AnalysisStatus;
  isLoading?: boolean;
}

const LLMStatusIndicator: React.FC<LLMStatusIndicatorProps> = ({ status, isLoading }) => {
  const getStatusColor = (status: AnalysisStatus) => {
    switch (status) {
      case 'new': return 'gray';
      case 'analyzing': return 'blue';
      case 'analyzed': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className={`status-indicator ${getStatusColor(status)}`}>
      {isLoading && <Spinner />}
      <span>{getStatusText(status)}</span>
    </div>
  );
};
```

#### RequestAnalysisModal
```typescript
interface RequestAnalysisModalProps {
  request: Request;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: LLMAnalysisResult) => void;
}

const RequestAnalysisModal: React.FC<RequestAnalysisModalProps> = ({
  request,
  isOpen,
  onClose,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await llmService.analyzeRequest(request.id);
      setAnalysisResult(result);
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Ошибка анализа:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="analysis-modal">
        <h2>Анализ запроса</h2>
        <div className="request-text">{request.text}</div>
        
        {isAnalyzing ? (
          <div className="analyzing">
            <Spinner />
            <p>Анализируем запрос...</p>
          </div>
        ) : (
          <div className="analysis-result">
            {analysisResult && (
              <AnalysisResultDisplay result={analysisResult} />
            )}
          </div>
        )}
        
        <div className="modal-actions">
          <button onClick={handleAnalyze} disabled={isAnalyzing}>
            Анализировать
          </button>
          <button onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </Modal>
  );
};
```

## 📊 API Endpoints

### Анализ запросов

#### POST /api/requests/{id}/analyze/
```json
{
  "request_id": 123,
  "use_emulator": false
}
```

**Ответ:**
```json
{
  "success": true,
  "result": {
    "project_title": "Название проекта",
    "project_type": "Тип проекта",
    "genre": "Жанр",
    "description": "Описание проекта",
    "premiere_date": "2024-12-31",
    "roles": [
      {
        "role_type": "Актер",
        "character_name": "Иван",
        "description": "Главный герой",
        "age_range": "25-35",
        "gender": "male",
        "suggested_artists": [1, 2, 3],
        "skills_required": {
          "acting_skills": ["драма", "комедия"],
          "physical_skills": ["танцы"],
          "languages": ["русский"],
          "special_requirements": []
        }
      }
    ]
  }
}
```

#### GET /api/requests/{id}/analysis-status/
**Ответ:**
```json
{
  "status": "analyzed",
  "analyzed_at": "2024-01-15T10:30:00Z",
  "project_id": 456
}
```

### Экспорт данных для обучения

#### POST /api/admin/export-training-dataset/
```json
{
  "records_per_file": 50,
  "include_metadata": true
}
```

**Ответ:**
```json
{
  "success": true,
  "files_created": 3,
  "total_records": 150,
  "files": [
    "training_data_001.jsonl",
    "training_data_002.jsonl",
    "training_data_003.jsonl"
  ]
}
```

## 🧪 Тестирование

### Unit тесты

```python
class TestLLMService:
    def test_analyze_request_success(self):
        service = LLMService()
        request_data = {"text": "Нужен актер для драмы"}
        artists_data = [{"id": 1, "name": "Иван Иванов"}]
        
        result = service.analyze_request(request_data, artists_data)
        
        assert result['project_title'] is not None
        assert 'roles' in result
        assert len(result['roles']) > 0

    def test_analyze_request_validation_error(self):
        service = LLMService()
        request_data = {"text": "Invalid request"}
        
        with pytest.raises(ValidationError):
            service.analyze_request(request_data, [])
```

### Integration тесты

```python
class TestLLMIntegration:
    def test_full_analysis_workflow(self):
        # Создание запроса
        request = RequestFactory(text="Нужен актер для комедии")
        
        # Анализ через API
        response = self.client.post(f'/api/requests/{request.id}/analyze/')
        assert response.status_code == 200
        
        # Проверка результата
        result = response.json()['result']
        assert result['project_title'] is not None
        
        # Создание проекта
        project_data = {
            'title': result['project_title'],
            'project_type': result['project_type'],
            'request_id': request.id
        }
        
        project_response = self.client.post('/api/projects/', project_data)
        assert project_response.status_code == 201
```

## 📈 Мониторинг и логирование

### Метрики производительности

```python
class MonitoringService:
    def track_analysis_time(self, request_id, duration):
        """Отслеживание времени анализа"""
        logger.info(f"Analysis completed for request {request_id} in {duration}s")
    
    def track_validation_errors(self, error_type, count):
        """Отслеживание ошибок валидации"""
        logger.warning(f"Validation error {error_type}: {count} occurrences")
    
    def track_llm_usage(self, tokens_used, cost):
        """Отслеживание использования LLM"""
        logger.info(f"LLM usage: {tokens_used} tokens, cost: ${cost}")
```

### Дашборд мониторинга

```typescript
interface MonitoringDashboardProps {
  metrics: {
    totalAnalyses: number;
    successRate: number;
    averageTime: number;
    errorRate: number;
  };
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ metrics }) => {
  return (
    <div className="monitoring-dashboard">
      <div className="metric-card">
        <h3>Всего анализов</h3>
        <span className="metric-value">{metrics.totalAnalyses}</span>
      </div>
      
      <div className="metric-card">
        <h3>Успешность</h3>
        <span className="metric-value">{metrics.successRate}%</span>
      </div>
      
      <div className="metric-card">
        <h3>Среднее время</h3>
        <span className="metric-value">{metrics.averageTime}s</span>
      </div>
      
      <div className="metric-card">
        <h3>Ошибки</h3>
        <span className="metric-value">{metrics.errorRate}%</span>
      </div>
    </div>
  );
};
```

## 🚨 Обработка ошибок

### Типы ошибок

1. **Ошибки LLM API**
   - Rate limit exceeded
   - Invalid API key
   - Network timeout
   - Model unavailable

2. **Ошибки валидации**
   - Неверная структура JSON
   - Отсутствующие обязательные поля
   - Некорректные типы данных

3. **Ошибки бизнес-логики**
   - Запрос уже проанализирован
   - Недостаточно данных для анализа
   - Ошибка сохранения проекта

### Стратегии обработки

```python
class ErrorHandler:
    def handle_llm_error(self, error):
        """Обработка ошибок LLM"""
        if isinstance(error, RateLimitError):
            # Повторная попытка через некоторое время
            return self._retry_with_delay()
        elif isinstance(error, APIKeyError):
            # Переключение на эмулятор
            return self._fallback_to_emulator()
        else:
            # Логирование и уведомление администратора
            self._log_error(error)
            raise error
    
    def handle_validation_error(self, error):
        """Обработка ошибок валидации"""
        if error.field == 'project_title':
            # Попытка исправить автоматически
            return self._auto_fix_title()
        else:
            # Требуется ручное исправление
            return self._request_manual_fix()
```

## 🔒 Безопасность

### Защита API ключей

```python
# settings.py
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ImproperlyConfigured("OPENAI_API_KEY not set")

# Использование в сервисе
class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        # Проверка валидности ключа
        self._validate_api_key()
```

### Валидация входных данных

```python
class InputValidator:
    def validate_request_text(self, text):
        """Валидация текста запроса"""
        if not text or len(text.strip()) < 10:
            raise ValidationError("Текст запроса слишком короткий")
        
        if len(text) > 10000:
            raise ValidationError("Текст запроса слишком длинный")
        
        # Проверка на потенциально опасный контент
        if self._contains_malicious_content(text):
            raise ValidationError("Запрос содержит недопустимый контент")
```

## 📚 Дополнительные ресурсы

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [JSON Schema Validation](https://json-schema.org/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
