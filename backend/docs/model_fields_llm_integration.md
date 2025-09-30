# Документация по новым полям моделей для LLM интеграции

## Обзор изменений

В рамках интеграции LLM в систему были добавлены новые поля в существующие модели Django для поддержки автоматического анализа запросов и создания проектов.

## 📋 Модель Request (telegram_requests)

### Новые поля

#### `project` (ForeignKey)
- **Тип:** `ForeignKey('projects.Project')`
- **Параметры:** `null=True, blank=True, on_delete=models.SET_NULL`
- **Назначение:** Связь запроса с созданным из него проектом
- **Использование:** Позволяет отслеживать, какой проект был создан на основе конкретного запроса

#### `analysis_status` (CharField)
- **Тип:** `CharField(max_length=20, choices=ANALYSIS_STATUS_CHOICES, default='new')`
- **Выборы:**
  - `'new'` - новый запрос, не анализировался
  - `'analyzed'` - запрос проанализирован LLM
  - `'processed'` - на основе запроса создан проект
- **Назначение:** Отслеживание статуса обработки запроса
- **Использование:** UI индикаторы, фильтрация, статистика

### Индексы
```python
class Meta:
    indexes = [
        models.Index(fields=['analysis_status']),
        models.Index(fields=['created_at']),
    ]
```

## 📋 Модель Project (projects)

### Новые поля

#### `request` (OneToOneField)
- **Тип:** `OneToOneField('telegram_requests.Request')`
- **Параметры:** `null=True, blank=True, on_delete=models.SET_NULL`
- **Назначение:** Обратная связь с запросом, на основе которого создан проект
- **Использование:** Отслеживание источника проекта, доступ к исходному тексту запроса

#### `project_type_raw` (CharField)
- **Тип:** `CharField(max_length=100, blank=True, null=True)`
- **Назначение:** Хранение "сырого" типа проекта, предложенного LLM
- **Использование:** Сравнение с выбранным типом, анализ качества LLM предложений

### Индексы
```python
class Meta:
    indexes = [
        models.Index(fields=['created_by']),
        models.Index(fields=['created_at']),
    ]
```

## 📋 Модель ProjectRole (projects)

### Новые поля

#### `suggested_artists` (ManyToManyField)
- **Тип:** `ManyToManyField('artists.Artist', blank=True)`
- **Назначение:** Артисты, предложенные LLM для данной роли
- **Использование:** Отображение предложений в UI, анализ качества рекомендаций

#### `skills_required` (JSONField)
- **Тип:** `JSONField(blank=True, null=True)`
- **Назначение:** Навыки, необходимые для роли, предложенные LLM
- **Формат данных:**
  ```json
  {
    "acting_skills": ["драма", "комедия"],
    "physical_skills": ["танцы", "фехтование"],
    "languages": ["английский", "французский"],
    "special_requirements": ["вождение", "плавание"]
  }
  ```
- **Использование:** Фильтрация артистов, анализ требований роли

### Индексы
```python
class Meta:
    indexes = [
        models.Index(fields=['project']),
        models.Index(fields=['role_type']),
    ]
```

## 🔄 Связи между моделями

### Request → Project
```python
# Создание связи
request = Request.objects.get(id=1)
project = Project.objects.create(
    title="Новый проект",
    request=request,
    # ... другие поля
)
request.project = project
request.analysis_status = 'processed'
request.save()
```

### Project → ProjectRole → Artist
```python
# Добавление предложенных артистов к роли
role = ProjectRole.objects.get(id=1)
suggested_artists = Artist.objects.filter(id__in=[1, 2, 3])
role.suggested_artists.set(suggested_artists)

# Установка навыков
role.skills_required = {
    "acting_skills": ["драма", "комедия"],
    "physical_skills": ["танцы"]
}
role.save()
```

## 📊 Миграции

### Создание миграций
```bash
python manage.py makemigrations telegram_requests
python manage.py makemigrations projects
```

### Применение миграций
```bash
python manage.py migrate
```

### Откат миграций (если необходимо)
```bash
python manage.py migrate telegram_requests 0001
python manage.py migrate projects 0001
```

## 🧪 Тестирование новых полей

