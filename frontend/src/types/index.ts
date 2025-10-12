// Базовые типы для API ответов
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Типы для пользователей
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  photo?: string;
  phone?: string;
  bio?: string;
  birth_date?: string;
  telegram_username?: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

// Типы для артистов

export interface ArtistSkill {
  id: number;
  artist: number;
  skill: number;
  skill_name: string;
  skill_group_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  proficiency_level_display: string;
  created_at: string;
}

export interface ArtistEducation {
  id: number;
  artist: number;
  education: number;
  education_name: string;
  graduation_year: number;
  created_at: string;
}

export interface ArtistLink {
  id: number;
  artist: number;
  title: string;
  url: string;
  description?: string;
  created_at: string;
}

export interface ArtistPhoto {
  id: number;
  artist: number;
  photo: string;
  is_main: boolean;
  description?: string;
  created_at: string;
}

// Упрощенный тип для списка артистов
export interface ArtistListItem {
  id: number;
  first_name: string;
  last_name: string;
  stage_name?: string;
  full_name: string;
  gender: 'male' | 'female';
  gender_display: string;
  age?: number;
  media_presence: boolean;
  main_photo?: string;
  height?: number;
  weight?: number;
  city?: string;
  availability_status: boolean;
  availability_status_display: string;
  travel_availability: boolean;
  skills: ArtistSkillListItem[];
  skills_count: number;
  education_count: number;
  links_count: number;
  photos_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Упрощенный тип для навыка в списке артистов
export interface ArtistSkillListItem {
  id: number;
  name: string;
  skill_group: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  proficiency_level_display: string;
}

// Типы для запросов
export interface RequestListItem {
  id: number;
  text: string;
  author_name: string;
  author_telegram_id?: number;
  author_username?: string;
  sender_telegram_id: number;
  telegram_message_id: number;
  telegram_chat_id: number;
  media_group_id?: string;
  has_images: boolean;
  has_files: boolean;
  has_media: boolean;
  original_created_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  status_display: string;
  agent?: number;
  agent_name?: string;
  processed_at?: string;
  response_text?: string;
  is_forwarded: boolean;
  images_count: number;
  files_count: number;
  images?: RequestImage[];
  files?: RequestFile[];
  // Новые поля для LLM интеграции
  project?: number; // ID связанного проекта
  analysis_status: 'new' | 'analyzed' | 'processed';
  analysis_status_display: string;
  created_at: string;
  updated_at: string;
}

export interface RequestImage {
  id: number;
  request: number;
  image: string;
  thumbnail?: string;
  telegram_file_id?: string;
  file_size?: number;
  caption?: string;
  file_size_mb: number;
  created_at: string;
  updated_at: string;
}

export interface RequestFile {
  id: number;
  request: number;
  file: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  telegram_file_id?: string;
  file_size_mb: number;
  created_at: string;
  updated_at: string;
}

// Типы для событий
export interface ImageErrorEvent {
  currentTarget: {
    style: {
      display: string;
    };
  };
}

// Типы для стилей
export interface DashboardCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
}

export interface UserProfileProps {
  user: User | null;
  onLogout: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

// Типы для агентов
export interface Agent {
  id: number;
  user: User;
  bio: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

// Типы для артистов (полная модель)
export interface Artist {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  stage_name?: string;
  full_name: string;
  short_name: string;
  gender: 'male' | 'female';
  gender_display: string;
  birth_date?: string;
  age?: number;
  media_presence: boolean;
  main_photo?: string;
  bio?: string;
  height?: number;
  weight?: number;
  body_type?: string;
  hair_color?: string;
  hairstyle?: string;
  eye_color?: string;
  clothing_size?: string;
  shoe_size?: string;
  nationality?: string;
  phone?: string;
  backup_phone?: string;
  email?: string;
  telegram_username?: string;
  city?: string;
  availability_status: boolean;
  availability_status_display: string;
  rate_per_day?: string;
  travel_availability: boolean;
  skills: ArtistSkill[];
  education: ArtistEducation[];
  links: ArtistLink[];
  photos: ArtistPhoto[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Типы для компаний
export interface Company {
  id: number;
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Типы для проектов
export interface Project {
  id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  // Новые поля для LLM интеграции
  project_type?: number; // ID типа проекта
  project_type_raw?: string; // Сырой тип из LLM
  genre?: number; // ID жанра
  director?: number; // ID персоны
  casting_director?: number; // ID кастинг-директора
  producers?: number[]; // ID продюсеров
  production_company?: number; // ID компании
  request?: number; // ID исходного запроса
  roles?: ProjectRole[]; // Роли в проекте
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Типы для ролей в проектах
export interface ProjectRole {
  id: number;
  project: number;
  title: string;
  description?: string;
  requirements?: string;
  salary?: number;
  start_date?: string;
  end_date?: string;
  status: 'open' | 'filled' | 'cancelled';
  // Новые поля для LLM интеграции
  suggested_artists: number[]; // ID артистов, предложенных LLM
  skills_required: string[]; // Навыки, извлеченные LLM
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Типы для жанров
export interface Genre {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Типы для заявок из Telegram
export interface TelegramRequest {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Типы для аутентификации
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh: string;
}

// Типы для форм
export interface CreateArtistRequest {
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
  };
  bio: string;
  phone: string;
  backup_phone?: string;
  clothing_size?: string;
  shoe_size?: string;
  height?: number;
  weight?: number;
  hair_color?: string;
  eye_color?: string;
  special_skills?: string;
  experience?: string;
}

// Экспорт новых типов для LLM интеграции
// export * from './llm';
export * from './projects';
export * from './matching';
export * from './media';
export * from './people';
