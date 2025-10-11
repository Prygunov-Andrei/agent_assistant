import React from 'react';
import { PersonTable } from '../components/people/PersonTable';

const Directors: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <PersonTable personType="director" />
    </div>
  );
};

export default Directors;

