import React, { useState } from 'react';
import type { LLMAnalysisResult } from '../../types/llm';
import { requestsService } from '../../services/requests';
import { ErrorHandler } from '../../utils/errorHandler';
import LLMStatusIndicator from '../llm/LLMStatusIndicator';

interface RequestAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId?: number;
  requestText?: string;
  onAnalysisComplete?: (result: LLMAnalysisResult) => void;
}

const RequestAnalysisModal: React.FC<RequestAnalysisModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestText,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');

  const handleAnalyze = async () => {
    if (!requestId) return;

    setIsAnalyzing(true);
    setLlmStatus('analyzing');
    setError(null);
    setAnalysisResult(null);

    try {
      // Вызываем реальный API для анализа запроса
      const response = await requestsService.analyzeRequest(requestId, true); // true = использовать эмулятор
      
      // Преобразуем ответ API в формат LLMAnalysisResult
      const analysisResult: LLMAnalysisResult = {
        project_analysis: {
          project_title: response.data?.project_analysis?.project_title || '',
          description: response.data?.project_analysis?.description || '',
          project_type: response.data?.project_analysis?.project_type || '',
          genre: response.data?.project_analysis?.genre || '',
          premiere_date: response.data?.project_analysis?.premiere_date || '',
          confidence: response.data?.project_analysis?.confidence || 0.85,
          roles: response.data?.project_analysis?.roles?.map((role: any) => ({
            role_type: role.role_type || 'main',
            character_name: role.character_name || role.name || role.title,
            description: role.description,
            age_range: role.age_range,
            gender: role.gender,
            skills_required: role.skills_required || {
              acting_skills: [],
              physical_skills: [],
              languages: [],
              special_requirements: []
            },
            suggested_artists: role.suggested_artists || []
          })) || [],
          contacts: response.data?.project_analysis?.contacts || {
            casting_director: null,
            director: null,
            producers: [],
            production_company: null
          }
        }
      };

      setAnalysisResult(analysisResult);
      setLlmStatus('success');
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      setError('Ошибка при анализе запроса');
      setLlmStatus('error');
      ErrorHandler.logError(err, 'RequestAnalysisModal.analyzeRequest');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Анализ запроса {requestId ? `#${requestId}` : ''}
            </h2>
            <LLMStatusIndicator status={llmStatus} />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Закрыть"
          >
            &times;
          </button>
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {requestText && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Текст запроса:</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{requestText}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!analysisResult && !isAnalyzing && (
            <div className="text-center py-8">
              <button
                onClick={handleAnalyze}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Начать анализ
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-8">
              <LLMStatusIndicator 
                status={llmStatus} 
                message="Анализируем запрос с помощью ИИ..."
                className="justify-center mb-4"
              />
              <div className="mt-4">
                <div className="animate-pulse bg-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ИИ анализирует текст запроса и извлекает информацию о проекте, ролях и контактах...
                  </p>
                </div>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  Результат анализа (Уверенность: {(analysisResult.project_analysis.confidence * 100).toFixed(0)}%)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Проект:</h4>
                    <div className="text-sm text-green-700">
                      <p><strong>Название:</strong> {analysisResult.project_analysis.project_title}</p>
                      <p><strong>Описание:</strong> {analysisResult.project_analysis.description}</p>
                      <p><strong>Тип:</strong> {analysisResult.project_analysis.project_type}</p>
                      <p><strong>Жанр:</strong> {analysisResult.project_analysis.genre}</p>
                      {analysisResult.project_analysis.premiere_date && (
                        <p><strong>Премьера:</strong> {analysisResult.project_analysis.premiere_date}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Роли ({analysisResult.project_analysis.roles.length}):</h4>
                    <div className="space-y-3">
                      {analysisResult.project_analysis.roles.map((role, index) => (
                        <div key={index} className="bg-white border border-green-200 rounded-lg p-3">
                          <h5 className="font-medium text-green-900">{role.character_name}</h5>
                          <p className="text-sm text-green-700 mt-1">{role.description}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Возраст: {role.age_range}, Пол: {role.gender === 'male' ? 'Мужской' : 'Женский'}
                          </p>
                          {role.skills_required?.acting_skills?.length > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              Навыки: {role.skills_required.acting_skills.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Закрыть
          </button>
          {analysisResult && (
            <button
              onClick={() => {
                onAnalysisComplete?.(analysisResult);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Использовать для создания проекта
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestAnalysisModal;
