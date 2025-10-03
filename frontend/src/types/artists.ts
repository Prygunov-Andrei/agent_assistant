export interface Artist {
  id: number;
  first_name: string;
  last_name: string;
  stage_name?: string;
  full_name: string;
  gender: 'male' | 'female';
  gender_display: string;
  age?: number;
  media_presence: boolean;
  main_photo?: string;
  height?: number;
  weight?: number;
  city?: string;
  availability_status: boolean;
  availability_status_display: string;
  travel_availability: boolean;
  skills: ArtistSkill[];
  skills_count: number;
  education_count: number;
  links_count: number;
  photos_count: number;
}

export interface ArtistSkill {
  id: number;
  name: string;
  skill_group: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  proficiency_level_display: string;
}

export interface ArtistSearchParams {
  search?: string;
  gender?: 'male' | 'female';
  city?: string;
  availability_status?: boolean;
  media_presence?: boolean;
  age_min?: number;
  age_max?: number;
  height_min?: number;
  height_max?: number;
  skill_ids?: string;
  hair_color?: string;
  eye_color?: string;
  body_type?: string;
  limit?: number;
}

export interface ArtistSelectionResponse {
  results: Artist[];
  count: number;
}
