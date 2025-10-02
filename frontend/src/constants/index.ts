/**
 * Константы фронтенда для устранения магических строк и чисел
 */

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/token/',
    REFRESH: '/token/refresh/',
    LOGOUT: '/logout/',
  },
  REQUESTS: {
    LIST: '/requests/',
    DETAIL: (id: number) => `/requests/${id}/`,
    ANALYZE: (id: number) => `/requests/${id}/analyze/`,
    STATUS: (id: number) => `/requests/${id}/analysis-status/`,
    STATS: '/requests/stats/',
  },
  PROJECTS: {
    LIST: '/projects/',
    DETAIL: (id: number) => `/projects/${id}/`,
    CREATE: '/projects/',
    UPDATE: (id: number) => `/projects/${id}/`,
    DELETE: (id: number) => `/projects/${id}/`,
    ROLES: '/project-roles/',
  },
  ARTISTS: {
    LIST: '/artists/',
    DETAIL: (id: number) => `/artists/${id}/`,
    FOR_LLM: '/llm/artists/',
    SEARCH: '/artists/search/',
  },
  PEOPLE: {
    LIST: '/people/',
    DETAIL: (id: number) => `/people/${id}/`,
    BY_TYPE: '/people/by-type/',
    SEARCH_MATCHES: '/people/search-matches/',
  },
  COMPANIES: {
    LIST: '/companies/',
    DETAIL: (id: number) => `/companies/${id}/`,
    SEARCH_MATCHES: '/companies/search-matches/',
  },
  LLM: {
    STATUS: '/status/',
    ARTISTS: '/llm/artists/',
  },
} as const;

// Статусы запросов
export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUS.PENDING]: 'Ожидает обработки',
  [REQUEST_STATUS.IN_PROGRESS]: 'В обработке',
  [REQUEST_STATUS.COMPLETED]: 'Выполнен',
  [REQUEST_STATUS.CANCELLED]: 'Отменен',
} as const;

// Статусы анализа LLM
export const ANALYSIS_STATUS = {
  NEW: 'new',
  ANALYZED: 'analyzed',
  PROCESSED: 'processed',
} as const;

export const ANALYSIS_STATUS_LABELS = {
  [ANALYSIS_STATUS.NEW]: 'Новый',
  [ANALYSIS_STATUS.ANALYZED]: 'Проанализирован',
  [ANALYSIS_STATUS.PROCESSED]: 'Обработан',
} as const;

// Типы проектов
export const PROJECT_TYPES = {
  FILM: 'Фильм',
  SERIES: 'Сериал',
  COMMERCIAL: 'Реклама',
  MUSIC_VIDEO: 'Клип',
  THEATER: 'Театр',
  DOCUMENTARY: 'Документальный фильм',
  SHORT_FILM: 'Короткометражный фильм',
} as const;

// Жанры
export const GENRES = {
  DRAMA: 'Драма',
  COMEDY: 'Комедия',
  ACTION: 'Боевик',
  THRILLER: 'Триллер',
  HORROR: 'Ужасы',
  ROMANCE: 'Мелодрама',
  FANTASY: 'Фэнтези',
  SCI_FI: 'Научная фантастика',
} as const;

// Пол
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  ANY: 'any',
} as const;

export const GENDER_LABELS = {
  [GENDER.MALE]: 'Мужской',
  [GENDER.FEMALE]: 'Женский',
  [GENDER.ANY]: 'Любой',
} as const;

// Типы персон
export const PERSON_TYPES = {
  CASTING_DIRECTOR: 'casting_director',
  DIRECTOR: 'director',
  PRODUCER: 'producer',
  ACTOR: 'actor',
  SCREENWRITER: 'screenwriter',
  COMPOSER: 'composer',
} as const;

export const PERSON_TYPE_LABELS = {
  [PERSON_TYPES.CASTING_DIRECTOR]: 'Кастинг-директор',
  [PERSON_TYPES.DIRECTOR]: 'Режиссер',
  [PERSON_TYPES.PRODUCER]: 'Продюсер',
  [PERSON_TYPES.ACTOR]: 'Актер',
  [PERSON_TYPES.SCREENWRITER]: 'Сценарист',
  [PERSON_TYPES.COMPOSER]: 'Композитор',
} as const;

// Настройки UI
export const UI_CONFIG = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Ошибка валидации данных.',
  UNAUTHORIZED: 'Необходима авторизация.',
  FORBIDDEN: 'Доступ запрещен.',
  NOT_FOUND: 'Объект не найден.',
  DUPLICATE: 'Дублирующийся объект уже существует.',
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка.',
} as const;

// Сообщения об успехе
export const SUCCESS_MESSAGES = {
  CREATED: 'Объект успешно создан',
  UPDATED: 'Объект успешно обновлен',
  DELETED: 'Объект успешно удален',
  PROJECT_CREATED: 'Проект успешно создан',
  ROLE_CREATED: 'Роль успешно создана',
  REQUEST_PROCESSED: 'Запрос успешно обработан',
  LOGIN_SUCCESS: 'Успешный вход в систему',
  LOGOUT_SUCCESS: 'Успешный выход из системы',
} as const;

// Регулярные выражения
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9]?[0-9\(\)\-\s]{7,20}$/,
  TELEGRAM_USERNAME: /^@[a-zA-Z0-9_]{5,32}$/,
  URL: /^https?:\/\/.+/,
} as const;

// Размеры файлов
export const FILE_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

// Поддерживаемые форматы файлов
export const SUPPORTED_FORMATS = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  VIDEOS: ['mp4', 'avi', 'mov', 'wmv', 'flv'],
} as const;

// Цвета для индикации статусов
export const STATUS_COLORS = {
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  PENDING: '#6B7280',
} as const;

// Анимации
export const ANIMATIONS = {
  FADE_IN: 'fadeIn 0.2s ease-in-out',
  SLIDE_UP: 'slideUp 0.3s ease-out',
  BOUNCE: 'bounce 0.5s ease-in-out',
} as const;
