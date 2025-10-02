"""
Константы проекта для устранения магических чисел и строк
"""

# Статусы запросов
class RequestStatus:
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    
    CHOICES = [
        (PENDING, 'Ожидает обработки'),
        (IN_PROGRESS, 'В обработке'),
        (COMPLETED, 'Выполнен'),
        (CANCELLED, 'Отменен'),
    ]


# Статусы анализа LLM
class AnalysisStatus:
    NEW = 'new'
    ANALYZED = 'analyzed'
    PROCESSED = 'processed'
    
    CHOICES = [
        (NEW, 'Новый'),
        (ANALYZED, 'Проанализирован'),
        (PROCESSED, 'Обработан'),
    ]


# Типы проектов
class ProjectType:
    FILM = 'Фильм'
    SERIES = 'Сериал'
    COMMERCIAL = 'Реклама'
    MUSIC_VIDEO = 'Клип'
    THEATER = 'Театр'
    DOCUMENTARY = 'Документальный фильм'
    SHORT_FILM = 'Короткометражный фильм'


# Жанры
class Genre:
    DRAMA = 'Драма'
    COMEDY = 'Комедия'
    ACTION = 'Боевик'
    THRILLER = 'Триллер'
    HORROR = 'Ужасы'
    ROMANCE = 'Мелодрама'
    FANTASY = 'Фэнтези'
    SCI_FI = 'Научная фантастика'


# Типы персон
class PersonType:
    CASTING_DIRECTOR = 'casting_director'
    DIRECTOR = 'director'
    PRODUCER = 'producer'
    ACTOR = 'actor'
    SCREENWRITER = 'screenwriter'
    COMPOSER = 'composer'
    
    CHOICES = [
        (CASTING_DIRECTOR, 'Кастинг-директор'),
        (DIRECTOR, 'Режиссер'),
        (PRODUCER, 'Продюсер'),
        (ACTOR, 'Актер'),
        (SCREENWRITER, 'Сценарист'),
        (COMPOSER, 'Композитор'),
    ]


# Пол
class Gender:
    MALE = 'male'
    FEMALE = 'female'
    ANY = 'any'
    
    CHOICES = [
        (MALE, 'Мужской'),
        (FEMALE, 'Женский'),
        (ANY, 'Любой'),
    ]


# Настройки API
class APISettings:
    DEFAULT_TIMEOUT = 10
    MAX_RETRIES = 3
    PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100


# Настройки Telegram Bot
class TelegramBotSettings:
    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
    SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif']
    SUPPORTED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'txt']
    WEBHOOK_TIMEOUT = 10


# Настройки LLM
class LLMSettings:
    DEFAULT_TEMPERATURE = 0.3
    DEFAULT_MAX_TOKENS = 2000
    DEFAULT_TIMEOUT = 30
    MAX_RETRY_ATTEMPTS = 3
    CONFIDENCE_THRESHOLD = 0.7


# Сообщения об ошибках
class ErrorMessages:
    VALIDATION_ERROR = 'Ошибка валидации данных'
    NOT_FOUND = 'Объект не найден'
    PERMISSION_DENIED = 'Доступ запрещен'
    SERVER_ERROR = 'Внутренняя ошибка сервера'
    NETWORK_ERROR = 'Ошибка сети'
    DUPLICATE_ERROR = 'Дублирующийся объект уже существует'
    INVALID_TOKEN = 'Недействительный токен'
    EXPIRED_TOKEN = 'Токен истек'


# Успешные сообщения
class SuccessMessages:
    CREATED = 'Объект успешно создан'
    UPDATED = 'Объект успешно обновлен'
    DELETED = 'Объект успешно удален'
    PROJECT_CREATED = 'Проект успешно создан'
    ROLE_CREATED = 'Роль успешно создана'
    REQUEST_PROCESSED = 'Запрос успешно обработан'


# Регулярные выражения
class RegexPatterns:
    EMAIL = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    PHONE = r'[\+]?[1-9]?[0-9\(\)\-\s]{7,20}'
    TELEGRAM_USERNAME = r'@[a-zA-Z0-9_]{5,32}'
    URL = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'


# Размеры файлов
class FileSizes:
    KB = 1024
    MB = KB * 1024
    GB = MB * 1024
    MAX_IMAGE_SIZE = 5 * MB
    MAX_DOCUMENT_SIZE = 20 * MB
    MAX_VIDEO_SIZE = 100 * MB
