// Модальное окно для анализа запроса

import React, { useState } from 'react';
import type { LLMAnalysisResult } from '../../../types/llm';
import { LLMStatusIndicator } from '../status/LLMStatusIndicator';

interface RequestAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number;
  requestText: string;
  onAnalysisComplete: (result: LLMAnalysisResult) => void;
}

export const RequestAnalysisModal: React.FC<RequestAnalysisModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestText,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Здесь будет вызов API для анализа
      // const result = await LLMService.analyzeRequest(requestId);
      // setAnalysisResult(result);
      
      // Заглушка для демонстрации
      setTimeout(() => {
        const mockResult: LLMAnalysisResult = {
          project_type: 'Фильм',
          project_type_raw: 'художественный фильм',
          genre: 'Драма',
          description: 'Драматическая история о...',
          roles: [
            {
              title: 'Главный герой',
              description: 'Молодой человек 25-30 лет',
              gender: 'male',
              age_range: { min: 25, max: 30 },
              skills_required: ['Актерское мастерство', 'Драма'],
              suggested_artists: [1, 2, 3],
            },
          ],
          suggested_persons: [
            {
              name: 'Иван Петров',
              type: 'director',
              email: 'ivan@example.com',
              confidence: 0.9,
            },
          ],
          suggested_companies: [
            {
              name: 'Кинокомпания "Студия"',
              type: 'production',
              confidence: 0.8,
            },
          ],
          suggested_projects: [],
        };
        
        setAnalysisResult(mockResult);
        setIsAnalyzing(false);
      }, 2000);
    } catch (err) {
      setError('Ошибка при анализе запроса');
      setIsAnalyzing(false);
    }
  };

  const handleApplyAnalysis = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Анализ запроса #{requestId}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Текст запроса:</h3>
          <div className="bg-gray-100 p-3 rounded border">
            <p className="text-sm">{requestText}</p>
          </div>
        </div>

        {!analysisResult && !isAnalyzing && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Нажмите кнопку "Анализировать" для запуска анализа через LLM
            </p>
            <button
              onClick={handleAnalyze}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Анализировать
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <LLMStatusIndicator status="new" isLoading={true} />
            <p className="text-gray-600 mt-2">Анализ запроса в процессе...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Результаты анализа:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Тип проекта:</h4>
                <p className="text-sm text-gray-600">{analysisResult.project_type}</p>
                {analysisResult.project_type_raw && (
                  <p className="text-xs text-gray-500 mt-1">
                    Исходный текст: "{analysisResult.project_type_raw}"
                  </p>
                )}
              </div>

              {analysisResult.genre && (
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Жанр:</h4>
                  <p className="text-sm text-gray-600">{analysisResult.genre}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Описание:</h4>
              <p className="text-sm text-gray-600">{analysisResult.description}</p>
            </div>

            {analysisResult.roles.length > 0 && (
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Роли:</h4>
                <div className="space-y-2">
                  {analysisResult.roles.map((role, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{role.title}</span>
                      <p className="text-gray-600">{role.description}</p>
                      {role.skills_required.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Навыки: {role.skills_required.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleApplyAnalysis}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Применить анализ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
