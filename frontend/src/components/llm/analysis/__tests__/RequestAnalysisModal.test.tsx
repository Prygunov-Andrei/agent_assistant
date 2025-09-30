import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RequestAnalysisModal } from '../RequestAnalysisModal';
import type { LLMAnalysisResult } from '../../../../types/llm';

// Mock LLMService
jest.mock('../../../../services/llm', () => ({
  LLMService: {
    analyzeRequest: jest.fn(),
  },
}));

const mockAnalysisResult: LLMAnalysisResult = {
  project_type: 'Фильм',
  project_type_raw: 'художественный фильм',
  genre: 'Драма',
  description: 'Драматическая история о...',
  roles: [
    {
      title: 'Главный герой',
      description: 'Молодой человек 25-30 лет',
      gender: 'male',
      age_range: { min: 25, max: 30 },
      skills_required: ['Актерское мастерство', 'Драма'],
      suggested_artists: [1, 2, 3],
    },
  ],
  suggested_persons: [
    {
      name: 'Иван Петров',
      type: 'director',
      email: 'ivan@example.com',
      confidence: 0.9,
    },
  ],
  suggested_companies: [
    {
      name: 'Кинокомпания "Студия"',
      type: 'production',
      confidence: 0.8,
    },
  ],
  suggested_projects: [],
};

describe('RequestAnalysisModal', () => {
  const mockOnClose = jest.fn();
  const mockOnAnalysisComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    expect(screen.getByText('Анализ запроса #1')).toBeInTheDocument();
    expect(screen.getByText('Тестовый запрос')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <RequestAnalysisModal
        isOpen={false}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    expect(screen.queryByText('Анализ запроса #1')).not.toBeInTheDocument();
  });

  it('shows analyze button initially', () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    expect(screen.getByText('Анализировать')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when analyzing', async () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    const analyzeButton = screen.getByText('Анализировать');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Анализ запроса в процессе...')).toBeInTheDocument();
    });
  });

  it('shows analysis results after completion', async () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    const analyzeButton = screen.getByText('Анализировать');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Результаты анализа:')).toBeInTheDocument();
      expect(screen.getByText('Фильм')).toBeInTheDocument();
      expect(screen.getByText('Драма')).toBeInTheDocument();
      expect(screen.getByText('Драматическая история о...')).toBeInTheDocument();
    });
  });

  it('shows roles in analysis results', async () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    const analyzeButton = screen.getByText('Анализировать');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Роли:')).toBeInTheDocument();
      expect(screen.getByText('Главный герой')).toBeInTheDocument();
      expect(screen.getByText('Молодой человек 25-30 лет')).toBeInTheDocument();
      expect(screen.getByText('Навыки: Актерское мастерство, Драма')).toBeInTheDocument();
    });
  });

  it('applies analysis result when apply button is clicked', async () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    const analyzeButton = screen.getByText('Анализировать');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Применить анализ')).toBeInTheDocument();
    });

    const applyButton = screen.getByText('Применить анализ');
    fireEvent.click(applyButton);

    expect(mockOnAnalysisComplete).toHaveBeenCalledWith(mockAnalysisResult);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows cancel button in analysis results', async () => {
    render(
      <RequestAnalysisModal
        isOpen={true}
        onClose={mockOnClose}
        requestId={1}
        requestText="Тестовый запрос"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    const analyzeButton = screen.getByText('Анализировать');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Отмена')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
