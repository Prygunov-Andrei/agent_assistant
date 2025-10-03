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
}

export interface PersonMatch extends Person {
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
  email?: string;
  phone?: string;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  person_type?: string;
  limit?: number;
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
