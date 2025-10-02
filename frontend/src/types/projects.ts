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
  title: string;
  description?: string;
  requirements?: string;
  salary?: number;
  start_date?: string;
  end_date?: string;
  gender?: 'male' | 'female' | 'any';
  age_range?: {
    min: number;
    max: number;
  };
  skills_required: string[];
  selected_artists: number[];
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
