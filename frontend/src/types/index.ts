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

// Типы для артистов
export interface Artist {
  id: number;
  user: User;
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
