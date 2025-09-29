import apiClient from './api';
import type { ApiResponse, Project, ProjectRole, Genre } from '../types';

export const projectsService = {
  // Получить список проектов
  async getProjects(page: number = 1, pageSize: number = 20): Promise<ApiResponse<Project>> {
    const response = await apiClient.get(`/projects/?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Получить проект по ID
  async getProject(id: number): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}/`);
    return response.data;
  },

  // Создать новый проект
  async createProject(projectData: Partial<Project>): Promise<Project> {
    const response = await apiClient.post('/projects/', projectData);
    return response.data;
  },

  // Обновить проект
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
    const response = await apiClient.patch(`/projects/${id}/`, projectData);
    return response.data;
  },

  // Удалить проект
  async deleteProject(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}/`);
  },

  // Получить роли проекта
  async getProjectRoles(projectId: number): Promise<ApiResponse<ProjectRole>> {
    const response = await apiClient.get(`/projects/${projectId}/roles/`);
    return response.data;
  },

  // Создать роль в проекте
  async createProjectRole(projectId: number, roleData: Partial<ProjectRole>): Promise<ProjectRole> {
    const response = await apiClient.post(`/projects/${projectId}/roles/`, roleData);
    return response.data;
  },

  // Получить список жанров
  async getGenres(): Promise<Genre[]> {
    const response = await apiClient.get('/projects/genres/');
    return response.data;
  },

  // Поиск проектов
  async searchProjects(query: string, page: number = 1): Promise<ApiResponse<Project>> {
    const response = await apiClient.get(`/projects/?search=${encodeURIComponent(query)}&page=${page}`);
    return response.data;
  }
};
