import React from 'react';
import { PersonTable } from '../components/people/PersonTable';

const CastingDirectors: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <PersonTable personType="casting_director" />
    </div>
  );
};

export default CastingDirectors;

