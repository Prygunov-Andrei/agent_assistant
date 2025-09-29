import apiClient from './api';
import type { Artist, ArtistListItem } from '../types';

export const artistsService = {
  // Получение списка артистов текущего агента
  async getArtists(): Promise<ArtistListItem[]> {
    const response = await apiClient.get('/artists/');
    return response.data.results || response.data;
  },

  // Получение детальной информации об артисте
  async getArtist(id: number): Promise<Artist> {
    const response = await apiClient.get(`/artists/${id}/`);
    return response.data;
  },

  // Создание нового артиста
  async createArtist(artistData: Partial<Artist>): Promise<Artist> {
    const response = await apiClient.post('/artists/', artistData);
    return response.data;
  },

  // Обновление артиста
  async updateArtist(id: number, artistData: Partial<Artist>): Promise<Artist> {
    const response = await apiClient.put(`/artists/${id}/`, artistData);
    return response.data;
  },

  // Частичное обновление артиста
  async patchArtist(id: number, artistData: Partial<Artist>): Promise<Artist> {
    const response = await apiClient.patch(`/artists/${id}/`, artistData);
    return response.data;
  },

  // Удаление артиста
  async deleteArtist(id: number): Promise<void> {
    await apiClient.delete(`/artists/${id}/`);
  },

  // Получение навыков артиста
  async getArtistSkills(artistId: number) {
    const response = await apiClient.get(`/artists/${artistId}/skills/`);
    return response.data;
  },

  // Добавление навыка артисту
  async addArtistSkill(artistId: number, skillData: any) {
    const response = await apiClient.post(`/artists/${artistId}/skills/`, skillData);
    return response.data;
  },

  // Удаление навыка у артиста
  async removeArtistSkill(artistId: number, skillId: number) {
    await apiClient.delete(`/artists/${artistId}/skills/${skillId}/`);
  },
};