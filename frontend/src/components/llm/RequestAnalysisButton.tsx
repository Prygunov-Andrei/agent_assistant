import React, { useState } from 'react';
import { LLMService } from '../../services/llm';
import type { LLMAnalysisResult } from '../../types/llm';
import LLMStatusIndicator from './LLMStatusIndicator';

interface RequestAnalysisButtonProps {
  requestId: number;
  onAnalysisComplete?: (result: LLMAnalysisResult) => void;
  onAnalysisError?: (error: string) => void;
  className?: string;
  useEmulator?: boolean;
}

const RequestAnalysisButton: React.FC<RequestAnalysisButtonProps> = ({
  requestId,
  onAnalysisComplete,
  onAnalysisError,
  className = '',
  useEmulator = true
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      const result = await LLMService.analyzeRequest(requestId, useEmulator);
      setAnalysisResult(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка анализа запроса';
      setError(errorMessage);
      
      if (onAnalysisError) {
        onAnalysisError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${isAnalyzing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isAnalyzing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Анализ...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>Анализировать запрос</span>
            </div>
          )}
        </button>

        <LLMStatusIndicator 
          status={isAnalyzing ? 'analyzing' : analysisResult ? 'success' : error ? 'error' : 'idle'}
          message={error || (analysisResult ? 'Анализ завершен' : undefined)}
          className="text-sm"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">❌</span>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {analysisResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-500">✅</span>
            <span className="text-sm font-medium text-green-700">
              Анализ завершен успешно
            </span>
          </div>
          
          <div className="text-xs text-green-600 space-y-1">
            <div>Анализ завершен успешно</div>
            <div>Время: {new Date().toLocaleTimeString()}</div>
          </div>

          {analysisResult.project_analysis && (
            <div className="mt-3 text-sm">
              <div className="font-medium text-green-800">
                {analysisResult.project_analysis.project_title}
              </div>
              <div className="text-green-700">
                {analysisResult.project_analysis.project_type} • {analysisResult.project_analysis.genre}
              </div>
              <div className="text-green-600">
                Ролей: {analysisResult.project_analysis.roles.length}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestAnalysisButton;
