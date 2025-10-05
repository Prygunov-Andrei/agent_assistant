import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
  disabled = false,
  maxWidth = '200px',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900';
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none ${getPositionClasses()}`}
          style={{ maxWidth }}
        >
          {content}
          
          {/* Стрелка */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${getArrowClasses()}`}
          />
        </div>
      )}
    </div>
  );
};

// Компонент для информационных tooltips
interface InfoTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children,
  className = '',
}) => {
  return (
    <Tooltip content={content} position="top" className={className}>
      <div className="inline-flex items-center cursor-help">
        {children}
        <svg
          className="w-4 h-4 ml-1 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Tooltip>
  );
};

// Компонент для tooltip с кнопкой
interface ActionTooltipProps {
  content: string;
  action: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ActionTooltip: React.FC<ActionTooltipProps> = ({
  content,
  action,
  children,
  className = '',
  disabled = false,
}) => {
  // const [isVisible, setIsVisible] = useState(false); // Не используется

  const handleClick = () => {
    if (!disabled) {
      action();
      // setIsVisible(false); // Не используется
    }
  };

  return (
    <Tooltip
      content={
        <div className="text-center">
          <div className="mb-2">{content}</div>
          <button
            onClick={handleClick}
            disabled={disabled}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Подтвердить
          </button>
        </div>
      }
      position="top"
      className={className}
      disabled={disabled}
    >
      {children}
    </Tooltip>
  );
};

export default Tooltip;
