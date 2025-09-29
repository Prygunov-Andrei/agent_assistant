import * as React from 'react';
import RequestsTable from '../components/RequestsTable';

const Requests: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <RequestsTable />
    </div>
  );
};

export default Requests;
