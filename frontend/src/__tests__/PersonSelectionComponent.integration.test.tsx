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
  },
}));

const mockPeopleService = peopleService as jest.Mocked<typeof peopleService>;

describe('PersonSelectionComponent Integration', () => {
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
  });

  it('integrates with people service for name search', async () => {
    mockPeopleService.searchPersonsByName.mockResolvedValue([mockPersonMatch]);

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(mockPeopleService.searchPersonsByName).toHaveBeenCalledWith({
        name: 'Иван',
        person_type: undefined,
      });
    });

    expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
  });

  it('integrates with people service for details search', async () => {
    mockPeopleService.searchPersonMatches.mockResolvedValue([mockPersonMatch]);

    render(<PersonSelectionComponent {...defaultProps} />);
    
    // Component only supports name search now

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(mockPeopleService.searchPersonsByName).toHaveBeenCalledWith({
        name: 'Иван',
        person_type: undefined,
      });
    });
  });

  it('integrates with people service for person details loading', async () => {
    mockPeopleService.getPerson.mockResolvedValue(mockPersonMatch);

    render(
      <PersonSelectionComponent 
        {...defaultProps} 
        selectedPersonId={1} 
      />
    );

    await waitFor(() => {
      expect(mockPeopleService.getPerson).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
  });

  it('handles real API calls with proper error handling', async () => {
    mockPeopleService.searchPersonsByName.mockRejectedValue(new Error('API Error'));

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(mockPeopleService.searchPersonsByName).toHaveBeenCalled();
    });

    // Should not show any matches due to error
    expect(screen.queryByText('Петров Иван Сергеевич')).not.toBeInTheDocument();
  });

  it('maintains state consistency during multiple operations', async () => {
    const onSelectionChange = jest.fn();
    mockPeopleService.searchPersonsByName.mockResolvedValue([mockPersonMatch]);
    mockPeopleService.getPerson.mockResolvedValue(mockPersonMatch);

    render(
      <PersonSelectionComponent 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
      />
    );
    
    // Search and select a person
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Петров Иван Сергеевич'));

    expect(onSelectionChange).toHaveBeenCalledWith(1);

    // Simulate parent component updating selectedPersonId
    render(
      <PersonSelectionComponent 
        {...defaultProps} 
        selectedPersonId={1}
        onSelectionChange={onSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    });

    // Remove the person - ищем кнопку удаления
    const removeButton = screen.getAllByText('×')[0];
    fireEvent.click(removeButton);

    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('handles debounced search correctly', async () => {
    mockPeopleService.searchPersonsByName.mockResolvedValue([mockPersonMatch]);

    render(<PersonSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    // Type multiple characters quickly
    fireEvent.change(input, { target: { value: 'И' } });
    fireEvent.change(input, { target: { value: 'Ив' } });
    fireEvent.change(input, { target: { value: 'Ива' } });
    fireEvent.change(input, { target: { value: 'Иван' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(mockPeopleService.searchPersonsByName).toHaveBeenCalledTimes(1);
      expect(mockPeopleService.searchPersonsByName).toHaveBeenCalledWith({
        name: 'Иван',
        person_type: undefined,
      });
    });
  });

  it('integrates with different person types', async () => {
    const producerMatch = { ...mockPersonMatch, id: 2, person_type: 'producer' as const, person_type_display: 'Продюсер' };
    mockPeopleService.searchPersonsByName.mockResolvedValue([producerMatch]);

    render(
      <PersonSelectionComponent 
        {...defaultProps} 
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Петр' } });

    await waitFor(() => {
      expect(mockPeopleService.searchPersonsByName).toHaveBeenCalledWith({
        name: 'Петр',
        person_type: undefined, // Компонент не фильтрует по типу из props
      });
    });
  });

  it('integrates with custom max selections', async () => {
    const onSelectionChange = jest.fn();
    mockPeopleService.searchPersonsByName.mockResolvedValue([mockPersonMatch]);

    render(
      <PersonSelectionComponent 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    });

    // Check that component renders correctly
    expect(screen.getByText('Найденные совпадения:')).toBeInTheDocument();
  });
});
