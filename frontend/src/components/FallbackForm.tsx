import React, { useState } from 'react';
import ValidationErrorDisplay from './ValidationErrorDisplay';
import NotificationBanner from './NotificationBanner';

interface LLMError {
  type: 'validation' | 'network' | 'timeout' | 'unknown';
  message: string;
  details?: string;
}

interface FallbackFormProps {
  onManualSubmit: (data: any) => void;
  onRetryLLM: () => void;
  llmError?: LLMError;
  initialData?: any;
  isLoading?: boolean;
  className?: string;
}

const FallbackForm: React.FC<FallbackFormProps> = ({
  onManualSubmit,
  onRetryLLM,
  llmError,
  initialData = {},
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    projectTitle: initialData.projectTitle || '',
    projectType: initialData.projectType || '',
    description: initialData.description || '',
    genre: initialData.genre || '',
    ...initialData
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Простая валидация
    if (!formData.projectTitle.trim()) {
      setNotificationMessage('Название проекта обязательно для заполнения');
      setShowNotification(true);
      return;
    }

    onManualSubmit(formData);
  };

  const handleRetryLLM = () => {
    onRetryLLM();
  };

  const getErrorMessage = (error: LLMError) => {
    switch (error.type) {
      case 'validation':
        return 'Ошибка валидации ответа LLM. Проверьте корректность данных.';
      case 'network':
        return 'Ошибка сети при обращении к LLM. Проверьте подключение к интернету.';
      case 'timeout':
        return 'Превышено время ожидания ответа от LLM. Попробуйте еще раз.';
      case 'unknown':
        return 'Произошла неизвестная ошибка при работе с LLM.';
      default:
        return 'Ошибка при анализе запроса через LLM.';
    }
  };

  const validationErrors = [
    {
      field: 'LLM Анализ',
      message: getErrorMessage(llmError!),
      type: 'error' as const
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Уведомление */}
      {showNotification && (
        <NotificationBanner
          message={notificationMessage}
          type="error"
          duration={5000}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Отображение ошибки LLM */}
      {llmError && (
        <ValidationErrorDisplay errors={validationErrors} />
      )}

      {/* Информационное сообщение */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div>
            <h3 className="text-blue-800 font-medium mb-2">
              Ручное заполнение формы
            </h3>
            <p className="text-blue-700 text-sm mb-3">
              Автоматический анализ запроса не удался. Пожалуйста, заполните форму вручную.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRetryLLM}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Повторная попытка...' : 'Повторить анализ LLM'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Форма ручного заполнения */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Название проекта *
          </label>
          <input
            type="text"
            id="projectTitle"
            value={formData.projectTitle}
            onChange={(e) => handleInputChange('projectTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите название проекта"
            required
          />
        </div>

        <div>
          <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
            Тип проекта
          </label>
          <select
            id="projectType"
            value={formData.projectType}
            onChange={(e) => handleInputChange('projectType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Выберите тип проекта</option>
            <option value="фильм">Фильм</option>
            <option value="сериал">Сериал</option>
            <option value="реклама">Реклама</option>
            <option value="клип">Клип</option>
            <option value="театр">Театр</option>
            <option value="другое">Другое</option>
          </select>
        </div>

        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">
            Жанр
          </label>
          <input
            type="text"
            id="genre"
            value={formData.genre}
            onChange={(e) => handleInputChange('genre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите жанр"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание проекта
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите описание проекта"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleRetryLLM}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Сохранение...' : 'Создать проект'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FallbackForm;
