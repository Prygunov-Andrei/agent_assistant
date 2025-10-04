import React from 'react';

export type LLMStatus = 'idle' | 'analyzing' | 'success' | 'error';

interface LLMStatusIndicatorProps {
  status: LLMStatus;
  message?: string;
  className?: string;
}

const LLMStatusIndicator: React.FC<LLMStatusIndicatorProps> = ({
  status,
  message,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return '🤖';
      case 'analyzing':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        );
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🤖';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'text-gray-600';
      case 'analyzing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    if (message) return message;
    
    switch (status) {
      case 'idle':
        return 'Готов к анализу';
      case 'analyzing':
        return 'Анализируем запрос...';
      case 'success':
        return 'Анализ завершен';
      case 'error':
        return 'Ошибка анализа';
      default:
        return 'Неизвестный статус';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default LLMStatusIndicator;