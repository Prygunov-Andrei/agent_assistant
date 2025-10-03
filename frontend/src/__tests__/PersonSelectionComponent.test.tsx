import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonSelectionComponent from '../components/people/PersonSelectionComponent';
import { peopleService } from '../services/people';

// Mock the people service
jest.mock('../services/people', () => ({
  peopleService: {
    searchPersonsByName: jest.fn(),
    searchPersonMatches: jest.fn(),
    getPerson: jest.fn(),
    getPersonTypes: jest.fn(),
  },
}));

const mockPeopleService = peopleService as jest.Mocked<typeof peopleService>;

describe('PersonSelectionComponent', () => {
  const defaultProps = {
    selectedPersonId: null,
    onSelectionChange: jest.fn(),
    placeholder: 'Поиск персон...',
    personType: '' as const,
    className: '',
  };

  const mockPersonMatch = {
    id: 1,
    person_type: 'director' as const,
    person_type_display: 'Режиссер',
    first_name: 'Иван',
    last_name: 'Петров',
    middle_name: 'Сергеевич',
    full_name: 'Петров Иван Сергеевич',
    short_name: 'Петров И.С.',
    photo: undefined,
    bio: undefined,
    birth_date: undefined,
    nationality: 'Русский',
    phone: '+7-999-123-45-67',
    email: 'ivan.petrov@example.com',
    website: undefined,
    telegram_username: 'ivan_petrov',
    kinopoisk_url: undefined,
    social_media: undefined,
    awards: undefined,
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    score: 0.95,
    confidence: 'high' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPeopleService.getPersonTypes.mockResolvedValue([
      { value: 'director', label: 'Режиссер' },
      { value: 'producer', label: 'Продюсер' },
      { value: 'casting_director', label: 'Кастинг-директор' },
    ]);
  });

  it('renders correctly', () => {
    render(<PersonSelectionComponent {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Поиск персон...')).toBeInTheDocument();
    expect(screen.getByText('Все типы')).toBeInTheDocument();
  });

  it('displays search input and type selector', () => {
    render(<PersonSelectionComponent {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Все типы')).toBeInTheDocument();
  });

  it('shows loading state during search', async () => {
    mockPeopleService.searchPersonsByName.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Поиск...')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    mockPeopleService.searchPersonsByName.mockResolvedValue([mockPersonMatch]);

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
      expect(screen.getByText('high (0.95)')).toBeInTheDocument();
    });
  });

  it('handles person selection', async () => {
    mockPeopleService.searchPersonsByName.mockResolvedValue([mockPersonMatch]);

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Петров Иван Сергеевич'));

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(1);
  });

  it('handles person deselection', async () => {
    const mockPerson = { ...mockPersonMatch };
    delete (mockPerson as any).score;
    delete (mockPerson as any).confidence;
    mockPeopleService.getPerson.mockResolvedValue(mockPerson);

    render(
      <PersonSelectionComponent 
        {...defaultProps} 
        selectedPersonId={1} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('×'));

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('shows selected person', async () => {
    const mockPerson = { ...mockPersonMatch };
    delete (mockPerson as any).score;
    delete (mockPerson as any).confidence;
    mockPeopleService.getPerson.mockResolvedValue(mockPerson);

    render(
      <PersonSelectionComponent 
        {...defaultProps} 
        selectedPersonId={1} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    });
  });

  it('handles person type filter change', async () => {
    render(<PersonSelectionComponent {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Режиссер')).toBeInTheDocument();
    });
    
    const typeSelector = screen.getByDisplayValue('Все типы');
    fireEvent.change(typeSelector, { target: { value: 'director' } });

    expect(screen.getByDisplayValue('Режиссер')).toBeInTheDocument();
  });

  it('shows empty state when no matches found', async () => {
    mockPeopleService.searchPersonsByName.mockResolvedValue([]);

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Несуществующий' } });

    await waitFor(() => {
      expect(screen.queryByText('Найденные совпадения:')).not.toBeInTheDocument();
    });
  });

  it('handles search error', async () => {
    mockPeopleService.searchPersonsByName.mockRejectedValue(new Error('Search failed'));

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Ошибка при поиске персон.')).toBeInTheDocument();
    });
  });

});
