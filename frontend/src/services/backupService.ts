/**
 * Сервис для работы с API резервного копирования
 */

import apiClient from './api';
import { 
  BackupRecord, 
  BackupStatistics, 
  BackupCreateRequest, 
  BackupDeleteResponse,
  BackupError 
} from '../types/backup';

const BASE_URL = '/core/backups';

export const backupService = {
  /**
   * Получить список всех бэкапов
   */
  async getBackups(): Promise<BackupRecord[]> {
    const response = await apiClient.get(BASE_URL);
    // API возвращает пагинированный результат
    return response.data.results || response.data;
  },

  /**
   * Получить информацию о конкретном бэкапе
   */
  async getBackup(id: string): Promise<BackupRecord> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Создать новый бэкап
   */
  async createBackup(data: BackupCreateRequest = {}): Promise<BackupRecord> {
    const response = await apiClient.post(`${BASE_URL}/create_backup/`, data);
    return response.data;
  },

  /**
   * Получить статистику бэкапов
   */
  async getStatistics(): Promise<BackupStatistics> {
    const response = await apiClient.get(`${BASE_URL}/statistics/`);
    return response.data;
  },

  /**
   * Удалить бэкап
   */
  async deleteBackup(id: string): Promise<BackupDeleteResponse> {
    const response = await apiClient.delete(`${BASE_URL}/${id}/delete_backup/`);
    return response.data;
  },

  /**
   * Получить ссылку на файл в Google Drive
   */
  getGoogleDriveUrl(backup: BackupRecord): string | null {
    return backup.google_drive_url || null;
  },

  /**
   * Проверить, можно ли создать бэкап (проверка прав администратора)
   */
  canCreateBackup(user: any): boolean {
    return user?.is_staff === true;
  },

  /**
   * Проверить, можно ли удалить бэкап (проверка прав администратора)
   */
  canDeleteBackup(user: any): boolean {
    return user?.is_staff === true;
  },

  /**
   * Форматировать размер файла
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Форматировать дату
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  /**
   * Получить цвет статуса для UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'pending':
        return 'orange';
      case 'deleted':
        return 'gray';
      default:
        return 'gray';
    }
  },

  /**
   * Получить иконку статуса для UI
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      case 'deleted':
        return '🗑️';
      default:
        return '❓';
    }
  }
};
