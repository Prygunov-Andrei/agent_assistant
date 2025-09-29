import apiClient from './api';
import type { ApiResponse, Artist, CreateArtistRequest } from '../types';

export const artistsService = {
  // Получить список артистов
  async getArtists(page: number = 1, pageSize: number = 20): Promise<ApiResponse<Artist>> {
    const response = await apiClient.get(`/artists/?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Получить артиста по ID
  async getArtist(id: number): Promise<Artist> {
    const response = await apiClient.get(`/artists/${id}/`);
    return response.data;
  },

  // Создать нового артиста
  async createArtist(artistData: CreateArtistRequest): Promise<Artist> {
    const response = await apiClient.post('/artists/', artistData);
    return response.data;
  },

  // Обновить артиста
  async updateArtist(id: number, artistData: Partial<Artist>): Promise<Artist> {
    const response = await apiClient.patch(`/artists/${id}/`, artistData);
    return response.data;
  },

  // Удалить артиста
  async deleteArtist(id: number): Promise<void> {
    await apiClient.delete(`/artists/${id}/`);
  },

  // Поиск артистов
  async searchArtists(query: string, page: number = 1): Promise<ApiResponse<Artist>> {
    const response = await apiClient.get(`/artists/?search=${encodeURIComponent(query)}&page=${page}`);
    return response.data;
  },

  // Фильтрация артистов
  async filterArtists(filters: {
    hair_color?: string;
    eye_color?: string;
    height_min?: number;
    height_max?: number;
    special_skills?: string;
  }, page: number = 1): Promise<ApiResponse<Artist>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    params.append('page', page.toString());

    const response = await apiClient.get(`/artists/?${params.toString()}`);
    return response.data;
  }
};
