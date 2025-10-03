// Типы для проектов с LLM интеграцией

// import type { Artist } from './index';

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
  skills_required: string[];
  suggested_artists: number[];
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
