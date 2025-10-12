export interface PersonProject {
  id: number;
  title: string;
  created_at: string;
}

export interface Person {
  id: number;
  person_type: 'director' | 'producer' | 'casting_director';
  person_type_display: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name: string;
  short_name: string;
  photo?: string;
  bio?: string;
  birth_date?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  website?: string;
  telegram_username?: string;
  kinopoisk_url?: string;
  social_media?: Record<string, any>;
  awards?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  projects_count?: number;
  recent_projects?: PersonProject[];
}

export interface PersonMatch extends Person {
  name?: string; // Для совместимости с CompanyMatch
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface PersonSearchRequest {
  email?: string;
  phone?: string;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  person_type?: 'director' | 'producer' | 'casting_director' | '';
  limit?: number;
}

export interface PersonNameSearchRequest {
  name: string;
  person_type?: 'director' | 'producer' | 'casting_director' | '';
  limit?: number;
}

export interface PersonType {
  value: string;
  label: string;
}

export interface PersonSearchParams {
  name?: string;
  email?: string;
  phone?: string;
  telegram?: string; // Альтернатива telegram_username
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  person_type?: string;
  limit?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface PersonNameSearchParams {
  name: string;
  person_type?: string;
  limit?: number;
}

export interface PersonSelectionProps {
  selectedPersons: number[];
  onSelectionChange: (personIds: number[]) => void;
  placeholder?: string;
  maxSelections?: number;
  personType?: 'director' | 'producer' | 'casting_director' | '';
  className?: string;
}

export interface PersonFormData {
  person_type: 'director' | 'producer' | 'casting_director';
  first_name?: string;
  last_name: string;
  middle_name?: string;
  photo?: File | null;
  bio?: string;
  birth_date?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  website?: string;
  telegram_username?: string;
  kinopoisk_url?: string;
  social_media?: Record<string, any>;
  awards?: string;
}

export type PersonModalMode = 'view' | 'create' | 'edit';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
