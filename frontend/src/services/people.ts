import apiClient from './api';
import type { 
  Person, 
  PersonMatch, 
  PersonSearchRequest, 
  PersonNameSearchRequest, 
  PersonType,
  PersonFormData,
  PersonSearchParams,
  PaginatedResponse,
  PersonProject
} from '../types/people';

class PeopleService {
  private baseUrl = '/people/';

  /**
   * Поиск совпадений персон по различным критериям
   */
  async searchPersonMatches(params: PersonSearchRequest): Promise<PersonMatch[]> {
    const response = await apiClient.post(`${this.baseUrl}search_matches/`, params);
    return response.data;
  }

  /**
   * Поиск персон по имени с использованием fuzzy matching
   */
  async searchPersonsByName(params: PersonNameSearchRequest): Promise<PersonMatch[]> {
    const response = await apiClient.post(`${this.baseUrl}search_by_name/`, params);
    return response.data;
  }

  /**
   * Получить список персон по типу
   */
  async getPersonsByType(personType: string): Promise<Person[]> {
    const response = await apiClient.get(`${this.baseUrl}by_type/${personType}/`);
    return response.data;
  }

  /**
   * Получить список доступных типов персон
   */
  async getPersonTypes(): Promise<PersonType[]> {
    const response = await apiClient.get(`${this.baseUrl}person_types/`);
    return response.data;
  }

  /**
   * Получить детальную информацию о персоне
   */
  async getPerson(id: number): Promise<Person> {
    const response = await apiClient.get(`${this.baseUrl}${id}/`);
    return response.data;
  }

  /**
   * Получить список всех персон
   */
  async getPersons(): Promise<Person[]> {
    const response = await apiClient.get(`${this.baseUrl}`);
    return response.data;
  }

  /**
   * Поиск персон по имени (для MatchingSuggestionsPanel)
   */
  async searchPeople(params: { name: string; limit?: number }): Promise<PersonMatch[]> {
    const response = await apiClient.post(`${this.baseUrl}search_by_name/`, {
      name: params.name,
      limit: params.limit || 3
    });
    return response.data;
  }

  /**
   * Получить персону по ID
   */
  async getPersonById(id: number): Promise<Person> {
    const response = await apiClient.get(`${this.baseUrl}${id}/`);
    return response.data;
  }

  /**
   * Получить проекты персоны
   */
  async getPersonProjects(id: number, limit: number = 5): Promise<PersonProject[]> {
    const response = await apiClient.get(`${this.baseUrl}${id}/projects/`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Создать персону
   */
  async createPerson(data: PersonFormData): Promise<Person> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'photo' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'social_media') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await apiClient.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  /**
   * Обновить персону
   */
  async updatePerson(id: number, data: Partial<PersonFormData>): Promise<Person> {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'photo' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'social_media') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await apiClient.patch(`${this.baseUrl}${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  /**
   * Удалить персону
   */
  async deletePerson(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}${id}/`);
  }

  /**
   * Расширенный поиск персон с пагинацией и сортировкой
   */
  async searchWithPagination(params: PersonSearchParams): Promise<PaginatedResponse<Person>> {
    const response = await apiClient.get(`${this.baseUrl}search/`, { params });
    return response.data;
  }

  /**
   * Получить персон по типу с пагинацией
   */
  async getByTypeWithPagination(
    personType: 'director' | 'producer' | 'casting_director',
    params?: { page?: number; page_size?: number; sort?: string }
  ): Promise<PaginatedResponse<Person>> {
    const response = await apiClient.get(`${this.baseUrl}search/`, {
      params: {
        person_type: personType,
        ...params
      }
    });
    return response.data;
  }
}

export const peopleService = new PeopleService();
export default peopleService;
