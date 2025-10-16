import React, { useState, useEffect, useRef } from 'react';
import type { PersonSearchParams } from '../../types/people';

interface PersonSearchBarProps {
  personType: 'director' | 'producer' | 'casting_director';
  onSearch: (params: PersonSearchParams) => void;
}

export const PersonSearchBar: React.FC<PersonSearchBarProps> = ({ personType, onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<string>('-created_at');
  const onSearchRef = useRef(onSearch);
  const previousParamsRef = useRef({
    searchText: '',
    sort: '-created_at',
    personType
  });

  // Обновляем ref при изменении onSearch
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Сбрасываем поисковые значения при смене типа персоны
  useEffect(() => {
    if (previousParamsRef.current.personType === personType) {
      return;
    }

    previousParamsRef.current = {
      searchText: '',
      sort: '-created_at',
      personType
    };

    setSearchText('');
    setSort('-created_at');
  }, [personType]);

  // Живой поиск с debounce
  useEffect(() => {
    const previousParams = previousParamsRef.current;
    const hasChanged =
      previousParams.searchText !== searchText ||
      previousParams.sort !== sort ||
      previousParams.personType !== personType;

    if (!hasChanged) {
      return;
    }

    previousParamsRef.current = {
      searchText,
      sort,
      personType
    };

    const timer = setTimeout(() => {
      onSearchRef.current({
        person_type: personType,
        name: searchText,
        phone: searchText,
        email: searchText,
        telegram: searchText,
        sort
      });
    }, 300); // Задержка 300ms

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [searchText, sort, personType]);
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      alignItems: 'center',
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Поиск по ФИО, телефону, email, telegram, проектам..."
        className="form-input"
        style={{ flex: 1 }}
      />
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="form-input"
        style={{ width: '220px' }}
      >
        <option value="-created_at">Сначала новые</option>
        <option value="created_at">Сначала старые</option>
        <option value="full_name">По алфавиту</option>
        <option value="-projects_count">Больше проектов</option>
        <option value="projects_count">Меньше проектов</option>
      </select>
    </div>
  );
};
