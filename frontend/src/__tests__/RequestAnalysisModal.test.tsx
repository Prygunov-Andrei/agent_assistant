import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RequestAnalysisModal from '../components/analysis/RequestAnalysisModal';
import { requestsService } from '../services/requests';

// Мокаем сервис запросов
jest.mock('../services/requests', () => ({
  requestsService: {
    analyzeRequest: jest.fn(),
  },
}));

describe('RequestAnalysisModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<RequestAnalysisModal {...defaultProps} />);
    
    expect(screen.getByText('Анализ запроса')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<RequestAnalysisModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Анализ запроса')).not.toBeInTheDocument();
  });

  it('displays request text when provided', () => {
    const requestText = 'Тестовый текст запроса для анализа';
    render(<RequestAnalysisModal {...defaultProps} requestText={requestText} />);
    
    expect(screen.getByText(requestText)).toBeInTheDocument();
  });

  it('displays request ID when provided', () => {
    const requestId = 456;
    render(<RequestAnalysisModal {...defaultProps} requestId={requestId} />);
    
    expect(screen.getByText(/Анализ запроса.*#456/)).toBeInTheDocument();
  });

  it('shows analyze button initially', () => {
    render(<RequestAnalysisModal {...defaultProps} />);
    
    expect(screen.getByText('Начать анализ')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<RequestAnalysisModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Закрыть');
    closeButton.click();
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when analyzing', async () => {
    render(<RequestAnalysisModal {...defaultProps} requestId={1} />);
    
    const analyzeButton = screen.getByText('Начать анализ');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Анализируем запрос...')).toBeInTheDocument();
    });
  });

  it('shows analysis result after completion', async () => {
    // Мокаем успешный ответ от API
    const mockAnalysisResult = {
      data: {
        project_analysis: {
          project_title: 'Комедийный фильм про друзей',
          description: 'Фильм о дружбе и приключениях двух друзей',
          project_type: 'film',
          genre: 'comedy',
          premiere_date: '2025-06-15',
          confidence: 0.85,
          roles: [
            {
              role_type: 'main',
              character_name: 'Главный герой',
              description: 'Молодой человек 25-30 лет',
              age_range: '25-30',
              gender: 'male',
              skills_required: {
                acting_skills: ['Актерское мастерство', 'Чувство юмора'],
                physical_skills: [],
                languages: ['Русский'],
                special_requirements: []
              },
              suggested_artists: []
            }
          ],
          contacts: {
            casting_director: null,
            director: null,
            producers: [],
            production_company: null
          }
        }
      }
    };
    
    (requestsService.analyzeRequest as jest.Mock).mockResolvedValue(mockAnalysisResult);
    
    render(<RequestAnalysisModal {...defaultProps} requestId={1} />);
    
    const analyzeButton = screen.getByText('Начать анализ');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Комедийный фильм про друзей')).toBeInTheDocument();
      expect(screen.getByText('Главный герой')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});