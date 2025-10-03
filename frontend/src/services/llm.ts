// Сервис для работы с LLM

import api from './api';
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
      const response = await api.post<LLMAnalysisResponse>(
        `/api/requests/${requestId}/analyze/`,
        { use_emulator: useEmulator }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Ошибка анализа LLM');
      }
      
      if (!response.data.data) {
        throw new Error('Пустой ответ от LLM');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при анализе запроса:', error);
      throw error;
    }
  }

  // Получение статуса анализа запроса
  static async getAnalysisStatus(requestId: number): Promise<AnalysisStatus> {
    try {
      const response = await api.get<{ status: AnalysisStatus }>(
        `/api/requests/${requestId}/analysis-status/`
      );
      return response.data.status;
    } catch (error) {
      console.error('Ошибка при получении статуса анализа:', error);
      throw error;
    }
  }

  // Получение статуса LLM сервиса
  static async getLLMStatus(): Promise<LLMStatus> {
    try {
      const response = await api.get<LLMStatus>('/api/llm/status/');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении статуса LLM:', error);
      throw error;
    }
  }

  // Получение конфигурации LLM
  static async getLLMConfig(): Promise<LLMConfig> {
    try {
      const response = await api.get<LLMConfig>('/api/llm/config/');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении конфигурации LLM:', error);
      throw error;
    }
  }

  // Обновление конфигурации LLM
  static async updateLLMConfig(config: Partial<LLMConfig>): Promise<LLMConfig> {
    try {
      const response = await api.put<LLMConfig>('/api/llm/config/', config);
      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении конфигурации LLM:', error);
      throw error;
    }
  }

  // Обновление статуса запроса
  static async updateRequestStatus(
    requestId: number, 
    status: AnalysisStatus
  ): Promise<void> {
    try {
      await api.patch(`/api/requests/${requestId}/`, {
        analysis_status: status
      });
    } catch (error) {
      console.error('Ошибка при обновлении статуса запроса:', error);
      throw error;
    }
  }

  // Получение мониторинговых данных LLM
  static async getMonitoringData(): Promise<LLMMonitoringData> {
    try {
      const response = await api.get<LLMMonitoringData>('/api/llm/monitoring/');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении мониторинговых данных:', error);
      throw error;
    }
  }

  // Экспорт обучающего датасета
  static async exportTrainingDataset(request: DatasetExportRequest): Promise<DatasetExportResponse> {
    try {
      const response = await api.post<DatasetExportResponse>(
        '/api/llm/export-dataset/',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка при экспорте датасета:', error);
      throw error;
    }
  }

  // Получение списка датасетов
  static async getTrainingDatasets(): Promise<TrainingDataset[]> {
    try {
      const response = await api.get<TrainingDataset[]>('/api/llm/datasets/');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении списка датасетов:', error);
      throw error;
    }
  }

  // Получение информации о датасете
  static async getTrainingDataset(datasetId: string): Promise<TrainingDataset> {
    try {
      const response = await api.get<TrainingDataset>(`/api/llm/datasets/${datasetId}/`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении информации о датасете:', error);
      throw error;
    }
  }

  // Удаление датасета
  static async deleteTrainingDataset(datasetId: string): Promise<void> {
    try {
      await api.delete(`/api/llm/datasets/${datasetId}/`);
    } catch (error) {
      console.error('Ошибка при удалении датасета:', error);
      throw error;
    }
  }

  // Тестирование промпта
  static async testPrompt(prompt: string, testData: any): Promise<LLMAnalysisResult> {
    try {
      const response = await api.post<LLMAnalysisResponse>(
        '/api/llm/test-prompt/',
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
      console.error('Ошибка при тестировании промпта:', error);
      throw error;
    }
  }

  // Валидация ответа LLM
  static async validateResponse(response: LLMAnalysisResult): Promise<boolean> {
    try {
      const result = await api.post<{ is_valid: boolean; errors: any[] }>(
        '/api/llm/validate-response/',
        response
      );
      return result.data.is_valid;
    } catch (error) {
      console.error('Ошибка при валидации ответа:', error);
      return false;
    }
  }

  // Получение истории запросов к LLM
  static async getRequestHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/api/llm/request-history/?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении истории запросов:', error);
      throw error;
    }
  }

  // Очистка кэша LLM
  static async clearCache(): Promise<void> {
    try {
      await api.post('/api/llm/clear-cache/');
    } catch (error) {
      console.error('Ошибка при очистке кэша:', error);
      throw error;
    }
  }

  // Перезапуск LLM сервиса
  static async restartService(): Promise<void> {
    try {
      await api.post('/api/llm/restart/');
    } catch (error) {
      console.error('Ошибка при перезапуске сервиса:', error);
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
      console.error('Ошибка при валидации ответа LLM:', error);
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