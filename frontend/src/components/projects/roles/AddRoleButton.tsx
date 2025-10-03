import React from 'react';

interface AddRoleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AddRoleButton: React.FC<AddRoleButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'primary',
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
      case 'outline':
        return 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const baseClasses = 'inline-flex items-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      type="button"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      Добавить роль
    </button>
  );
};
