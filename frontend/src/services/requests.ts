import api from './api';
import type { RequestListItem } from '../types';

export interface RequestsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RequestListItem[];
}

class RequestsService {
  /**
   * Получить список запросов
   */
  async getRequests(): Promise<RequestListItem[]> {
    const response = await api.get<RequestsResponse>('/requests/');
    return response.data.results;
  }

  /**
   * Получить запрос по ID
   */
  async getRequest(id: number): Promise<RequestListItem> {
    const response = await api.get<RequestListItem>(`/requests/${id}/`);
    return response.data;
  }

  /**
   * Обновить статус запроса
   */
  async updateRequestStatus(id: number, status: string): Promise<RequestListItem> {
    const response = await api.patch<RequestListItem>(`/requests/${id}/`, { status });
    return response.data;
  }

  /**
   * Добавить ответ на запрос
   */
  async addResponse(id: number, responseText: string): Promise<RequestListItem> {
    const response = await api.patch<RequestListItem>(`/requests/${id}/`, { 
      response_text: responseText,
      status: 'completed'
    });
    return response.data;
  }
}

export const requestsService = new RequestsService();
