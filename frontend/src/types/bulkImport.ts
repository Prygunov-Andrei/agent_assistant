/**
 * Типы для массового импорта персон
 */

export interface PersonImportData {
  person_type: string;
  last_name: string;
  first_name: string;
  phones: string[];
  telegrams: string[];
  emails: string[];
  kinopoisk_url?: string;
}

export interface ExistingPersonData {
  full_name: string;
  person_type: string;
  person_type_code: string;
  phones: string[];
  telegrams: string[];
  emails: string[];
  kinopoisk_url?: string;
  photo_url?: string;
}

export interface PotentialDuplicate {
  person_id: number;
  match_score: number;
  match_reasons: string[];
  existing_data: ExistingPersonData;
}

export interface PersonImportRow {
  row_number: number;
  data: PersonImportData;
  validation_errors: string[];
  potential_duplicates: PotentialDuplicate[];
}

export interface ImportError {
  row_number: number;
  errors: string[];
}

export interface ImportSession {
  id: string;
  user: string;
  file: string;
  original_filename: string;
  status: 'uploaded' | 'processing' | 'pending' | 'completed' | 'failed';
  records_data: {
    preview: PersonImportRow[];
    errors: ImportError[];
  };
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ImportDecision {
  row_number: number;
  action: 'create' | 'update' | 'skip';
  person_id?: number;
}

export interface ImportResult {
  status: string;
  statistics: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  details: ImportDetail[];
}

export interface ImportDetail {
  row_number: number;
  action: 'created' | 'updated' | 'skipped' | 'error';
  person_id?: number;
  full_name?: string;
  error?: string;
}

export type ImportStep = 'instruction' | 'upload' | 'preview' | 'resolve' | 'results';

