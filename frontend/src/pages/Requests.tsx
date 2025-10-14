import * as React from 'react';
import RequestsTable from '../components/RequestsTable';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Requests: React.FC = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <RequestsTable />
    </div>
  );
};

export default Requests;
