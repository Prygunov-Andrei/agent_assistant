import * as React from 'react';
import type { LoadingSpinnerProps } from '../types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Загрузка...' 
}) => {
  const sizeClasses = {
    sm: 'loading-spinner-sm',
    md: 'loading-spinner-md',
    lg: 'loading-spinner-lg',
  };

  const textSizeClasses = {
    sm: 'loading-text-sm',
    md: 'loading-text-md',
    lg: 'loading-text-lg',
  };

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]}`} role="status" aria-hidden="true">
        <div className="spinner"></div>
      </div>
      {text && (
        <p className={`loading-text ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
