import React, { useState, useEffect, useCallback } from 'react';
import type { PersonMatch, PersonType } from '../../types/people';
import { peopleService } from '../../services/people';
import MatchingSuggestions from './MatchingSuggestions';

interface PersonSelectionComponentProps {
  selectedPersonId?: number | null;
  onSelectionChange: (personId: number | null) => void;
  placeholder?: string;
  className?: string;
}

const PersonSelectionComponent: React.FC<PersonSelectionComponentProps> = ({
  selectedPersonId,
  onSelectionChange,
  placeholder = 'Начните вводить имя для поиска персоны...',
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [personTypeFilter, setPersonTypeFilter] = useState('');
  const [personTypes, setPersonTypes] = useState<PersonType[]>([]);
  const [suggestions, setSuggestions] = useState<PersonMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonMatch | null>(null);

  useEffect(() => {
    const fetchPersonTypes = async () => {
      try {
        const types = await peopleService.getPersonTypes();
        setPersonTypes(types);
      } catch (err) {
        console.error('Failed to fetch person types:', err);
        setError('Не удалось загрузить типы персон.');
      }
    };
    fetchPersonTypes();
  }, []);

  useEffect(() => {
    if (selectedPersonId) {
      const fetchSelectedPerson = async () => {
        try {
          const person = await peopleService.getPerson(selectedPersonId);
          setSelectedPerson({ ...person, score: 1.0, confidence: 'high' }); // Mock score/confidence for display
        } catch (err) {
          console.error('Failed to fetch selected person:', err);
          setError('Не удалось загрузить выбранную персону.');
        }
      };
      fetchSelectedPerson();
    } else {
      setSelectedPerson(null);
    }
  }, [selectedPersonId]);

  const searchPersons = useCallback(async (name: string, type: string) => {
    if (name.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { name };
      if (type) {
        params.person_type = type;
      }
      const results = await peopleService.searchPersonsByName(params);
      setSuggestions(results);
    } catch (err) {
      console.error('Failed to search persons:', err);
      setError('Ошибка при поиске персон.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchPersons(searchTerm, personTypeFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, personTypeFilter, searchPersons]);

  const handleSelectPerson = (personId: number) => {
    const person = suggestions.find(s => s.id === personId);
    if (person) {
      setSelectedPerson(person);
      onSelectionChange(person.id);
      setSearchTerm(''); // Clear search term after selection
      setSuggestions([]); // Clear suggestions
    }
  };

  const handleRemovePerson = () => {
    setSelectedPerson(null);
    onSelectionChange(null);
  };

  return (
    <div className={`relative ${className}`}>
      {selectedPerson ? (
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center">
            {selectedPerson.photo && (
              <img src={selectedPerson.photo} alt={selectedPerson.full_name} className="w-10 h-10 rounded-full mr-3 object-cover" />
            )}
            <div>
              <p className="font-medium text-gray-900">{selectedPerson.full_name}</p>
              <p className="text-sm text-gray-500">{selectedPerson.person_type_display}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemovePerson}
            className="text-red-500 hover:text-red-700 focus:outline-none"
          >
            &times;
          </button>
        </div>
      ) : (
        <>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={personTypeFilter}
              onChange={(e) => setPersonTypeFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все типы</option>
              {personTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {isLoading && <p className="text-blue-500 text-sm">Поиск...</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <MatchingSuggestions matches={suggestions} onSelect={handleSelectPerson} />
        </>
      )}
    </div>
  );
};

export default PersonSelectionComponent;