// Сервис для работы с LLM

import api from './api';
import type { 
  LLMAnalysisResponse, 
  LLMAnalysisResult,
  LLMStatus,
  AnalysisStatus 
} from '../types/llm';

export class LLMService {
  // Анализ запроса через LLM
  static async analyzeRequest(requestId: number): Promise<LLMAnalysisResult> {
    try {
      const response = await api.post<LLMAnalysisResponse>(
        `/api/requests/${requestId}/analyze/`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Ошибка анализа LLM');
      }
      
      return response.data.data!;
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
  static async getLLMConfig(): Promise<any> {
    try {
      const response = await api.get('/api/llm/config/');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении конфигурации LLM:', error);
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
}

// Хук для работы с LLM
export const useLLM = () => {
  const analyzeRequest = async (requestId: number): Promise<LLMAnalysisResult> => {
    return LLMService.analyzeRequest(requestId);
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

  return {
    analyzeRequest,
    getAnalysisStatus,
    getLLMStatus,
    updateRequestStatus,
  };
};
