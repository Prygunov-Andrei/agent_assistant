import React, { useState } from 'react';

interface DeleteRoleButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'danger' | 'outline-danger';
  roleName?: string;
}

export const DeleteRoleButton: React.FC<DeleteRoleButtonProps> = ({
  onConfirm,
  disabled = false,
  className = '',
  size = 'sm',
  variant = 'danger',
  roleName,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline-danger':
        return 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500';
      default:
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    }
  };

  const baseClasses = 'inline-flex items-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const handleClick = () => {
    if (showConfirm) {
      onConfirm();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Автоматически скрыть подтверждение через 3 секунды
      setTimeout(() => {
        setShowConfirm(false);
      }, 3000);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600">
          Удалить {roleName ? `"${roleName}"` : 'роль'}?
        </span>
        <button
          onClick={handleClick}
          className={`${baseClasses} ${getSizeClasses()} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`}
          type="button"
        >
          Да
        </button>
        <button
          onClick={handleCancel}
          className={`${baseClasses} ${getSizeClasses()} bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500`}
          type="button"
        >
          Нет
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${getSizeClasses()} ${getVariantClasses()} ${className}`}
      type="button"
      title={`Удалить ${roleName ? `роль "${roleName}"` : 'роль'}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      {size !== 'sm' && <span className="ml-1">Удалить</span>}
    </button>
  );
};
