import React, { useState, useEffect, useCallback } from 'react';
import type { CompanyMatch, CompanyType } from '../../../types/companies';
import { companiesService } from '../../../services/companies';
// import MatchingSuggestions from '../persons/MatchingSuggestions'; // Не используется в этом компоненте

interface CompanySelectionComponentProps {
  selectedCompanyId?: number | null;
  onSelectionChange: (companyId: number | null) => void;
  placeholder?: string;
  className?: string;
}

const CompanySelectionComponent: React.FC<CompanySelectionComponentProps> = ({
  selectedCompanyId,
  onSelectionChange,
  placeholder = 'Начните вводить название для поиска компании...',
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState('');
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [suggestions, setSuggestions] = useState<CompanyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyMatch | null>(null);

  useEffect(() => {
    const fetchCompanyTypes = async () => {
      try {
        const types = await companiesService.getCompanyTypes();
        setCompanyTypes(types);
      } catch (err) {
        console.error('Failed to fetch company types:', err);
        setError('Не удалось загрузить типы компаний.');
      }
    };
    fetchCompanyTypes();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      const fetchSelectedCompany = async () => {
        try {
          const company = await companiesService.getCompany(selectedCompanyId);
          setSelectedCompany({ 
            ...company, 
            score: 1.0, 
            confidence: 'high',
            matched_fields: [],
            field_scores: {}
          }); // Mock score/confidence for display
        } catch (err) {
          console.error('Failed to fetch selected company:', err);
          setError('Не удалось загрузить выбранную компанию.');
        }
      };
      fetchSelectedCompany();
    } else {
      setSelectedCompany(null);
    }
  }, [selectedCompanyId]);

  const searchCompanies = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const matches = await companiesService.searchCompanyMatches({
          name: term,
          company_type: companyTypeFilter as any || undefined,
        });
        setSuggestions(matches);
      } catch (err) {
        console.error('Failed to search companies:', err);
        setError('Ошибка при поиске компаний.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [companyTypeFilter]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchCompanies(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchCompanies]);

  const handleCompanySelect = (company: CompanyMatch) => {
    setSelectedCompany(company);
    setSearchTerm('');
    setSuggestions([]);
    onSelectionChange(company.id);
  };

  const handleCompanyDeselect = () => {
    setSelectedCompany(null);
    onSelectionChange(null);
  };

  const handleCompanyTypeChange = (type: string) => {
    setCompanyTypeFilter(type);
    if (searchTerm.trim()) {
      searchCompanies(searchTerm);
    }
  };

  if (selectedCompany) {
    return (
      <div className={`company-selection-selected ${className || ''}`}>
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-900">{selectedCompany.name}</span>
              <span className="text-sm text-blue-600">({selectedCompany.company_type_display})</span>
            </div>
            {selectedCompany.description && (
              <p className="text-sm text-blue-700 mt-1">{selectedCompany.description}</p>
            )}
            {selectedCompany.website && (
              <p className="text-sm text-blue-600 mt-1">🌐 {selectedCompany.website}</p>
            )}
          </div>
          <button
            onClick={handleCompanyDeselect}
            className="ml-2 text-blue-500 hover:text-blue-700 text-xl font-bold"
            aria-label="Убрать компанию"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`company-selection ${className || ''}`}>
      <div className="space-y-3">
        {/* Тип компании фильтр */}
        <div>
          <label htmlFor="company-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Тип компании:
          </label>
          <select
            id="company-type-filter"
            value={companyTypeFilter}
            onChange={(e) => handleCompanyTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все типы</option>
            {companyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Поле поиска */}
        <div>
          <label htmlFor="company-search" className="block text-sm font-medium text-gray-700 mb-1">
            Поиск компании:
          </label>
          <input
            id="company-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Состояние загрузки */}
        {isLoading && (
          <div className="text-center py-2">
            <span className="text-blue-600">Поиск...</span>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="text-center py-2">
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {/* Результаты поиска */}
        {suggestions.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Найденные совпадения:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {suggestions.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{company.name}</span>
                        <span className="text-sm text-gray-500">({company.company_type_display})</span>
                      </div>
                      {company.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{company.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {company.website && <span>🌐 {company.website}</span>}
                        {company.email && <span>📧 {company.email}</span>}
                      </div>
                    </div>
                    <div className="ml-2 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          company.confidence === 'high'
                            ? 'bg-green-100 text-green-800'
                            : company.confidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {company.confidence} ({company.score.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {searchTerm.trim() && !isLoading && suggestions.length === 0 && !error && (
          <div className="text-center py-4 text-gray-500">
            <p>Компании не найдены</p>
            <p className="text-sm">Попробуйте изменить критерии поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySelectionComponent;
