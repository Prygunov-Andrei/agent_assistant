import React, { useState, useEffect } from 'react';
import type { LLMAnalysisResult } from '../../../types/llm';
import type { RequestListItem } from '../../../types';
import { peopleService } from '../../../services/people';
import { companiesService } from '../../../services/companies';
import { ErrorHandler } from '../../../utils/errorHandler';
import { AnimatedList, Transition } from '../../common/AnimatedContainer';

interface MatchingSuggestionsPanelProps {
  analysisResult: LLMAnalysisResult;
  request: RequestListItem;
}

interface MatchingResult {
  type: 'person' | 'company';
  id: number;
  name: string;
  confidence: number;
  details: string;
  color: 'green' | 'yellow' | 'red';
}

const MatchingSuggestionsPanel: React.FC<MatchingSuggestionsPanelProps> = ({
  analysisResult,
  request,
}) => {
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analysisResult) {
      findMatches();
    }
  }, [analysisResult, request]);

  const findMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results: MatchingResult[] = [];
      
      // Поиск совпадений команды проекта
      if (analysisResult.contacts) {
        const contacts = analysisResult.contacts;
        
        // Поиск режиссера
        if (contacts.director?.name) {
          try {
            const directorMatches = await peopleService.searchPeople({
              name: contacts.director.name,
              limit: 3
            });
            
            directorMatches.forEach(match => {
              results.push({
                type: 'person',
                id: match.id,
                name: match.full_name,
                confidence: match.score || 0.8,
                details: `Режиссер - ${contacts.director?.name}`,
                color: getConfidenceColor(match.score || 0.8)
              });
            });
          } catch (err) {
            ErrorHandler.logError(err, 'MatchingSuggestionsPanel.searchDirector');
          }
        }

        // Поиск кастинг-директора
        if (contacts.casting_director?.name) {
          try {
            const castingMatches = await peopleService.searchPeople({
              name: contacts.casting_director.name,
              limit: 3
            });
            
            castingMatches.forEach(match => {
              results.push({
                type: 'person',
                id: match.id,
                name: match.full_name,
                confidence: match.score || 0.8,
                details: `Кастинг-директор - ${contacts.casting_director?.name}`,
                color: getConfidenceColor(match.score || 0.8)
              });
            });
          } catch (err) {
            ErrorHandler.logError(err, 'MatchingSuggestionsPanel.searchCastingDirector');
          }
        }

        // Поиск продакшн-компании
        if (contacts.production_company?.name) {
          try {
            const companyMatches = await companiesService.searchCompanies({
              name: contacts.production_company.name,
              limit: 3
            });
            
            companyMatches.forEach(match => {
              results.push({
                type: 'company',
                id: match.id,
                name: match.name,
                confidence: match.score || 0.8,
                details: `Продакшн-компания - ${contacts.production_company?.name}`,
                color: getConfidenceColor(match.score || 0.8)
              });
            });
          } catch (err) {
            ErrorHandler.logError(err, 'MatchingSuggestionsPanel.searchCompany');
          }
        }
      }

      // Поиск совпадений по названию проекта
      if (analysisResult.project_analysis.project_title) {
        try {
          const projectMatches = await peopleService.searchPeople({
            name: analysisResult.project_analysis.project_title,
            limit: 2
          });
          
          projectMatches.forEach(match => {
            results.push({
              type: 'person',
              id: match.id,
              name: match.full_name,
              confidence: match.score || 0.6,
              details: `Возможное совпадение по названию проекта`,
              color: getConfidenceColor(match.score || 0.6)
            });
          });
        } catch (err) {
          ErrorHandler.logError(err, 'MatchingSuggestionsPanel.searchByProjectTitle');
        }
      }

      setMatchingResults(results);
    } catch (err) {
      setError('Ошибка при поиске совпадений');
      ErrorHandler.logError(err, 'MatchingSuggestionsPanel.findMatches');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number): 'green' | 'yellow' | 'red' => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return 'Высокое';
    if (confidence >= 0.6) return 'Среднее';
    return 'Низкое';
  };

  const getColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'red':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Поиск совпадений...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs md:text-sm font-medium text-gray-900">
          Найденные совпадения
        </h3>
        <span className="text-xs text-gray-500">
          {matchingResults.length}
        </span>
      </div>

      {matchingResults.length === 0 ? (
        <Transition show={true} animation="fade">
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Совпадения не найдены
            </p>
          </div>
        </Transition>
      ) : (
        <AnimatedList
          staggerDelay={100}
          animation="slideIn"
          className="space-y-2 max-h-24 md:max-h-32 overflow-y-auto"
        >
          {matchingResults.map((result, index) => (
            <div
              key={`${result.type}-${result.id}-${index}`}
              className={`border rounded-lg p-2 md:p-3 transition-all duration-200 hover:shadow-md ${getColorClasses(result.color)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">
                      {result.type === 'person' ? '👤' : '🏢'}
                    </span>
                    <span className="text-xs md:text-sm font-medium truncate">
                      {result.name}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-90 line-clamp-2">
                    {result.details}
                  </p>
                </div>
                <div className="ml-2 flex flex-col items-end">
                  <span className="text-xs font-medium">
                    {getConfidenceText(result.confidence)}
                  </span>
                  <span className="text-xs opacity-75">
                    {(result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </AnimatedList>
      )}

      {/* Легенда */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="hidden sm:inline">Высокое</span>
            <span className="sm:hidden">В</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="hidden sm:inline">Среднее</span>
            <span className="sm:hidden">С</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="hidden sm:inline">Низкое</span>
            <span className="sm:hidden">Н</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingSuggestionsPanel;
