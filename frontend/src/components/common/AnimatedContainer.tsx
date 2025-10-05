import React, { useState, useEffect } from 'react';

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'slideUp' | 'slideDown';
  delay?: number;
  duration?: number;
  className?: string;
  trigger?: boolean;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 300,
  className = '',
  trigger = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [trigger, delay]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out';
    const durationClass = `duration-${duration}`;

    if (!isVisible) {
      switch (animation) {
        case 'fadeIn':
          return `${baseClasses} ${durationClass} opacity-0`;
        case 'slideIn':
          return `${baseClasses} ${durationClass} opacity-0 -translate-x-8`;
        case 'scaleIn':
          return `${baseClasses} ${durationClass} opacity-0 scale-95`;
        case 'slideUp':
          return `${baseClasses} ${durationClass} opacity-0 translate-y-8`;
        case 'slideDown':
          return `${baseClasses} ${durationClass} opacity-0 -translate-y-8`;
        default:
          return `${baseClasses} ${durationClass} opacity-0`;
      }
    }

    return `${baseClasses} ${durationClass} opacity-100`;
  };

  return (
    <div className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Компонент для анимированных списков
interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animation?: 'fadeIn' | 'slideIn' | 'scaleIn';
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 100,
  animation = 'fadeIn',
  className = '',
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedContainer
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          className="mb-2"
        >
          {child}
        </AnimatedContainer>
      ))}
    </div>
  );
};

// Компонент для hover анимаций
interface HoverAnimationProps {
  children: React.ReactNode;
  scale?: number;
  shadow?: boolean;
  className?: string;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  scale = 1.05,
  shadow = true,
  className = '',
}) => {
  return (
    <div
      className={`transition-all duration-200 ease-in-out hover:scale-${scale * 100} ${
        shadow ? 'hover:shadow-lg' : ''
      } ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
};

// Компонент для анимированных переходов между состояниями
interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'scale';
  duration?: number;
  className?: string;
}

export const Transition: React.FC<TransitionProps> = ({
  show,
  children,
  animation = 'fade',
  duration = 300,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!shouldRender) return null;

  const getAnimationClasses = () => {
    const baseClasses = `transition-all duration-${duration} ease-in-out`;
    
    if (show) {
      switch (animation) {
        case 'fade':
          return `${baseClasses} opacity-100`;
        case 'slide':
          return `${baseClasses} opacity-100 translate-y-0`;
        case 'scale':
          return `${baseClasses} opacity-100 scale-100`;
        default:
          return `${baseClasses} opacity-100`;
      }
    } else {
      switch (animation) {
        case 'fade':
          return `${baseClasses} opacity-0`;
        case 'slide':
          return `${baseClasses} opacity-0 translate-y-4`;
        case 'scale':
          return `${baseClasses} opacity-0 scale-95`;
        default:
          return `${baseClasses} opacity-0`;
      }
    }
  };

  return (
    <div className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  );
};

export default AnimatedContainer;
