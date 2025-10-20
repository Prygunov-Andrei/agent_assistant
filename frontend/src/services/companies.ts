import apiClient from './api';
import type { 
  Company, 
  CompanyMatch, 
  CompanySearchRequest, 
  CompanyType, 
  CompanyCreateRequest,
  CompanyUpdateRequest 
} from '../types/companies';

export const companiesService = {
  // Получить список всех компаний
  async getCompanies(): Promise<Company[]> {
    const response = await apiClient.get('/companies/');
    return response.data;
  },

  // Получить компанию по ID
  async getCompany(id: number): Promise<Company> {
    const response = await apiClient.get(`/companies/${id}/`);
    return response.data;
  },

  // Создать новую компанию
  async createCompany(data: CompanyCreateRequest): Promise<Company> {
    const response = await apiClient.post('/companies/', data);
    return response.data;
  },

  // Обновить компанию
  async updateCompany(data: CompanyUpdateRequest): Promise<Company> {
    const { id, ...updateData } = data;
    const response = await apiClient.put(`/companies/${id}/`, updateData);
    return response.data;
  },

  // Удалить компанию
  async deleteCompany(id: number): Promise<void> {
    await apiClient.delete(`/companies/${id}/`);
  },

  // Поиск совпадений компаний
  async searchCompanyMatches(searchData: CompanySearchRequest): Promise<CompanyMatch[]> {
    const response = await apiClient.post('/companies/search-matches/', searchData);
    return response.data;
  },

  // Поиск компаний по названию (с извлечением matches из ответа)
  async searchCompaniesByName(name: string): Promise<CompanyMatch[]> {
    const response = await apiClient.post('/companies/search-by-name/', { name });
    // Backend API возвращает объект { matches: [...], total: N, search_name: "..." }
    // Извлекаем массив matches из ответа
    const result = response.data.matches || response.data;
    return result;
  },

  // Получить компании по типу
  async getCompaniesByType(type: string): Promise<Company[]> {
    const response = await apiClient.get(`/companies/by-type/?type=${type}`);
    return response.data;
  },

  // Получить типы компаний
  async getCompanyTypes(): Promise<CompanyType[]> {
    const response = await apiClient.get('/companies/company-types/');
    return response.data;
  },

  // Получить мои компании (созданные текущим агентом)
  async getMyCompanies(): Promise<Company[]> {
    const response = await apiClient.get('/companies/my-companies/');
    return response.data;
  },

  // Поиск компаний по имени (для MatchingSuggestionsPanel)
  async searchCompanies(params: { name: string; limit?: number }): Promise<CompanyMatch[]> {
    const response = await apiClient.post('/companies/search-by-name/', {
      name: params.name,
      limit: params.limit || 3
    });
    return response.data;
  },
};