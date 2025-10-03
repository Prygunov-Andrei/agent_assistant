import apiClient from './api';
import type { Artist, ArtistSearchParams } from '../types/artists';

class ArtistsService {
  private baseUrl = '/artists/';

  /**
   * Получить список артистов для выбора в ролях
   */
  async getArtistsForSelection(params: ArtistSearchParams = {}): Promise<Artist[]> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.baseUrl}for-selection/?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Поиск артистов по различным критериям
   */
  async searchArtists(params: ArtistSearchParams = {}): Promise<Artist[]> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.baseUrl}search/?${searchParams.toString()}`);
    return response.data;
  }

  /**
   * Получить артистов по навыкам
   */
  async getArtistsBySkills(skillIds: number[]): Promise<Artist[]> {
    const skillIdsString = skillIds.join(',');
    const response = await apiClient.get(`${this.baseUrl}by-skills/?skill_ids=${skillIdsString}`);
    return response.data;
  }

  /**
   * Получить список всех навыков
   */
  async getSkills() {
    const response = await apiClient.get('/api/skills/');
    return response.data;
  }

  /**
   * Получить список групп навыков
   */
  async getSkillGroups() {
    const response = await apiClient.get('/api/skill-groups/');
    return response.data;
  }

  /**
   * Получить список всех артистов
   */
  async getArtists(): Promise<Artist[]> {
    const response = await apiClient.get(this.baseUrl);
    return response.data.results; // Возвращаем только results из пагинированного ответа
  }

  /**
   * Получить детальную информацию об артисте
   */
  async getArtist(id: number): Promise<Artist> {
    const response = await apiClient.get(`${this.baseUrl}${id}/`);
    return response.data;
  }
}

export const artistsService = new ArtistsService();
export default artistsService;