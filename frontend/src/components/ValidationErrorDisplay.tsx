import React from 'react';

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  className?: string;
}

const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({ 
  errors, 
  className = '' 
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  return (
    <div className={`space-y-2 ${className}`}>
      {Object.entries(groupedErrors).map(([type, typeErrors]) => (
        <div key={type} className={`p-3 rounded-lg border ${getErrorColor(type)}`}>
          <div className="flex items-start space-x-2">
            <span className="text-lg">{getErrorIcon(type)}</span>
            <div className="flex-1">
              <h4 className="font-medium mb-1">
                {type === 'error' && 'Ошибки валидации'}
                {type === 'warning' && 'Предупреждения'}
                {type === 'info' && 'Информация'}
              </h4>
              <ul className="space-y-1">
                {typeErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ValidationErrorDisplay;
