// Типы для системы поиска совпадений

// Результат поиска совпадений
export interface MatchingResult<T> {
  item: T;
  confidence: number; // 0-1, уверенность в совпадении
  match_type: 'exact' | 'high' | 'medium' | 'low';
  matched_fields: string[];
}

// Поиск совпадений персон
export interface PersonMatchingRequest {
  name?: string;
  email?: string;
  phone?: string;
  telegram_username?: string;
  person_type?: 'director' | 'producer' | 'casting_director';
}

export interface PersonMatchingResult {
  id: number;
  name: string;
  type: 'director' | 'producer' | 'casting_director';
  email?: string;
  phone?: string;
  telegram_username?: string;
  company?: string;
  confidence: number;
  match_type: 'exact' | 'high' | 'medium' | 'low';
  matched_fields: string[];
}

// Поиск совпадений компаний
export interface CompanyMatchingRequest {
  name?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface CompanyMatchingResult {
  id: number;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  confidence: number;
  match_type: 'exact' | 'high' | 'medium' | 'low';
  matched_fields: string[];
}

// Поиск совпадений проектов
export interface ProjectMatchingRequest {
  title?: string;
  description?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export interface ProjectMatchingResult {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  confidence: number;
  match_type: 'exact' | 'high' | 'medium' | 'low';
  matched_fields: string[];
}

// Конфигурация поиска
export interface SearchConfig {
  thresholds: {
    exact: number; // 0.95
    high: number;  // 0.8
    medium: number; // 0.6
    low: number;   // 0.4
  };
  limits: {
    persons: number;
    companies: number;
    projects: number;
  };
}

// Цветовая индикация совпадений
export type MatchColor = 'green' | 'yellow' | 'orange' | 'red';

export interface MatchIndicator {
  color: MatchColor;
  text: string;
  description: string;
}
