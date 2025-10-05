import { mediaService } from '../services/mediaService';
import type { RequestFile } from '../types';

// Мокаем apiClient
jest.mock('../services/api');

// Мокаем глобальные объекты
let mockCreateElement: jest.SpyInstance;
let mockAppendChild: jest.SpyInstance;
let mockRemoveChild: jest.SpyInstance;

// Получаем мок из импортированного модуля
import api from '../services/api';
let mockApiGet: jest.SpyInstance;

describe('mediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Настраиваем моки для api
    mockApiGet = jest.spyOn(api, 'get');
    
    // Настраиваем моки для document методов
    mockCreateElement = jest.spyOn(document, 'createElement');
    mockAppendChild = jest.spyOn(document.body, 'appendChild');
    mockRemoveChild = jest.spyOn(document.body, 'removeChild');
  });

  afterEach(() => {
    // Восстанавливаем оригинальные методы
    mockApiGet.mockRestore();
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  describe('getRequestMedia', () => {
    it('успешно получает медиафайлы запроса', async () => {
      const mockRequestId = 123;
      const mockResponse = {
        data: {
          id: mockRequestId,
          has_images: true,
          has_files: true,
          images: [
            {
              id: 1,
              request: 123,
              image: '/media/test1.jpg',
              caption: 'Test image',
              file_size: 1024,
              file_size_mb: 0.001,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
          ],
          files: [
            {
              id: 1,
              request: 123,
              file: '/media/test1.txt',
              original_filename: 'test1.txt',
              file_size: 512,
              mime_type: 'text/plain',
              file_size_mb: 0.0005,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
            },
          ],
          images_count: 1,
          files_count: 1,
          total_size: 1536,
        },
      };

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await mediaService.getRequestMedia(mockRequestId);

      expect(mockApiGet).toHaveBeenCalledWith(
        `/requests/${mockRequestId}/media/`
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('обрабатывает ошибки при получении медиафайлов', async () => {
      const mockRequestId = 123;
      const mockError = new Error('Network error');

      mockApiGet.mockRejectedValue(mockError);

      await expect(mediaService.getRequestMedia(mockRequestId)).rejects.toThrow('Network error');
      expect(mockApiGet).toHaveBeenCalledWith(
        `/requests/${mockRequestId}/media/`
      );
    });
  });

  describe('getImageUrl', () => {
    it('возвращает полный URL для относительного пути', () => {
      const imagePath = '/media/test.jpg';
      const result = mediaService.getImageUrl(imagePath);

      expect(result).toBe('http://localhost:8000/media/test.jpg');
    });

    it('возвращает URL как есть для полного URL', () => {
      const imagePath = 'https://example.com/image.jpg';
      const result = mediaService.getImageUrl(imagePath);

      expect(result).toBe('https://example.com/image.jpg');
    });

    it('обрабатывает пустой путь', () => {
      const result = mediaService.getImageUrl('');

      expect(result).toBe('');
    });

    it('обрабатывает undefined', () => {
      const result = mediaService.getImageUrl(undefined as any);

      expect(result).toBe('');
    });
  });

  describe('getFileUrl', () => {
    it('возвращает полный URL для относительного пути', () => {
      const filePath = '/media/test.txt';
      const result = mediaService.getFileUrl(filePath);

      expect(result).toBe('http://localhost:8000/media/test.txt');
    });

    it('возвращает URL как есть для полного URL', () => {
      const filePath = 'https://example.com/file.txt';
      const result = mediaService.getFileUrl(filePath);

      expect(result).toBe('https://example.com/file.txt');
    });

    it('обрабатывает пустой путь', () => {
      const result = mediaService.getFileUrl('');

      expect(result).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('форматирует размер файла в байтах', () => {
      expect(mediaService.formatFileSize(0)).toBe('0 Б');
      expect(mediaService.formatFileSize(1024)).toBe('1 КБ');
      expect(mediaService.formatFileSize(1024 * 1024)).toBe('1 МБ');
      expect(mediaService.formatFileSize(1024 * 1024 * 1024)).toBe('1 ГБ');
    });

    it('правильно округляет размеры', () => {
      expect(mediaService.formatFileSize(1536)).toBe('1.5 КБ');
      expect(mediaService.formatFileSize(1536 * 1024)).toBe('1.5 МБ');
    });
  });

  describe('getFileIcon', () => {
    it('возвращает правильные иконки для разных типов файлов', () => {
      expect(mediaService.getFileIcon('image/jpeg')).toBe('🖼️');
      expect(mediaService.getFileIcon('application/pdf')).toBe('📄');
      expect(mediaService.getFileIcon('application/msword')).toBe('📝');
      expect(mediaService.getFileIcon('application/vnd.ms-excel')).toBe('📊');
      expect(mediaService.getFileIcon('application/vnd.ms-powerpoint')).toBe('📽️');
      expect(mediaService.getFileIcon('application/zip')).toBe('📦');
      expect(mediaService.getFileIcon('video/mp4')).toBe('🎥');
      expect(mediaService.getFileIcon('audio/mp3')).toBe('🎵');
      expect(mediaService.getFileIcon('application/octet-stream')).toBe('📎');
    });
  });

  describe('downloadFile', () => {
    it('создает ссылку для скачивания файла', async () => {
      const mockFile: RequestFile = {
        id: 1,
        request: 123,
        file: '/media/test.txt',
        original_filename: 'test.txt',
        file_size: 512,
        mime_type: 'text/plain',
        file_size_mb: 0.0005,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();

      mockCreateElement.mockReturnValue(mockLink);

      await mediaService.downloadFile(mockFile);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('http://localhost:8000/media/test.txt');
      expect(mockLink.download).toBe('test.txt');
      expect(mockLink.target).toBe('_blank');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    it('обрабатывает ошибки при скачивании файла', async () => {
      const mockFile: RequestFile = {
        id: 1,
        request: 123,
        file: '/media/test.txt',
        original_filename: 'test.txt',
        file_size: 512,
        mime_type: 'text/plain',
        file_size_mb: 0.0005,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockLink = document.createElement('a');
      mockLink.click = jest.fn().mockImplementation(() => {
        throw new Error('Download error');
      });

      mockCreateElement.mockReturnValue(mockLink);

      await expect(mediaService.downloadFile(mockFile)).rejects.toThrow('Download error');
    });
  });
});
