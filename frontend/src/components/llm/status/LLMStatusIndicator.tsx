// Компонент индикатора статуса LLM

import React from 'react';
import type { AnalysisStatus, LLMStatus } from '../../../types/llm';

interface LLMStatusIndicatorProps {
  status: AnalysisStatus | LLMStatus;
  isLoading?: boolean;
  className?: string;
}

export const LLMStatusIndicator: React.FC<LLMStatusIndicatorProps> = ({
  status,
  isLoading = false,
  className = '',
}) => {
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        text: 'Анализ...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: '⏳',
      };
    }

    if (typeof status === 'string') {
      // AnalysisStatus
      switch (status) {
        case 'new':
          return {
            text: 'Новый',
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            icon: '📝',
          };
        case 'analyzed':
          return {
            text: 'Проанализирован',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            icon: '✅',
          };
        case 'processed':
          return {
            text: 'Обработан',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            icon: '🔧',
          };
        default:
          return {
            text: 'Неизвестно',
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            icon: '❓',
          };
      }
    } else {
      // LLMStatus
      if (status.is_analyzing) {
        return {
          text: 'Анализ...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: '⏳',
        };
      }
      
      if (status.is_available) {
        return {
          text: 'Доступен',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: '✅',
        };
      }
      
      return {
        text: 'Недоступен',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '❌',
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} ${className}`}>
      <span className="mr-1">{statusInfo.icon}</span>
      <span>{statusInfo.text}</span>
    </div>
  );
};

// Компонент с анимацией загрузки
export const LLMStatusIndicatorWithAnimation: React.FC<LLMStatusIndicatorProps> = ({
  status,
  isLoading = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <LLMStatusIndicator status={status} isLoading={isLoading} />
      {isLoading && (
        <div className="ml-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};
