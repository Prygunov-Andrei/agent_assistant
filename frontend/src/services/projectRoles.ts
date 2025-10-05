import apiClient from './api';
import type { ProjectRoleForm } from '../types/projects';

export interface ProjectRole {
  id: number;
  project: number;
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
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface RoleType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export const projectRolesService = {
  // Получить все роли
  async getRoles(): Promise<ProjectRole[]> {
    const response = await apiClient.get('/project-roles/');
    return response.data;
  },

  // Получить роль по ID
  async getRole(id: number): Promise<ProjectRole> {
    const response = await apiClient.get(`/project-roles/${id}/`);
    return response.data;
  },

  // Создать роль
  async createRole(roleData: ProjectRoleForm & { project: number }): Promise<ProjectRole> {
    const response = await apiClient.post('/project-roles/', roleData);
    return response.data;
  },

  // Обновить роль
  async updateRole(id: number, roleData: Partial<ProjectRoleForm>): Promise<ProjectRole> {
    const response = await apiClient.put(`/project-roles/${id}/`, roleData);
    return response.data;
  },

  // Частично обновить роль
  async patchRole(id: number, roleData: Partial<ProjectRoleForm>): Promise<ProjectRole> {
    const response = await apiClient.patch(`/project-roles/${id}/`, roleData);
    return response.data;
  },

  // Удалить роль
  async deleteRole(id: number): Promise<void> {
    await apiClient.delete(`/project-roles/${id}/`);
  },

  // Получить роли проекта
  async getProjectRoles(projectId: number): Promise<ProjectRole[]> {
    const response = await apiClient.get(`/project-roles/by-project/?project_id=${projectId}`);
    return response.data;
  },

  // Поиск ролей
  async searchRoles(params: {
    name?: string;
    role_type?: number;
    media_presence?: string;
  }): Promise<ProjectRole[]> {
    const searchParams = new URLSearchParams();
    if (params.name) searchParams.append('name', params.name);
    if (params.role_type) searchParams.append('role_type', params.role_type.toString());
    if (params.media_presence) searchParams.append('media_presence', params.media_presence);
    
    const response = await apiClient.get(`/project-roles/search/?${searchParams.toString()}`);
    return response.data;
  },

  // Получить типы ролей
  async getRoleTypes(): Promise<RoleType[]> {
    const response = await apiClient.get('/role-types/');
    return response.data;
  },
};
