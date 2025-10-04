export interface Company {
  id: number;
  name: string;
  company_type: CompanyTypeValue;
  company_type_display: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  founded_year?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMatch {
  id: number;
  name: string;
  company_type: CompanyTypeValue;
  company_type_display: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  founded_year?: number;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matched_fields: string[];
  field_scores: Record<string, number>;
}

export interface CompanySearchRequest {
  name?: string;
  website?: string;
  email?: string;
  company_type?: CompanyTypeValue;
}

export interface CompanyType {
  value: CompanyTypeValue;
  label: string;
}

export type CompanyTypeValue = 
  | 'production'
  | 'distribution'
  | 'post_production'
  | 'other';

export interface CompanyCreateRequest {
  name: string;
  company_type: CompanyTypeValue;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  founded_year?: number;
}

export interface CompanyUpdateRequest extends Partial<CompanyCreateRequest> {
  id: number;
}
