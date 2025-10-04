import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectSelectionComponent from '../components/matching/projects/ProjectSelectionComponent';
import { projectsService } from '../services/projects';

// Mock the projects service
jest.mock('../services/projects', () => ({
  projectsService: {
    searchProjectMatches: jest.fn(),
    getProject: jest.fn(),
    getProjectStatuses: jest.fn(),
  },
}));

const mockProjectsService = projectsService as jest.Mocked<typeof projectsService>;

describe('ProjectSelectionComponent', () => {
  const defaultProps = {
    selectedProjectId: null,
    onSelectionChange: jest.fn(),
    placeholder: 'Поиск проектов...',
    className: '',
  };

  const mockProjectMatch = {
    id: 1,
    title: 'Война и мир',
    project_type: 'Фильм',
    status: 'draft' as const,
    status_display: 'Черновик',
    description: 'Экранизация романа Льва Толстого',
    genre: 'Драма',
    premiere_date: '2024-12-01',
    director: {
      id: 1,
      full_name: 'Иван Петров',
    },
    production_company: {
      id: 1,
      name: 'Мосфильм',
    },
    created_at: '2024-01-01T00:00:00Z',
    score: 0.92,
    confidence: 'high' as const,
    matched_fields: ['title'],
    field_scores: { title: 0.92 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectsService.getProjectStatuses.mockResolvedValue([
      { value: 'draft', label: 'Черновик' },
      { value: 'active', label: 'Активный' },
      { value: 'completed', label: 'Завершен' },
    ]);
  });

  it('renders correctly', () => {
    render(<ProjectSelectionComponent {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Поиск проектов...')).toBeInTheDocument();
    expect(screen.getByText('Все статусы')).toBeInTheDocument();
  });

  it('displays search input and status selector', () => {
    render(<ProjectSelectionComponent {...defaultProps} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Все статусы')).toBeInTheDocument();
  });

  it('shows loading state during search', async () => {
    mockProjectsService.searchProjectMatches.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ProjectSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Война' } });

    await waitFor(() => {
      expect(screen.getByText('Поиск...')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    mockProjectsService.searchProjectMatches.mockResolvedValue([mockProjectMatch]);

    render(<ProjectSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Война' } });

    await waitFor(() => {
      expect(screen.getByText('Война и мир')).toBeInTheDocument();
      expect(screen.getByText('high (0.92)')).toBeInTheDocument();
    });
  });

  it('handles project selection', async () => {
    mockProjectsService.searchProjectMatches.mockResolvedValue([mockProjectMatch]);

    render(<ProjectSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Война' } });

    await waitFor(() => {
      expect(screen.getByText('Война и мир')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Война и мир'));

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(1);
  });

  it('handles project deselection', async () => {
    const mockProject = { 
      ...mockProjectMatch,
      project_type: 1, // Convert back to number for Project type
      genre: 'Драма', // Convert back to number for Project type
      created_by: 1,
      updated_at: '2024-01-01T00:00:00Z'
    };
    delete (mockProject as any).score;
    delete (mockProject as any).confidence;
    delete (mockProject as any).matched_fields;
    delete (mockProject as any).field_scores;
    delete (mockProject as any).project_type;
    delete (mockProject as any).genre;
    mockProjectsService.getProject.mockResolvedValue(mockProject as any);

    render(
      <ProjectSelectionComponent 
        {...defaultProps} 
        selectedProjectId={1} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Война и мир')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('×'));

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(null);
  });

  it('shows selected project', async () => {
    const mockProject = { 
      ...mockProjectMatch,
      project_type: 1, // Convert back to number for Project type
      genre: 'Драма', // Convert back to number for Project type
      created_by: 1,
      updated_at: '2024-01-01T00:00:00Z'
    };
    delete (mockProject as any).score;
    delete (mockProject as any).confidence;
    delete (mockProject as any).matched_fields;
    delete (mockProject as any).field_scores;
    delete (mockProject as any).project_type;
    delete (mockProject as any).genre;
    mockProjectsService.getProject.mockResolvedValue(mockProject as any);

    render(
      <ProjectSelectionComponent 
        {...defaultProps} 
        selectedProjectId={1} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Война и мир')).toBeInTheDocument();
    });
  });

  it('handles project status filter change', async () => {
    render(<ProjectSelectionComponent {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Черновик')).toBeInTheDocument();
    });
    
    const statusSelector = screen.getByDisplayValue('Все статусы');
    fireEvent.change(statusSelector, { target: { value: 'draft' } });

    expect(screen.getByDisplayValue('Черновик')).toBeInTheDocument();
  });

  it('shows empty state when no matches found', async () => {
    mockProjectsService.searchProjectMatches.mockResolvedValue([]);

    render(<ProjectSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Несуществующий' } });

    await waitFor(() => {
      expect(screen.getByText('Проекты не найдены')).toBeInTheDocument();
    });
  });

  it('handles search error', async () => {
    mockProjectsService.searchProjectMatches.mockRejectedValue(new Error('Search failed'));

    render(<ProjectSelectionComponent {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Война' } });

    await waitFor(() => {
      expect(screen.getByText('Ошибка при поиске проектов.')).toBeInTheDocument();
    });
  });
});
