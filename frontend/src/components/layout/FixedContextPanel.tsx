import React from 'react';

interface FixedContextPanelProps {
  requestText?: string;
  requestId?: number;
  isVisible: boolean;
  onClose: () => void;
}

const FixedContextPanel: React.FC<FixedContextPanelProps> = ({
  requestText,
  requestId,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-1/4 bg-white border-l border-gray-200 shadow-lg z-40 overflow-hidden flex flex-col">
      {/* Заголовок панели */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Контекст запроса</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          aria-label="Закрыть панель"
        >
          &times;
        </button>
      </div>

      {/* Содержимое панели */}
      <div className="flex-1 overflow-y-auto p-4">
        {requestText ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">Текст запроса:</h4>
              <div className="text-sm text-blue-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {requestText}
              </div>
            </div>
            
            {requestId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">ID запроса:</h4>
                <div className="text-sm text-gray-600">#{requestId}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>Выберите запрос для отображения контекста</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedContextPanel;
