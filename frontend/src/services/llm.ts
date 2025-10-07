// Сервис для работы с LLM

import api from './api';
import { ErrorHandler } from '../utils/errorHandler';
import type { 
  LLMAnalysisResponse, 
  LLMAnalysisResult,
  LLMStatus,
  AnalysisStatus,
  LLMConfig,
  LLMMonitoringData,
  TrainingDataset,
  DatasetExportRequest,
  DatasetExportResponse
} from '../types/llm';

export class LLMService {
  // Анализ запроса через LLM
  static async analyzeRequest(requestId: number, useEmulator: boolean = true): Promise<LLMAnalysisResult> {
    try {
      const response = await api.post<any>(
        `/requests/${requestId}/analyze/`,
        { use_emulator: useEmulator }
      );
      
      console.log('LLM Response:', response.data);
      
      // Backend возвращает данные напрямую, без обертки { success, data }
      // Проверяем наличие обязательных полей
      if (!response.data || !response.data.project_analysis) {
        console.error('Invalid LLM Response:', response.data);
        throw new Error('Неверный формат ответа LLM');
      }
      
      return response.data as LLMAnalysisResult;
    } catch (error: any) {
      console.error('LLM Service Error Details:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      ErrorHandler.logError(error, 'LLMService.analyzeRequest');
      throw error;
    }
  }

  // Получение статуса анализа запроса
  static async getAnalysisStatus(requestId: number): Promise<AnalysisStatus> {
    try {
      const response = await api.get<{ status: AnalysisStatus }>(
        `/requests/${requestId}/analysis-status/`
      );
      return response.data.status;
    } catch (error) {
      ErrorHandler.logError(error, 'LLMService.getAnalysisStatus');
      throw error;
    }
  }

  // Получение статуса LLM сервиса
  static async getLLMStatus(): Promise<LLMStatus> {
    try {
      const response = await api.get<LLMStatus>('/status/');
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'LLMService.getLLMStatus');
      throw error;
    }
  }

  // Получение конфигурации LLM
  static async getLLMConfig(): Promise<LLMConfig> {
    try {
      const response = await api.get<LLMConfig>('/llm/config/');
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при получении конфигурации LLM:');
      throw error;
    }
  }

  // Обновление конфигурации LLM
  static async updateLLMConfig(config: Partial<LLMConfig>): Promise<LLMConfig> {
    try {
      const response = await api.put<LLMConfig>('/llm/config/', config);
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при обновлении конфигурации LLM:');
      throw error;
    }
  }

  // Обновление статуса запроса
  static async updateRequestStatus(
    requestId: number, 
    status: AnalysisStatus
  ): Promise<void> {
    try {
      await api.patch(`/telegram-requests/${requestId}/`, {
        analysis_status: status
      });
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при обновлении статуса запроса:');
      throw error;
    }
  }

  // Получение мониторинговых данных LLM
  static async getMonitoringData(): Promise<LLMMonitoringData> {
    try {
      const response = await api.get<LLMMonitoringData>('/llm/monitoring/');
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при получении мониторинговых данных:');
      throw error;
    }
  }

  // Экспорт обучающего датасета
  static async exportTrainingDataset(request: DatasetExportRequest): Promise<DatasetExportResponse> {
    try {
      const response = await api.post<DatasetExportResponse>(
        '/llm/export-dataset/',
        request
      );
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при экспорте датасета:');
      throw error;
    }
  }

  // Получение списка датасетов
  static async getTrainingDatasets(): Promise<TrainingDataset[]> {
    try {
      const response = await api.get<TrainingDataset[]>('/llm/datasets/');
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при получении списка датасетов:');
      throw error;
    }
  }

  // Получение информации о датасете
  static async getTrainingDataset(datasetId: string): Promise<TrainingDataset> {
    try {
      const response = await api.get<TrainingDataset>(`/llm/datasets/${datasetId}/`);
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при получении информации о датасете:');
      throw error;
    }
  }

  // Удаление датасета
  static async deleteTrainingDataset(datasetId: string): Promise<void> {
    try {
      await api.delete(`/llm/datasets/${datasetId}/`);
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при удалении датасета:');
      throw error;
    }
  }

  // Тестирование промпта
  static async testPrompt(prompt: string, testData: any): Promise<LLMAnalysisResult> {
    try {
      const response = await api.post<LLMAnalysisResponse>(
        '/llm/test-prompt/',
        { prompt, test_data: testData }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Ошибка тестирования промпта');
      }
      
      if (!response.data.data) {
        throw new Error('Пустой ответ от LLM');
      }
      
      return response.data.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при тестировании промпта:');
      throw error;
    }
  }

  // Валидация ответа LLM
  static async validateResponse(response: LLMAnalysisResult): Promise<boolean> {
    try {
      const result = await api.post<{ is_valid: boolean; errors: any[] }>(
        '/llm/validate-response/',
        response
      );
      return result.data.is_valid;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при валидации ответа:');
      return false;
    }
  }

  // Получение истории запросов к LLM
  static async getRequestHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/llm/request-history/?limit=${limit}`);
      return response.data;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при получении истории запросов:');
      throw error;
    }
  }

  // Очистка кэша LLM
  static async clearCache(): Promise<void> {
    try {
      await api.post('/llm/clear-cache/');
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при очистке кэша:');
      throw error;
    }
  }

  // Перезапуск LLM сервиса
  static async restartService(): Promise<void> {
    try {
      await api.post('/llm/restart/');
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при перезапуске сервиса:');
      throw error;
    }
  }

}

// Хук для работы с LLM
export const useLLM = () => {
  const analyzeRequest = async (requestId: number, useEmulator: boolean = true): Promise<LLMAnalysisResult> => {
    return LLMService.analyzeRequest(requestId, useEmulator);
  };

  const getAnalysisStatus = async (requestId: number): Promise<AnalysisStatus> => {
    return LLMService.getAnalysisStatus(requestId);
  };

  const getLLMStatus = async (): Promise<LLMStatus> => {
    return LLMService.getLLMStatus();
  };

  const updateRequestStatus = async (
    requestId: number, 
    status: AnalysisStatus
  ): Promise<void> => {
    return LLMService.updateRequestStatus(requestId, status);
  };

  const getLLMConfig = async (): Promise<LLMConfig> => {
    return LLMService.getLLMConfig();
  };

  const updateLLMConfig = async (config: Partial<LLMConfig>): Promise<LLMConfig> => {
    return LLMService.updateLLMConfig(config);
  };

  const getMonitoringData = async (): Promise<LLMMonitoringData> => {
    return LLMService.getMonitoringData();
  };

  const exportTrainingDataset = async (request: DatasetExportRequest): Promise<DatasetExportResponse> => {
    return LLMService.exportTrainingDataset(request);
  };

  const getTrainingDatasets = async (): Promise<TrainingDataset[]> => {
    return LLMService.getTrainingDatasets();
  };

  const testPrompt = async (prompt: string, testData: any): Promise<LLMAnalysisResult> => {
    return LLMService.testPrompt(prompt, testData);
  };

  const validateResponse = async (response: LLMAnalysisResult): Promise<boolean> => {
    return LLMService.validateResponse(response);
  };

  return {
    analyzeRequest,
    getAnalysisStatus,
    getLLMStatus,
    updateRequestStatus,
    getLLMConfig,
    updateLLMConfig,
    getMonitoringData,
    exportTrainingDataset,
    getTrainingDatasets,
    testPrompt,
    validateResponse,
  };
};

// Утилиты для работы с LLM
export const LLMUtils = {
  // Форматирование confidence в процент
  formatConfidence: (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  },

  // Получение цвета для confidence
  getConfidenceColor: (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  },

  // Получение текста статуса анализа
  getAnalysisStatusText: (status: AnalysisStatus): string => {
    const statusTexts = {
      'new': 'Новый',
      'analyzing': 'Анализируется',
      'analyzed': 'Проанализирован',
      'processed': 'Обработан',
      'error': 'Ошибка'
    };
    return statusTexts[status] || 'Неизвестно';
  },

  // Получение цвета статуса анализа
  getAnalysisStatusColor: (status: AnalysisStatus): string => {
    const statusColors = {
      'new': 'bg-gray-100 text-gray-800',
      'analyzing': 'bg-blue-100 text-blue-800',
      'analyzed': 'bg-green-100 text-green-800',
      'processed': 'bg-purple-100 text-purple-800',
      'error': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  },

  // Проверка валидности ответа LLM
  isValidResponse: (response: LLMAnalysisResult): boolean => {
    try {
      const { project_analysis } = response;
      
      if (!project_analysis) return false;
      
      // Проверяем обязательные поля
      const requiredFields = ['project_title', 'project_type', 'genre', 'description', 'roles'];
      for (const field of requiredFields) {
        if (!project_analysis[field as keyof typeof project_analysis]) {
          return false;
        }
      }
      
      // Проверяем роли
      if (!Array.isArray(project_analysis.roles) || project_analysis.roles.length === 0) {
        return false;
      }
      
      // Проверяем каждую роль
      for (const role of project_analysis.roles) {
        const requiredRoleFields = ['character_name', 'description', 'age_range', 'gender'];
        for (const field of requiredRoleFields) {
          if (!role[field as keyof typeof role]) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      ErrorHandler.logError(error, 'Ошибка при валидации ответа LLM:');
      return false;
    }
  },

  // Извлечение ошибок из ответа LLM
  extractErrors: (response: LLMAnalysisResult): string[] => {
    const errors: string[] = [];
    
    try {
      const { project_analysis } = response;
      
      if (!project_analysis) {
        errors.push('Отсутствует секция project_analysis');
        return errors;
      }
      
      // Проверяем обязательные поля
      if (!project_analysis.project_title) {
        errors.push('Отсутствует название проекта');
      }
      
      if (!project_analysis.project_type) {
        errors.push('Отсутствует тип проекта');
      }
      
      if (!project_analysis.genre) {
        errors.push('Отсутствует жанр');
      }
      
      if (!project_analysis.description) {
        errors.push('Отсутствует описание');
      }
      
      if (!project_analysis.roles || project_analysis.roles.length === 0) {
        errors.push('Отсутствуют роли');
      } else {
        // Проверяем каждую роль
        project_analysis.roles.forEach((role, index) => {
          if (!role.character_name) {
            errors.push(`Роль ${index + 1}: отсутствует имя персонажа`);
          }
          
          if (!role.description) {
            errors.push(`Роль ${index + 1}: отсутствует описание`);
          }
          
          if (!role.age_range) {
            errors.push(`Роль ${index + 1}: отсутствует возрастной диапазон`);
          }
          
          if (!role.gender) {
            errors.push(`Роль ${index + 1}: отсутствует пол`);
          }
        });
      }
      
    } catch (error) {
      errors.push(`Ошибка при анализе ответа: ${error}`);
    }
    
    return errors;
  },
};