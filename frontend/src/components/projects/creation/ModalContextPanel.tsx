import React from 'react';
import type { RequestListItem } from '../../../types';
import type { LLMAnalysisResult } from '../../../types/llm';
import { MediaViewer } from '../../MediaViewer';

interface ModalContextPanelProps {
  request: RequestListItem;
  analysisResult?: LLMAnalysisResult | null;
}

const ModalContextPanel: React.FC<ModalContextPanelProps> = ({
  request,
  analysisResult,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок панели */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-3 md:p-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
            Контекст запроса
          </h3>
          
          {/* Информация об авторе и дате */}
          <div className="space-y-2 text-xs md:text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <span className="font-medium">Автор:</span>
              <span className="break-words">{request.author_name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <span className="font-medium">Дата:</span>
              <span>
                {request.original_created_at 
                  ? formatDate(request.original_created_at)
                  : 'Не указано'
                }
              </span>
            </div>
            {request.is_forwarded && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Переслано
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Содержимое панели - текст запроса и медиафайлы */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 space-y-4">
          {/* Текст запроса */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3 text-sm md:text-base">
              Полный текст запроса
            </h4>
            <div className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {request.text}
            </div>
          </div>
          
          {/* Медиафайлы */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3 text-sm md:text-base">
              Медиафайлы
            </h4>
            <div className="max-h-32 md:max-h-48 overflow-y-auto">
              <MediaViewer 
                requestId={request.id}
                showImages={true}
                showDocuments={true}
                compact={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalContextPanel;