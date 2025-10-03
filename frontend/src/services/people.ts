import apiClient from './api';
import type { 
  Person, 
  PersonMatch, 
  PersonSearchRequest, 
  PersonNameSearchRequest, 
  PersonType 
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
}

export const peopleService = new PeopleService();
export default peopleService;
