/**
 * Сервис для работы с массовым импортом персон
 */
import api from './api';
import type { ImportSession, ImportDecision, ImportResult } from '../types/bulkImport';

class BulkImportService {
  /**
   * Загрузка файла для импорта
   */
  uploadFile = async (file: File): Promise<ImportSession> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ImportSession>('/people/bulk-import/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  };
  
  /**
   * Подтверждение и выполнение импорта
   */
  confirmImport = async (
    importId: string, 
    decisions: ImportDecision[]
  ): Promise<ImportResult> => {
    const response = await api.post<ImportResult>('/people/bulk-import/confirm/', {
      import_id: importId,
      decisions,
    });
    
    return response.data;
  };
  
  /**
   * Скачивание шаблона Excel
   */
  downloadTemplate = async (): Promise<Blob> => {
    const response = await api.get('/people/bulk-import/template/', {
      responseType: 'blob',
    });
    
    return response.data;
  };

  /**
   * Скачивание файла шаблона с сохранением на диск
   */
  downloadTemplateToFile = async (): Promise<void> => {
    const blob = await this.downloadTemplate();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'шаблон_импорта_персон.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
}

export default new BulkImportService();

