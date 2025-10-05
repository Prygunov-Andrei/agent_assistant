import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'table' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  className = '',
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      case 'table':
        return 'h-12 rounded';
      case 'card':
        return 'h-32 rounded-lg';
      default:
        return 'rounded';
    }
  };

  const skeletonItem = (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={{ width, height }}
    />
  );

  if (count === 1) {
    return skeletonItem;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{skeletonItem}</div>
      ))}
    </div>
  );
};

// Специализированные компоненты скелетонов
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }, (_, colIndex) => (
          <SkeletonLoader
            key={colIndex}
            variant="rectangular"
            width="100%"
            height="2rem"
            className="flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="p-4 border rounded-lg">
        <SkeletonLoader variant="circular" width="3rem" height="3rem" className="mb-3" />
        <SkeletonLoader variant="text" width="80%" height="1.5rem" className="mb-2" />
        <SkeletonLoader variant="text" width="60%" height="1rem" className="mb-2" />
        <SkeletonLoader variant="text" width="40%" height="1rem" />
      </div>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number; showAvatar?: boolean }> = ({
  count = 5,
  showAvatar = false,
}) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3">
        {showAvatar && (
          <SkeletonLoader variant="circular" width="2.5rem" height="2.5rem" />
        )}
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="70%" height="1rem" />
          <SkeletonLoader variant="text" width="50%" height="0.875rem" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
