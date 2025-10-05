import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanySelectionComponent from '../components/matching/companies/CompanySelectionComponent';
import { companiesService } from '../services/companies';

// Mock the companies service
jest.mock('../services/companies', () => ({
  companiesService: {
    searchCompanyMatches: jest.fn(),
    getCompany: jest.fn(),
    getCompanyTypes: jest.fn(),
  },
}));

const mockCompaniesService = companiesService as jest.Mocked<typeof companiesService>;

describe('CompanySelectionComponent', () => {
  const defaultProps = {
    selectedCompanyId: null,
    onSelectionChange: jest.fn(),
    placeholder: 'Поиск компаний...',
    className: '',
  };

  const mockCompanyMatch = {
    id: 1,
    name: 'Мосфильм',
    company_type: 'production' as const,
    company_type_display: 'Производство',
    description: 'Киностудия Мосфильм',
    logo: undefined,
    website: 'mosfilm.ru',
    email: 'info@mosfilm.ru',
    phone: '+7-495-123-45-67',
    address: 'Москва, ул. Мосфильмовская, 1',
    founded_year: 1924,
    score: 0.95,
    confidence: 'high' as const,
    matched_fields: ['name'],
    field_scores: { name: 0.95 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCompaniesService.getCompanyTypes.mockResolvedValue([
      { value: 'production', label: 'Производство' },
      { value: 'distribution', label: 'Дистрибуция' },
      { value: 'post_production', label: 'Пост-продакшн' },
    ]);
  });

  it('renders correctly', () => {
    render(<CompanySelectionComponent {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Поиск компаний...')).toBeInTheDocument();
    expect(screen.getByText('Все типы')).toBeInTheDocument();
  });

  it('displays search input and type selector', () => {
    render(<CompanySelectionComponent {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Все типы')).toBeInTheDocument();
  });

  it('shows loading state during search', async () => {
    mockCompaniesService.searchCompanyMatches.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<CompanySelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Мосфильм' } });

    await waitFor(() => {
      // Проверяем наличие спиннера загрузки
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    mockCompaniesService.searchCompanyMatches.mockResolvedValue([mockCompanyMatch]);

    render(<CompanySelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Мосфильм' } });

    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
      expect(screen.getByText('high (0.95)')).toBeInTheDocument();
    });
  });

  it('handles company selection', async () => {
    mockCompaniesService.searchCompanyMatches.mockResolvedValue([mockCompanyMatch]);

    render(<CompanySelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Мосфильм' } });

    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Мосфильм'));

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(1);
  });

  it('handles company deselection', async () => {
    const mockCompany = { 
      ...mockCompanyMatch,
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };
    delete (mockCompany as any).score;
    delete (mockCompany as any).confidence;
    delete (mockCompany as any).matched_fields;
    delete (mockCompany as any).field_scores;
    mockCompaniesService.getCompany.mockResolvedValue(mockCompany);

    render(
      <CompanySelectionComponent 
        {...defaultProps} 
        selectedCompanyId={1} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('×'));

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('shows selected company', async () => {
    const mockCompany = { 
      ...mockCompanyMatch,
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };
    delete (mockCompany as any).score;
    delete (mockCompany as any).confidence;
    delete (mockCompany as any).matched_fields;
    delete (mockCompany as any).field_scores;
    mockCompaniesService.getCompany.mockResolvedValue(mockCompany);

    render(
      <CompanySelectionComponent 
        {...defaultProps} 
        selectedCompanyId={1} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
    });
  });

  it('handles company type filter change', async () => {
    render(<CompanySelectionComponent {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Производство')).toBeInTheDocument();
    });
    
    const typeSelector = screen.getByDisplayValue('Все типы');
    fireEvent.change(typeSelector, { target: { value: 'production' } });

    expect(screen.getByDisplayValue('Производство')).toBeInTheDocument();
  });

  it('shows empty state when no matches found', async () => {
    mockCompaniesService.searchCompanyMatches.mockResolvedValue([]);

    render(<CompanySelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Несуществующая' } });

    await waitFor(() => {
      expect(screen.getByText('Компании не найдены')).toBeInTheDocument();
    });
  });

  it('handles search error', async () => {
    mockCompaniesService.searchCompanyMatches.mockRejectedValue(new Error('Search failed'));

    render(<CompanySelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Мосфильм' } });

    await waitFor(() => {
      expect(screen.getByText('Компании не найдены')).toBeInTheDocument();
    });
  });
});
