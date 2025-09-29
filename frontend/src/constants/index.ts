// Цвета
export const COLORS = {
  primary: '#3182ce',
  primaryHover: '#2c5aa0',
  secondary: '#e2e8f0',
  secondaryHover: '#cbd5e0',
  danger: '#e53e3e',
  dangerHover: '#c53030',
  success: '#38a169',
  warning: '#dd6b20',
  purple: '#805ad5',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  text: {
    primary: '#1a202c',
    secondary: '#4a5568',
    muted: '#718096',
  },
  background: '#f8fafc',
  white: '#ffffff',
} as const;

// Размеры
export const SIZES = {
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  icon: {
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
  },
} as const;

// Z-index слои
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const;

// Breakpoints для responsive дизайна
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Анимации
export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
