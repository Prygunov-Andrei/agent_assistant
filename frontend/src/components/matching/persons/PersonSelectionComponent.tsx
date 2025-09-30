// Компонент для выбора персон с поиском совпадений

import React, { useState, useEffect } from 'react';
import type { PersonMatchingResult } from '../../../types/matching';
import { SearchUtils } from '../../../utils/fuzzyMatching';

interface PersonSelectionComponentProps {
  type: 'director' | 'producer' | 'casting_director';
  onSelect: (person: PersonMatchingResult) => void;
  onCancel: () => void;
  className?: string;
}

export const PersonSelectionComponent: React.FC<PersonSelectionComponentProps> = ({
  type,
  onSelect,
  onCancel,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PersonMatchingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabels = {
    director: 'Режиссер',
    producer: 'Продюсер',
    casting_director: 'Кастинг-директор',
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Здесь будет вызов API для поиска
      // const results = await MatchingService.searchPersons({ name: query, person_type: type });
      
      // Заглушка для демонстрации
      const mockResults: PersonMatchingResult[] = [
        {
          id: 1,
          name: 'Иван Петров',
          type: 'director',
          email: 'ivan@example.com',
          phone: '+7-123-456-78-90',
          confidence: 0.95,
          match_type: 'exact',
          matched_fields: ['name'],
        },
        {
          id: 2,
          name: 'Петр Иванов',
          type: 'director',
          email: 'petr@example.com',
          confidence: 0.8,
          match_type: 'high',
          matched_fields: ['name'],
        },
        {
          id: 3,
          name: 'Сидор Сидоров',
          type: 'director',
          email: 'sidor@example.com',
          confidence: 0.6,
          match_type: 'medium',
          matched_fields: ['name'],
        },
      ];

      setSearchResults(mockResults);
    } catch (err) {
      setError('Ошибка при поиске персон');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const getMatchColor = (confidence: number) => {
    return SearchUtils.getMatchColor(confidence);
  };

  const getMatchText = (confidence: number) => {
    return SearchUtils.getMatchText(confidence);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'border-green-200 bg-green-50';
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50';
      case 'orange':
        return 'border-orange-200 bg-orange-50';
      case 'red':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Выбор {typeLabels[type]}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Поиск по имени, email или телефону:
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Введите имя, email или телефон..."
        />
      </div>

      {isSearching && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Поиск...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.map((person) => {
            const color = getMatchColor(person.confidence);
            const colorClasses = getColorClasses(color);
            const matchText = getMatchText(person.confidence);

            return (
              <div
                key={person.id}
                className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${colorClasses}`}
                onClick={() => onSelect(person)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{person.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{person.type}</p>
                    
                    <div className="mt-2 space-y-1">
                      {person.email && (
                        <p className="text-xs text-gray-500">Email: {person.email}</p>
                      )}
                      {person.phone && (
                        <p className="text-xs text-gray-500">Телефон: {person.phone}</p>
                      )}
                      {person.company && (
                        <p className="text-xs text-gray-500">Компания: {person.company}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      color === 'green' ? 'bg-green-100 text-green-800' :
                      color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {matchText}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(person.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Персоны не найдены</p>
          <p className="text-sm text-gray-400 mt-1">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Введите поисковый запрос для поиска {typeLabels[type].toLowerCase()}ов
          </p>
        </div>
      )}
    </div>
  );
};
