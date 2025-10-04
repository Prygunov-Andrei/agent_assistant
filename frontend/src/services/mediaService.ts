import api from './api';
import type { RequestImage, RequestFile } from '../types';
import { API_BASE_URL } from '../config/api';

// Интерфейс для ответа API медиафайлов
export interface RequestMediaResponse {
  id: number;
  has_images: boolean;
  has_files: boolean;
  images: RequestImage[];
  files: RequestFile[];
  images_count: number;
  files_count: number;
}

class MediaService {
  /**
   * Получить медиафайлы запроса
   */
  async getRequestMedia(requestId: number): Promise<RequestMediaResponse> {
    try {
      const response = await api.get(`/requests/${requestId}/media/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения медиафайлов запроса:', error);
      throw error;
    }
  }

  /**
   * Получить URL изображения с правильным базовым URL
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    // Если URL уже полный, возвращаем как есть
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Иначе добавляем базовый URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  /**
   * Получить URL файла с правильным базовым URL
   */
  getFileUrl(filePath: string): string {
    if (!filePath) return '';
    
    // Если URL уже полный, возвращаем как есть
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // Иначе добавляем базовый URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  /**
   * Скачать файл
   */
  async downloadFile(file: RequestFile): Promise<void> {
    try {
      const fileUrl = this.getFileUrl(file.file);
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.original_filename;
      link.target = '_blank';
      
      // Добавляем ссылку в DOM, кликаем и удаляем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      throw error;
    }
  }

  /**
   * Получить размер файла в читаемом формате
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Б';
    
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Получить иконку для типа файла
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    return '📎';
  }
}

export const mediaService = new MediaService();
