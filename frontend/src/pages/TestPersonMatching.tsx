import React, { useState } from 'react';
import PersonSelectionComponent from '../components/people/PersonSelectionComponent';

const TestPersonMatching: React.FC = () => {
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Тестирование поиска персон</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Выбор персоны</h2>
        <PersonSelectionComponent
          selectedPersonId={selectedPersonId}
          onSelectionChange={setSelectedPersonId}
          placeholder="Начните вводить имя для поиска..."
        />
        
        {selectedPersonId && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              Выбрана персона с ID: {selectedPersonId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPersonMatching;
