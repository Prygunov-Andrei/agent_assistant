import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PersonSelectionComponent } from '../PersonSelectionComponent';
import type { PersonMatchingResult } from '../../../../types/matching';

// Mock MatchingService
jest.mock('../../../../services/matching', () => ({
  MatchingService: {
    searchPersons: jest.fn(),
  },
}));

const mockSearchResults: PersonMatchingResult[] = [
  {
    id: 1,
    name: 'Иван Петров',
    type: 'director',
    email: 'ivan@example.com',
    phone: '+7-123-456-78-90',
    confidence: 0.95,
    match_type: 'exact',
    matched_fields: ['name'],
  },
  {
    id: 2,
    name: 'Петр Иванов',
    type: 'director',
    email: 'petr@example.com',
    confidence: 0.8,
    match_type: 'high',
    matched_fields: ['name'],
  },
  {
    id: 3,
    name: 'Сидор Сидоров',
    type: 'director',
    email: 'sidor@example.com',
    confidence: 0.6,
    match_type: 'medium',
    matched_fields: ['name'],
  },
];

describe('PersonSelectionComponent', () => {
  const mockOnSelect = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct title for director', () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Выбор Режиссер')).toBeInTheDocument();
  });

  it('renders with correct title for producer', () => {
    render(
      <PersonSelectionComponent
        type="producer"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Выбор Продюсер')).toBeInTheDocument();
  });

  it('renders with correct title for casting_director', () => {
    render(
      <PersonSelectionComponent
        type="casting_director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Выбор Кастинг-директор')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByPlaceholderText('Введите имя, email или телефон...')).toBeInTheDocument();
  });

  it('shows initial message when no search query', () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Введите поисковый запрос для поиска режиссеров')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when searching', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });
  });

  it('shows search results', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
      expect(screen.getByText('Петр Иванов')).toBeInTheDocument();
      expect(screen.getByText('Сидор Сидоров')).toBeInTheDocument();
    });
  });

  it('shows confidence indicators', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Точное совпадение')).toBeInTheDocument();
      expect(screen.getByText('Высокое совпадение')).toBeInTheDocument();
      expect(screen.getByText('Среднее совпадение')).toBeInTheDocument();
    });
  });

  it('shows confidence percentages', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('shows person details', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Email: ivan@example.com')).toBeInTheDocument();
      expect(screen.getByText('Телефон: +7-123-456-78-90')).toBeInTheDocument();
    });
  });

  it('calls onSelect when person is clicked', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Иван' } });

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    const personCard = screen.getByText('Иван Петров').closest('div');
    fireEvent.click(personCard!);

    expect(mockOnSelect).toHaveBeenCalledWith(mockSearchResults[0]);
  });

  it('shows no results message when no matches found', async () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Введите имя, email или телефон...');
    fireEvent.change(searchInput, { target: { value: 'Несуществующий' } });

    await waitFor(() => {
      expect(screen.getByText('Персоны не найдены')).toBeInTheDocument();
      expect(screen.getByText('Попробуйте изменить поисковый запрос')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(
      <PersonSelectionComponent
        type="director"
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
        className="custom-class"
      />
    );

    const component = screen.getByText('Выбор Режиссер').closest('div')?.parentElement;
    expect(component).toHaveClass('custom-class');
  });
});
