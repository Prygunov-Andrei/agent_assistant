import apiClient from './api';
import type { ApiResponse, Project, ProjectRole, Genre } from '../types';
import type { ProjectType, ProjectMatch, ProjectSearchRequest, ProjectStatus } from '../types/projects';

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
  async createProjectRole(roleData: Partial<ProjectRole>): Promise<ProjectRole> {
    const response = await apiClient.post('/project-roles/', roleData);
    return response.data;
  },

  // Получить список типов проектов
  async getProjectTypes(): Promise<ProjectType[]> {
    const response = await apiClient.get('/project-types/');
    return response.data.results || response.data;
  },

  // Получить список жанров
  async getGenres(): Promise<Genre[]> {
    const response = await apiClient.get('/genres/');
    return response.data.results || response.data;
  },

  // Поиск проектов
  async searchProjects(query: string, page: number = 1): Promise<ApiResponse<Project>> {
    const response = await apiClient.get(`/projects/?search=${encodeURIComponent(query)}&page=${page}`);
    return response.data;
  },

  // Поиск совпадений проектов
  async searchProjectMatches(searchData: ProjectSearchRequest): Promise<ProjectMatch[]> {
    const response = await apiClient.post('/api/projects/search-matches/', searchData);
    return response.data;
  },

  // Поиск проектов по названию
  async searchProjectsByTitle(title: string): Promise<ProjectMatch[]> {
    const response = await apiClient.post('/api/projects/search-by-title/', { title });
    return response.data;
  },

  // Получить проекты по статусу
  async getProjectsByStatus(status: string): Promise<Project[]> {
    const response = await apiClient.get(`/api/projects/by-status/?status=${status}`);
    return response.data;
  },

  // Получить статусы проектов
  async getProjectStatuses(): Promise<ProjectStatus[]> {
    const response = await apiClient.get('/api/projects/project-statuses/');
    return response.data;
  },

  // Анализ запроса для создания проекта
  async analyzeRequest(requestId: number): Promise<any> {
    const response = await apiClient.post(`/requests/${requestId}/analyze/`, { use_emulator: true });
    return response.data;
  }
};
