import React, { useState } from 'react';
import type { PersonSearchParams } from '../../types/people';

interface PersonSearchBarProps {
  personType: 'director' | 'producer' | 'casting_director';
  onSearch: (params: PersonSearchParams) => void;
}

export const PersonSearchBar: React.FC<PersonSearchBarProps> = ({ personType, onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<string>('-created_at');
  
  const handleSearch = () => {
    onSearch({
      person_type: personType,
      name: searchText,
      sort
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
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
        onKeyPress={handleKeyPress}
        placeholder="Поиск по ФИО, телефону, email, telegram..."
        className="form-input"
        style={{ flex: 1 }}
      />
      <select
        value={sort}
        onChange={(e) => {
          setSort(e.target.value);
          onSearch({
            person_type: personType,
            name: searchText,
            sort: e.target.value
          });
        }}
        className="form-input"
        style={{ width: '200px' }}
      >
        <option value="-created_at">Сначала новые</option>
        <option value="created_at">Сначала старые</option>
        <option value="full_name">По алфавиту</option>
        <option value="-projects_count">Больше проектов</option>
        <option value="projects_count">Меньше проектов</option>
      </select>
      <button
        onClick={handleSearch}
        className="btn btn-primary"
        style={{ whiteSpace: 'nowrap' }}
      >
        🔍 Поиск
      </button>
    </div>
  );
};
