// Типы для LLM интеграции

export interface LLMAnalysisResult {
  project_analysis: ProjectAnalysis;
}

export interface ProjectAnalysis {
  project_title: string;
  project_type: string;
  project_type_raw?: string;
  genre: string;
  description: string;
  premiere_date: string;
  roles: ProjectRole[];
  contacts: ProjectContacts;
  confidence: number;
}

export interface ProjectRole {
  role_type: string;
  character_name: string;
  description: string;
  age_range: string;
  gender: string;
  suggested_artists: number[];
  skills_required: SkillsRequired;
  confidence?: number;
}

export interface SkillsRequired {
  acting_skills: string[];
  physical_skills: string[];
  languages: string[];
  special_requirements: string[];
}

export interface ProjectContacts {
  casting_director: ContactPerson | null;
  director: ContactPerson | null;
  producers: ContactPerson[];
  production_company: ContactCompany | null;
}

export interface ContactPerson {
  name: string;
  phone: string;
  email: string;
  telegram: string;
  confidence?: number;
}

export interface ContactCompany {
  name: string;
  phone: string;
  email: string;
  website: string;
  confidence?: number;
}

export interface LLMAnalysisRequest {
  request_id: number;
  use_emulator?: boolean;
}

export interface LLMAnalysisResponse {
  success: boolean;
  data?: LLMAnalysisResult;
  error?: string;
}

export type AnalysisStatus = 'new' | 'analyzing' | 'analyzed' | 'processed' | 'error';

export interface LLMStatus {
  is_available: boolean;
  is_analyzing: boolean;
  model: string;
  use_emulator: boolean;
  last_check: string;
  error_message?: string;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  max_retries: number;
  timeout: number;
  use_emulator: boolean;
  emulator_delay?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface LLMValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Типы для эмулятора
export interface EmulatorConfig {
  enabled: boolean;
  delay: number;
  scenarios: EmulatorScenario[];
}

export interface EmulatorScenario {
  keywords: string[];
  project_type: string;
  genre: string;
  template: string;
}

// Типы для промптов
export interface PromptTemplate {
  system: string;
  user_template: string;
  variables: string[];
}

export interface PromptConfig {
  templates: Record<string, PromptTemplate>;
  default_template: string;
}

// Типы для мониторинга
export interface LLMMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  tokens_used: number;
  cost: number;
}

export interface LLMMonitoringData {
  metrics: LLMMetrics;
  recent_requests: LLMRequest[];
  error_rate: number;
  success_rate: number;
}

export interface LLMRequest {
  id: string;
  timestamp: string;
  status: AnalysisStatus;
  response_time: number;
  tokens_used?: number;
  cost?: number;
  error_message?: string;
}

// Типы для экспорта данных
export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  records_count: number;
  created_at: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  files: string[];
}

export interface DatasetExportRequest {
  records_per_file: number;
  include_metadata: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

export interface DatasetExportResponse {
  success: boolean;
  dataset_id: string;
  files_created: number;
  total_records: number;
  files: string[];
  error?: string;
}

// Типы для API endpoints Дня 3

export interface LLMAnalysisResultDetailed {
  project_analysis: ProjectAnalysis;
  confidence: number;
  processing_time: number;
  used_emulator: boolean;
  errors?: string[];
}

export interface ArtistForLLM {
  id: number;
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  clothing_size: string;
  shoe_size: string;
  hair_color: string;
  eye_color: string;
  skills: string[];
  languages: string[];
  special_requirements: string[];
}

export interface RequestAnalysisStatus {
  request_id: number;
  analysis_status: 'new' | 'analyzed' | 'processed' | 'error';
  created_at: string;
  updated_at: string;
}

export interface LLMError {
  error_type: string;
  error_message: string;
  request_id: number;
  timestamp: string;
  retry_count: number;
  fallback_used: boolean;
}