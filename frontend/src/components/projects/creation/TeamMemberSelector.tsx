import React, { useState, useEffect } from 'react';
import { peopleService } from '../../../services/people';
import { companiesService } from '../../../services/companies';
import { ErrorHandler } from '../../../utils/errorHandler';

interface PersonMatch {
  id: number;
  full_name: string;
  score?: number;
  confidence?: number;
  email?: string;
  phone?: string;
  telegram?: string;
}

interface CompanyMatch {
  id: number;
  name: string;
  score?: number;
  confidence?: number;
  email?: string;
  phone?: string;
  website?: string;
}

interface TeamMemberSelectorProps {
  label: string;
  llmSuggestion: string;
  llmEmail?: string;
  llmPhone?: string;
  llmTelegram?: string;
  llmWebsite?: string;
  type: 'person' | 'company';
  onSelectionChange: (selectedId: number | null, selectedName: string | null) => void;
  onCreateNew?: () => void;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  label,
  llmSuggestion,
  llmEmail,
  llmPhone,
  llmTelegram,
  llmWebsite,
  type,
  onSelectionChange,
  onCreateNew
}) => {
  const [matches, setMatches] = useState<(PersonMatch | CompanyMatch)[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PersonMatch | CompanyMatch | null>(null);

  useEffect(() => {
    if (llmSuggestion && llmSuggestion !== 'Не определен') {
      findMatches();
    }
  }, [llmSuggestion]);

  const findMatches = async () => {
    if (!llmSuggestion || llmSuggestion === 'Не определен') return;
    
    setLoading(true);
    try {
      if (type === 'person') {
        const personMatches = await peopleService.searchPeople({
          name: llmSuggestion,
          limit: 5
        });
        setMatches(personMatches);
      } else {
        const companyMatches = await companiesService.searchCompanies({
          name: llmSuggestion,
          limit: 5
        });
        setMatches(companyMatches);
      }
    } catch (error) {
      ErrorHandler.logError(error, `TeamMemberSelector.findMatches.${type}`);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match: PersonMatch | CompanyMatch) => {
    setSelectedMatch(match);
    onSelectionChange(match.id, match.full_name || match.name);
  };

  const handleCreateNew = () => {
    setSelectedMatch(null);
    onCreateNew?.();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Точное совпадение';
    if (confidence >= 0.7) return 'Высокое';
    if (confidence >= 0.4) return 'Среднее';
    return 'Низкое';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return '✅';
    if (confidence >= 0.7) return '🎯';
    if (confidence >= 0.4) return '⚠️';
    return '❌';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* LLM предложение - всегда видимо */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
        <div className="flex items-start space-x-2">
          <span className="text-lg">🤖</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">LLM: {llmSuggestion}</p>
            {llmEmail && <p className="text-xs text-blue-600 mt-1">{llmEmail}</p>}
            {llmPhone && <p className="text-xs text-blue-600">{llmPhone}</p>}
            {llmTelegram && <p className="text-xs text-blue-600">{llmTelegram}</p>}
            {llmWebsite && <p className="text-xs text-blue-600">{llmWebsite}</p>}
          </div>
        </div>
      </div>

      {/* Выбранное значение - если выбрано совпадение */}
      {selectedMatch && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
          <div className="flex items-start space-x-2">
            <span className="text-lg">✅</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Выбрано: {selectedMatch.full_name || selectedMatch.name}</p>
              {selectedMatch.email && <p className="text-xs text-green-600 mt-1">{selectedMatch.email}</p>}
              {selectedMatch.phone && <p className="text-xs text-green-600">{selectedMatch.phone}</p>}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedMatch(null);
                onSelectionChange(null, null);
              }}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              title="Вернуться к LLM предложению"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Список совпадений - всегда видимый */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">Выберите из найденных:</p>
        
        {loading ? (
          <div className="p-3 text-center text-gray-600 bg-gray-50 rounded-md">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Поиск совпадений...
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-2">
            {matches.map((match, index) => {
              const confidence = match.score || match.confidence || 0;
              const isSelected = selectedMatch?.id === match.id;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectMatch(match)}
                  className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                    isSelected 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <span className="text-lg">{getConfidenceIcon(confidence)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {match.full_name || match.name}
                        </p>
                        {match.email && <p className="text-xs text-gray-600 mt-1">{match.email}</p>}
                        {match.phone && <p className="text-xs text-gray-600">{match.phone}</p>}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className={`text-xs px-2 py-1 rounded-full border ${getConfidenceColor(confidence)}`}>
                        {getConfidenceText(confidence)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(confidence * 100)}%
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {/* Кнопка создания нового */}
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full text-left p-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">➕</span>
                <span className="text-sm text-gray-700">
                  Создать нового {type === 'person' ? 'человека' : 'компанию'}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="text-center p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Совпадения не найдены</p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Создать нового {type === 'person' ? 'человека' : 'компанию'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
