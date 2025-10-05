import React, { useEffect, useState } from 'react';

interface NotificationBannerProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // в миллисекундах, 0 = не исчезает автоматически
  onClose?: () => void;
  className?: string;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300); // даем время на анимацию
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  const getBannerStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg transition-all duration-300 ${getBannerStyles()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <span className="text-lg flex-shrink-0">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Закрыть уведомление"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
