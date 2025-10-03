import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatchingSuggestions from '../components/people/MatchingSuggestions';
import type { PersonMatch } from '../types/people';

const mockPersonMatch: PersonMatch = {
  id: 1,
  person_type: 'director',
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
  confidence: 'high',
};

const defaultProps = {
  matches: [],
  onSelect: jest.fn(),
};

describe('MatchingSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with empty matches', () => {
    render(<MatchingSuggestions {...defaultProps} />);
    expect(screen.queryByText('Найденные совпадения:')).not.toBeInTheDocument();
  });


  it('displays matches with high confidence', () => {
    const matches = [{ ...mockPersonMatch, confidence: 'high' as const }];
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} />);
    
    expect(screen.getByText('Найденные совпадения:')).toBeInTheDocument();
    expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    expect(screen.getByText('high (0.95)')).toBeInTheDocument();
  });

  it('displays matches with medium confidence', () => {
    const matches = [{ ...mockPersonMatch, confidence: 'medium' as const, score: 0.75 }];
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} />);
    
    expect(screen.getByText('medium (0.75)')).toBeInTheDocument();
  });

  it('displays matches with low confidence', () => {
    const matches = [{ ...mockPersonMatch, confidence: 'low' as const, score: 0.45 }];
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} />);
    
    expect(screen.getByText('low (0.45)')).toBeInTheDocument();
  });

  it('shows person contact information', () => {
    const matches = [mockPersonMatch];
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} />);
    
    expect(screen.getByText('ivan.petrov@example.com')).toBeInTheDocument();
    expect(screen.getByText('+7-999-123-45-67')).toBeInTheDocument();
  });

  it('handles person selection', () => {
    const matches = [mockPersonMatch];
    const onSelect = jest.fn();
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Петров Иван Сергеевич'));
    
    expect(onSelect).toHaveBeenCalledWith(mockPersonMatch.id);
  });


  it('displays multiple matches', () => {
    const matches = [
      mockPersonMatch,
      { ...mockPersonMatch, id: 2, full_name: 'Сидоров Петр Иванович', score: 0.8, confidence: 'medium' as const }
    ];
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} />);
    
    expect(screen.getByText('Найденные совпадения:')).toBeInTheDocument();
    expect(screen.getByText('Петров Иван Сергеевич')).toBeInTheDocument();
    expect(screen.getByText('Сидоров Петр Иванович')).toBeInTheDocument();
  });

  it('applies correct styling for different confidence levels', () => {
    const highConfidenceMatch = { ...mockPersonMatch, confidence: 'high' as const, score: 0.95 };
    const mediumConfidenceMatch = { ...mockPersonMatch, id: 2, confidence: 'medium' as const, score: 0.75 };
    const lowConfidenceMatch = { ...mockPersonMatch, id: 3, confidence: 'low' as const, score: 0.45 };
    
    const matches = [highConfidenceMatch, mediumConfidenceMatch, lowConfidenceMatch];
    
    render(<MatchingSuggestions {...defaultProps} matches={matches} />);
    
    // Check that different confidence levels have different text colors
    expect(screen.getByText('high (0.95)')).toHaveClass('text-green-600');
    expect(screen.getByText('medium (0.75)')).toHaveClass('text-yellow-600');
    expect(screen.getByText('low (0.45)')).toHaveClass('text-red-600');
  });
});
