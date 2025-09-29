import apiClient from './api';
import type { ApiResponse, TelegramRequest } from '../types';

export const telegramService = {
  // Получить список заявок из Telegram
  async getRequests(page: number = 1, pageSize: number = 20): Promise<ApiResponse<TelegramRequest>> {
    const response = await apiClient.get(`/telegram-requests/?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Получить заявку по ID
  async getRequest(id: number): Promise<TelegramRequest> {
    const response = await apiClient.get(`/telegram-requests/${id}/`);
    return response.data;
  },

  // Обновить статус заявки
  async updateRequestStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<TelegramRequest> {
    const response = await apiClient.patch(`/telegram-requests/${id}/`, { status });
    return response.data;
  },

  // Удалить заявку
  async deleteRequest(id: number): Promise<void> {
    await apiClient.delete(`/telegram-requests/${id}/`);
  },

  // Фильтрация заявок по статусу
  async getRequestsByStatus(status: 'pending' | 'approved' | 'rejected', page: number = 1): Promise<ApiResponse<TelegramRequest>> {
    const response = await apiClient.get(`/telegram-requests/?status=${status}&page=${page}`);
    return response.data;
  }
};
