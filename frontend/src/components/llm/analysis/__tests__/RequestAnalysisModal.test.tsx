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
  project_analysis: {
    project_title: 'Тестовый проект',
    project_type: 'Фильм',
    project_type_raw: 'Фильм',
    genre: 'Драма',
    description: 'Описание проекта',
    premiere_date: '2024-12-31',
    roles: [],
    contacts: {
      casting_director: {
        name: '',
        phone: '',
        email: '',
        telegram: ''
      },
      director: {
        name: '',
        phone: '',
        email: '',
        telegram: ''
      },
      producers: [],
      production_company: {
        name: '',
        phone: '',
        email: '',
        website: ''
      }
    },
    confidence: 0.8
  }
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
      expect(screen.getByText('Описание проекта')).toBeInTheDocument();
    }, { timeout: 3000 });
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
      expect(screen.getByText('Результаты анализа:')).toBeInTheDocument();
      expect(screen.getByText('Тип проекта:')).toBeInTheDocument();
      expect(screen.getByText('Жанр:')).toBeInTheDocument();
      expect(screen.getByText('Описание:')).toBeInTheDocument();
    }, { timeout: 3000 });
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
    }, { timeout: 3000 });

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
    }, { timeout: 3000 });

    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
