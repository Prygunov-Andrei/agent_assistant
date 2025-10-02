import React, { useState, useEffect } from 'react';
import { LLMService } from '../../services/llm';
import type { LLMStatus, AnalysisStatus } from '../../types/llm';

interface LLMStatusIndicatorProps {
  requestId?: number;
  className?: string;
  showDetails?: boolean;
}

const LLMStatusIndicator: React.FC<LLMStatusIndicatorProps> = ({
  requestId,
  className = '',
  showDetails = false
}) => {
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [requestStatus, setRequestStatus] = useState<AnalysisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Получаем общий статус LLM
        const llmStatusData = await LLMService.getLLMStatus();
        setLlmStatus(llmStatusData);

        // Если указан requestId, получаем статус конкретного запроса
        if (requestId) {
          const requestStatusData = await LLMService.getRequestAnalysisStatus(requestId);
          setRequestStatus(requestStatusData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки статуса');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Обновляем статус каждые 5 секунд
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [requestId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'text-gray-500';
      case 'processing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return '⏸️';
      case 'processing':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle':
        return 'Ожидание';
      case 'processing':
        return 'Обработка';
      case 'completed':
        return 'Завершено';
      case 'error':
        return 'Ошибка';
      default:
        return 'Неизвестно';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600">Загрузка статуса...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-red-500">❌</span>
        <span className="text-sm text-red-600">Ошибка: {error}</span>
      </div>
    );
  }

  const currentStatus = requestStatus?.analysis_status || llmStatus?.status || 'idle';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`text-lg ${getStatusColor(currentStatus)}`}>
        {getStatusIcon(currentStatus)}
      </span>
      
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor(currentStatus)}`}>
          {getStatusText(currentStatus)}
        </span>
        
        {showDetails && llmStatus && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Модель: {llmStatus.current_model}</div>
            <div>Эмулятор: {llmStatus.emulator_enabled ? 'Включен' : 'Выключен'}</div>
            <div>Запросов: {llmStatus.total_requests}</div>
            <div>Успешных: {llmStatus.successful_requests}</div>
            <div>Ошибок: {llmStatus.failed_requests}</div>
          </div>
        )}
        
        {requestStatus && (
          <div className="text-xs text-gray-500">
            Запрос #{requestStatus.request_id} - {getStatusText(requestStatus.analysis_status)}
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMStatusIndicator;
