import apiClient from './api';
import type { ApiResponse, Company } from '../types';

export const companiesService = {
  // Получить список компаний
  async getCompanies(page: number = 1, pageSize: number = 20): Promise<ApiResponse<Company>> {
    const response = await apiClient.get(`/companies/?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Получить компанию по ID
  async getCompany(id: number): Promise<Company> {
    const response = await apiClient.get(`/companies/${id}/`);
    return response.data;
  },

  // Создать новую компанию
  async createCompany(companyData: Partial<Company>): Promise<Company> {
    const response = await apiClient.post('/companies/', companyData);
    return response.data;
  },

  // Обновить компанию
  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company> {
    const response = await apiClient.patch(`/companies/${id}/`, companyData);
    return response.data;
  },

  // Удалить компанию
  async deleteCompany(id: number): Promise<void> {
    await apiClient.delete(`/companies/${id}/`);
  },

  // Поиск компаний
  async searchCompanies(query: string, page: number = 1): Promise<ApiResponse<Company>> {
    const response = await apiClient.get(`/companies/?search=${encodeURIComponent(query)}&page=${page}`);
    return response.data;
  }
};
