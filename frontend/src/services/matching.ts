// Сервис для поиска совпадений

import api from './api';
import type { 
  PersonMatchingRequest,
  PersonMatchingResult,
  CompanyMatchingRequest,
  CompanyMatchingResult,
  ProjectMatchingRequest,
  ProjectMatchingResult,
  SearchConfig
} from '../types/matching';

export class MatchingService {
  // Поиск совпадений персон
  static async searchPersons(request: PersonMatchingRequest): Promise<PersonMatchingResult[]> {
    try {
      const response = await api.post<PersonMatchingResult[]>(
        '/api/persons/search-matches/',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске совпадений персон:', error);
      throw error;
    }
  }

  // Поиск совпадений компаний
  static async searchCompanies(request: CompanyMatchingRequest): Promise<CompanyMatchingResult[]> {
    try {
      const response = await api.post<CompanyMatchingResult[]>(
        '/api/companies/search-matches/',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске совпадений компаний:', error);
      throw error;
    }
  }

  // Поиск совпадений проектов
  static async searchProjects(request: ProjectMatchingRequest): Promise<ProjectMatchingResult[]> {
    try {
      const response = await api.post<ProjectMatchingResult[]>(
        '/api/projects/search-matches/',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске совпадений проектов:', error);
      throw error;
    }
  }

  // Получение конфигурации поиска
  static async getSearchConfig(): Promise<SearchConfig> {
    try {
      const response = await api.get<SearchConfig>('/api/search/config/');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении конфигурации поиска:', error);
      throw error;
    }
  }

  // Получение списка персон по типу
  static async getPersonsByType(type: 'director' | 'producer' | 'casting_director'): Promise<any[]> {
    try {
      const response = await api.get(`/api/persons/by-type/?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении персон по типу:', error);
      throw error;
    }
  }
}

// Хук для работы с поиском совпадений
export const useMatching = () => {
  const searchPersons = async (request: PersonMatchingRequest): Promise<PersonMatchingResult[]> => {
    return MatchingService.searchPersons(request);
  };

  const searchCompanies = async (request: CompanyMatchingRequest): Promise<CompanyMatchingResult[]> => {
    return MatchingService.searchCompanies(request);
  };

  const searchProjects = async (request: ProjectMatchingRequest): Promise<ProjectMatchingResult[]> => {
    return MatchingService.searchProjects(request);
  };

  const getSearchConfig = async (): Promise<SearchConfig> => {
    return MatchingService.getSearchConfig();
  };

  const getPersonsByType = async (type: 'director' | 'producer' | 'casting_director'): Promise<any[]> => {
    return MatchingService.getPersonsByType(type);
  };

  return {
    searchPersons,
    searchCompanies,
    searchProjects,
    getSearchConfig,
    getPersonsByType,
  };
};
