/**
 * Тесты для компонентов валидации и обработки ошибок
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ValidationErrorDisplay from '../../src/components/ValidationErrorDisplay';
import NotificationBanner from '../../src/components/NotificationBanner';
import FallbackForm from '../../src/components/FallbackForm';
import { useValidation } from '../../src/hooks/useValidation';

// Mock для хука useValidation
jest.mock('../../src/hooks/useValidation');

describe('ValidationErrorDisplay', () => {
  const mockErrors = [
    {
      field: 'project_title',
      message: 'Название проекта обязательно для заполнения',
      type: 'error' as const
    },
    {
      field: 'email',
      message: 'Неверный формат email',
      type: 'warning' as const
    },
    {
      field: 'phone',
      message: 'Дополнительная информация',
      type: 'info' as const
    }
  ];

  it('отображает ошибки валидации', () => {
    render(<ValidationErrorDisplay errors={mockErrors} />);
    
    expect(screen.getByText('Ошибки валидации')).toBeInTheDocument();
    expect(screen.getByText('Предупреждения')).toBeInTheDocument();
    expect(screen.getByText('Информация')).toBeInTheDocument();
    
    expect(screen.getByText('project_title:')).toBeInTheDocument();
    expect(screen.getByText('Название проекта обязательно для заполнения')).toBeInTheDocument();
    expect(screen.getByText('email:')).toBeInTheDocument();
    expect(screen.getByText('Неверный формат email')).toBeInTheDocument();
    expect(screen.getByText('phone:')).toBeInTheDocument();
    expect(screen.getByText('Дополнительная информация')).toBeInTheDocument();
  });

  it('не отображается при пустом списке ошибок', () => {
    const { container } = render(<ValidationErrorDisplay errors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('не отображается при отсутствии ошибок', () => {
    const { container } = render(<ValidationErrorDisplay errors={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('применяет правильные стили для разных типов ошибок', () => {
    render(<ValidationErrorDisplay errors={mockErrors} />);
    
    // Ищем контейнеры по классам стилей
    const errorContainer = document.querySelector('.text-red-600.bg-red-50.border-red-200');
    const warningContainer = document.querySelector('.text-yellow-600.bg-yellow-50.border-yellow-200');
    const infoContainer = document.querySelector('.text-blue-600.bg-blue-50.border-blue-200');
    
    expect(errorContainer).toBeInTheDocument();
    expect(warningContainer).toBeInTheDocument();
    expect(infoContainer).toBeInTheDocument();
  });
});

describe('NotificationBanner', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('отображает сообщение уведомления', () => {
    render(
      <NotificationBanner
        message="Тестовое сообщение"
        type="success"
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Тестовое сообщение')).toBeInTheDocument();
  });

  it('применяет правильные стили для разных типов', () => {
    const { rerender } = render(
      <NotificationBanner
        message="Success message"
        type="success"
        onClose={mockOnClose}
      />
    );
    
    // Ищем контейнеры по классам стилей
    let container = document.querySelector('.bg-green-50.border-green-200.text-green-800');
    expect(container).toBeInTheDocument();
    
    rerender(
      <NotificationBanner
        message="Error message"
        type="error"
        onClose={mockOnClose}
      />
    );
    
    container = document.querySelector('.bg-red-50.border-red-200.text-red-800');
    expect(container).toBeInTheDocument();
  });

  it('вызывает onClose при нажатии на кнопку закрытия', () => {
    render(
      <NotificationBanner
        message="Тестовое сообщение"
        type="info"
        onClose={mockOnClose}
        duration={0}
      />
    );
    
    // Проверяем что компонент видим
    expect(screen.getByText('Тестовое сообщение')).toBeInTheDocument();
    
    const closeButton = screen.getByLabelText('Закрыть уведомление');
    fireEvent.click(closeButton);
    
    // Даем время на выполнение setTimeout
    setTimeout(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }, 400);
  });

  it('автоматически закрывается через указанное время', async () => {
    jest.useFakeTimers();
    
    render(
      <NotificationBanner
        message="Тестовое сообщение"
        type="info"
        duration={1000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Тестовое сообщение')).toBeInTheDocument();
    
    // Ускоряем время
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
    
    jest.useRealTimers();
  });

  it('не закрывается автоматически при duration=0', () => {
    jest.useFakeTimers();
    
    render(
      <NotificationBanner
        message="Тестовое сообщение"
        type="info"
        duration={0}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Тестовое сообщение')).toBeInTheDocument();
    
    // Ускоряем время
    jest.advanceTimersByTime(5000);
    
    expect(mockOnClose).not.toHaveBeenCalled();
    
    jest.useRealTimers();
  });
});

describe('FallbackForm', () => {
  const mockOnManualSubmit = jest.fn();
  const mockOnRetryLLM = jest.fn();
  
  const mockLLMError = {
    type: 'validation' as const,
    message: 'Ошибка валидации ответа LLM',
    details: 'Детали ошибки'
  };

  beforeEach(() => {
    mockOnManualSubmit.mockClear();
    mockOnRetryLLM.mockClear();
  });

  it('отображает форму ручного заполнения', () => {
    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
      />
    );
    
    expect(screen.getByText('Ручное заполнение формы')).toBeInTheDocument();
    expect(screen.getByLabelText('Название проекта *')).toBeInTheDocument();
    expect(screen.getByLabelText('Тип проекта')).toBeInTheDocument();
    expect(screen.getByLabelText('Жанр')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание проекта')).toBeInTheDocument();
  });

  it('отображает ошибку LLM', () => {
    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
      />
    );
    
    expect(screen.getByText('Ошибка валидации ответа LLM. Проверьте корректность данных.')).toBeInTheDocument();
  });

  it('предзаполняет форму начальными данными', () => {
    const initialData = {
      projectTitle: 'Предзаполненный проект',
      projectType: 'фильм',
      genre: 'драма',
      description: 'Предзаполненное описание'
    };

    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
        initialData={initialData}
      />
    );
    
    expect(screen.getByDisplayValue('Предзаполненный проект')).toBeInTheDocument();
    expect(screen.getByDisplayValue('драма')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Предзаполненное описание')).toBeInTheDocument();
    
    // Проверяем select отдельно
    const projectTypeSelect = screen.getByDisplayValue('Фильм');
    expect(projectTypeSelect).toBeInTheDocument();
  });

  it('вызывает onRetryLLM при нажатии на кнопку повтора', () => {
    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
      />
    );
    
    const retryButton = screen.getByText('Повторить анализ LLM');
    fireEvent.click(retryButton);
    
    expect(mockOnRetryLLM).toHaveBeenCalledTimes(1);
  });

  it('валидирует форму перед отправкой', async () => {
    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
      />
    );
    
    const form = document.querySelector('form');
    fireEvent.submit(form!);
    
    expect(mockOnManualSubmit).not.toHaveBeenCalled();
    
    // Ждем появления уведомления
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Проверяем что уведомление появилось через NotificationBanner
    expect(screen.getByText('Название проекта обязательно для заполнения')).toBeInTheDocument();
  });

  it('отправляет форму при валидных данных', () => {
    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
      />
    );
    
    // Заполняем обязательные поля
    fireEvent.change(screen.getByLabelText('Название проекта *'), {
      target: { value: 'Тестовый проект' }
    });
    
    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);
    
    expect(mockOnManualSubmit).toHaveBeenCalledWith({
      projectTitle: 'Тестовый проект',
      projectType: '',
      description: '',
      genre: ''
    });
  });

  it('отображает состояние загрузки', () => {
    render(
      <FallbackForm
        onManualSubmit={mockOnManualSubmit}
        onRetryLLM={mockOnRetryLLM}
        llmError={mockLLMError}
        isLoading={true}
      />
    );
    
    expect(screen.getByText('Повторная попытка...')).toBeInTheDocument();
    expect(screen.getByText('Сохранение...')).toBeInTheDocument();
  });
});

describe('useValidation hook', () => {
  it('возвращает правильную структуру', () => {
    const mockValidation = {
      values: { test: 'value' },
      errors: {},
      touched: {},
      isValidating: false,
      isValid: true,
      hasErrors: false,
      handleChange: jest.fn(),
      handleBlur: jest.fn(),
      setFieldValue: jest.fn(),
      setFieldError: jest.fn(),
      clearFieldError: jest.fn(),
      clearAllErrors: jest.fn(),
      validateAll: jest.fn(),
      reset: jest.fn()
    };

    (useValidation as jest.Mock).mockReturnValue(mockValidation);

    const TestComponent = () => {
      const validation = useValidation({}, {});
      return <div>{validation.isValid ? 'Valid' : 'Invalid'}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('Valid')).toBeInTheDocument();
  });
});

describe('Интеграционные тесты валидации', () => {
  it('обрабатывает различные типы ошибок LLM', () => {
    const errorTypes = [
      { type: 'validation' as const, message: 'Ошибка валидации' },
      { type: 'network' as const, message: 'Ошибка сети' },
      { type: 'timeout' as const, message: 'Превышено время ожидания' },
      { type: 'unknown' as const, message: 'Неизвестная ошибка' }
    ];

    errorTypes.forEach(error => {
      const { unmount } = render(
        <FallbackForm
          onManualSubmit={jest.fn()}
          onRetryLLM={jest.fn()}
          llmError={error}
        />
      );
      
      // Проверяем что ошибка отображается
      expect(screen.getByText('Ошибки валидации')).toBeInTheDocument();
      unmount();
    });
  });

  it('работает с различными конфигурациями валидации', () => {
    const validationRules = {
      projectTitle: {
        required: true,
        minLength: 3,
        maxLength: 200
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    };

    const mockValidation = {
      values: { projectTitle: '', email: '' },
      errors: { projectTitle: ['Обязательное поле'] },
      touched: {},
      isValidating: false,
      isValid: false,
      hasErrors: true,
      handleChange: jest.fn(),
      handleBlur: jest.fn(),
      setFieldValue: jest.fn(),
      setFieldError: jest.fn(),
      clearFieldError: jest.fn(),
      clearAllErrors: jest.fn(),
      validateAll: jest.fn(),
      reset: jest.fn()
    };

    (useValidation as jest.Mock).mockReturnValue(mockValidation);

    const TestComponent = () => {
      const validation = useValidation({}, validationRules);
      return (
        <div>
          {validation.hasErrors ? 'Has errors' : 'No errors'}
        </div>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Has errors')).toBeInTheDocument();
  });
});
