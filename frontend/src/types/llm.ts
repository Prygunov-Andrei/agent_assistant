// Типы для LLM интеграции

// Статусы анализа запроса
export type AnalysisStatus = 'new' | 'analyzed' | 'processed';

// Результат анализа LLM
export interface LLMAnalysisResult {
  project_type: string;
  project_type_raw?: string;
  genre?: string;
  description: string;
  roles: LLMRole[];
  suggested_persons: LLMPerson[];
  suggested_companies: LLMCompany[];
  suggested_projects: LLMProject[];
}

// Роль в проекте из анализа LLM
export interface LLMRole {
  title: string;
  description: string;
  gender?: 'male' | 'female' | 'any';
  age_range?: {
    min: number;
    max: number;
  };
  skills_required: string[];
  suggested_artists: number[]; // ID артистов
}

// Персона из анализа LLM
export interface LLMPerson {
  name: string;
  type: 'director' | 'producer' | 'casting_director';
  email?: string;
  phone?: string;
  telegram_username?: string;
  company?: string;
  confidence: number; // 0-1, уверенность в совпадении
}

// Компания из анализа LLM
export interface LLMCompany {
  name: string;
  type: 'production' | 'distribution' | 'other';
  website?: string;
  email?: string;
  phone?: string;
  confidence: number; // 0-1, уверенность в совпадении
}

// Проект из анализа LLM
export interface LLMProject {
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  confidence: number; // 0-1, уверенность в совпадении
}

// Запрос на анализ
export interface LLMAnalysisRequest {
  request_id: number;
  text: string;
  images?: string[];
  files?: string[];
}

// Ответ на анализ
export interface LLMAnalysisResponse {
  success: boolean;
  data?: LLMAnalysisResult;
  error?: string;
  retry_count?: number;
}

// Конфигурация LLM
export interface LLMConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  retry_attempts: number;
  timeout: number;
}

// Статус LLM сервиса
export interface LLMStatus {
  is_available: boolean;
  is_analyzing: boolean;
  last_analysis?: string;
  error_count: number;
  success_count: number;
}