### Unit тесты
```python
def test_request_analysis_status_field():
    request = RequestFactory(analysis_status='new')
    assert request.analysis_status == 'new'

def test_project_request_relationship():
    request = RequestFactory()
    project = ProjectFactory(request=request)
    assert project.request == request
    assert request.created_project == project

def test_project_role_suggested_artists():
    role = ProjectRoleFactory()
    artists = ArtistFactory.create_batch(3)
    role.suggested_artists.set(artists)
    assert role.suggested_artists.count() == 3
```

### Factory-Boy обновления
```python
class RequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Request
    
    analysis_status = 'new'
    project = None

class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Project
    
    request = None
    project_type_raw = factory.Faker('word')

class ProjectRoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectRole
    
    skills_required = factory.LazyFunction(lambda: {
        "acting_skills": ["драма"],
        "physical_skills": []
    })
    
    @factory.post_generation
    def suggested_artists(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for artist in extracted:
                self.suggested_artists.add(artist)
```

## 🔧 Админ-панель

### RequestAdmin обновления
```python
class RequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'author_name', 'analysis_status', 'project_link', 'created_at']
    list_filter = ['analysis_status', 'created_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('telegram_id', 'text', 'author_name', 'author_username', 'author_phone')
        }),
        ('LLM интеграция', {
            'fields': ('analysis_status', 'project')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'original_created_at')
        }),
    )
    
    def project_link(self, obj):
        if obj.project:
            return format_html('<a href="/admin/projects/project/{}/change/">{}</a>', 
                             obj.project.id, obj.project.title)
        return "Не создан"
    project_link.short_description = "Проект"
```

### ProjectAdmin обновления
```python
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'project_type', 'genre', 'request_link', 'created_by', 'created_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'description', 'project_type', 'genre', 'premiere_date')
        }),
        ('LLM интеграция', {
            'fields': ('request', 'project_type_raw')
        }),
        ('Системная информация', {
            'fields': ('created_by', 'created_at')
        }),
    )
    
    def request_link(self, obj):
        if obj.request:
            return format_html('<a href="/admin/telegram_requests/request/{}/change/">{}</a>', 
                             obj.request.id, obj.request.author_name)
        return "Не из запроса"
    request_link.short_description = "Запрос"
```

### ProjectRoleAdmin обновления
```python
class ProjectRoleAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Основная информация', {
            'fields': ('project', 'role_type', 'character_name', 'description')
        }),
        ('Требования к роли', {
            'fields': ('age_range', 'gender')
        }),
        ('LLM предложения', {
            'fields': ('suggested_artists', 'skills_required')
        }),
        ('Системная информация', {
            'fields': ('created_by',)
        }),
    )
    filter_horizontal = ('suggested_artists',)
```

## 📈 Производительность

### Рекомендуемые индексы
- `analysis_status` в Request - для фильтрации по статусу
- `created_at` в Request - для сортировки по времени
- `created_by` в Project - для фильтрации по агенту
- `project` в ProjectRole - для связи с проектом

### Оптимизация запросов
```python
# Эффективный запрос с предзагрузкой
requests = Request.objects.select_related('project').prefetch_related(
    'project__roles__suggested_artists'
).filter(analysis_status='analyzed')

# Запрос ролей с предложенными артистами
roles = ProjectRole.objects.prefetch_related('suggested_artists').filter(
    project=project
)
```

## 🚨 Важные замечания

1. **Обратная совместимость:** Все новые поля имеют `null=True` или `blank=True`, что обеспечивает совместимость с существующими данными.

2. **Валидация данных:** JSONField `skills_required` требует валидации на уровне сериализаторов.

3. **Миграция данных:** При применении миграций существующие записи получат значения по умолчанию.

4. **Производительность:** ManyToManyField `suggested_artists` может замедлить запросы при большом количестве связей.

5. **Безопасность:** JSONField требует осторожности при работе с пользовательскими данными.

## 📚 Дополнительные ресурсы

- [Django Model Field Reference](https://docs.djangoproject.com/en/stable/ref/models/fields/)
- [Django Migrations](https://docs.djangoproject.com/en/stable/topics/migrations/)
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/)
- [Django Admin Customization](https://docs.djangoproject.com/en/stable/ref/contrib/admin/)
