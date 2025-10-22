// Типы для проектов с LLM интеграцией

// import type { Artist } from './index';

// Права использования (для рекламы)
export interface UsageRightsParsed {
  raw_text: string;
  types: string[];
  duration?: string | null;
  territory?: string | null;
}

// Расширенный тип проекта с LLM полями
export interface ProjectWithLLM {
  id: number;
  title: string;
  description?: string;
  project_type: number; // ID типа проекта
  project_type_raw?: string; // Сырой тип из LLM
  genre?: number; // ID жанра
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget?: number;
  director?: number; // ID персоны
  production_company?: number; // ID компании
  request?: number; // ID исходного запроса
  usage_rights_parsed?: UsageRightsParsed | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Роль в проекте с LLM полями
export interface ProjectRoleWithLLM {
  id: number;
  project: number;
  title: string;
  description?: string;
  requirements?: string;
  salary?: number;
  start_date?: string;
  end_date?: string;
  status: 'open' | 'filled' | 'cancelled';
  suggested_artists: number[]; // ID артистов, предложенных LLM
  skills_required: string[]; // Навыки, извлеченные LLM
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Форма создания проекта
export interface ProjectCreationForm {
  title: string;
  description?: string;
  project_type: number;
  genre?: number;
  premiere_date?: string; // Дата премьеры
  production_company?: number; // ID компании
  director?: number; // ID директора
  casting_director?: number; // ID кастинг-директора
  producers?: number[]; // ID продюсеров
  request_id?: number; // ID исходного запроса
  roles: ProjectRoleForm[];
}

// Форма роли в проекте
export interface ProjectRoleForm {
  name: string;
  description?: string;
  role_type?: number;
  media_presence?: 'yes' | 'no' | 'doesnt_matter';
  clothing_size?: string;
  hairstyle?: string;
  hair_color?: string;
  eye_color?: string;
  height?: string;
  body_type?: string;
  reference_text?: string;
  special_conditions?: string;
  audition_requirements?: string;
  audition_text?: string;
  rate_per_shift?: string;
  rate_conditions?: string;
  shooting_dates?: string;
  shooting_location?: string;
  notes?: string;
  skills_required?: string[];
  suggested_artists?: number[];
}

// Тип проекта
export interface ProjectType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Жанр
export interface Genre {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Тип роли
export interface RoleType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

// Совпадение проекта при поиске
export interface ProjectMatch {
  id: number;
  title: string;
  project_type?: string;
  status: string;
  status_display: string;
  description?: string;
  genre?: string;
  premiere_date?: string;
  director?: {
    id: number;
    full_name: string;
  };
  production_company?: {
    id: number;
    name: string;
  };
  created_at: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matched_fields: string[];
  field_scores: Record<string, number>;
}

// Запрос поиска совпадений проектов
export interface ProjectSearchRequest {
  title?: string;
  description?: string;
  status?: string;
}

// Статус проекта
export interface ProjectStatus {
  value: string;
  label: string;
}

// Результат поиска проекта (с expanded полями)
export interface ProjectSearchResult {
  id: number;
  title: string;
  description?: string;
  status: string;
  status_display?: string;
  project_type?: {
    id: number;
    name: string;
  };
  genre?: {
    id: number;
    name: string;
  };
  director?: {
    id: number;
    full_name: string;
  };
  production_company?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at?: string;
}

// Проект с expanded полями (для UI отображения)
export interface ProjectExpanded {
  id: number;
  title: string;
  project_type: number | {
    id: number;
    name: string;
  };
  project_type_name?: string;
  genre: number | {
    id: number;
    name: string;
  };
  genre_name?: string;
  description?: string;
  premiere_date?: string;
  status?: string;
  usage_rights_parsed?: UsageRightsParsed | null;
  casting_director?: {
    id: number;
    name: string;
  };
  director?: {
    id: number;
    name: string;
  };
  producer?: {
    id: number;
    name: string;
  };
  production_company?: {
    id: number;
    name: string;
  };
  roles: Array<{
    id: number;
    name: string;
    description?: string;
    role_type?: {
      id: number;
      name: string;
    };
    gender?: string;
    age_min?: number;
    age_max?: number;
    media_presence?: string;
    height?: string;
    body_type?: string;
    hair_color?: string;
    eye_color?: string;
    hairstyle?: string;
    clothing_size?: string;
    shoe_size?: {
      id: number;
      name: string;
    };
    nationality?: {
      id: number;
      name: string;
    };
    rate_per_shift?: string;
    shooting_dates?: string;
    shooting_location?: string;
    rate_conditions?: string;
    skills_required?: Array<{
      id?: number;
      name: string;
    }>;
  }>;
  created_at: string;
  request?: {
    id: number;
    text: string;
  };
}
