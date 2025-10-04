import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectCreationForm } from '../components/projects/creation/ProjectCreationForm';
import { projectsService } from '../services/projects';
import { companiesService } from '../services/companies';

// Mock the services
jest.mock('../services/projects', () => ({
  projectsService: {
    getProjectTypes: jest.fn(),
    getGenres: jest.fn(),
    searchProjectMatches: jest.fn(),
  },
}));

jest.mock('../services/companies', () => ({
  companiesService: {
    getCompanyTypes: jest.fn(),
    searchCompanyMatches: jest.fn(),
    getCompany: jest.fn(),
  },
}));

const mockProjectsService = projectsService as jest.Mocked<typeof projectsService>;
const mockCompaniesService = companiesService as jest.Mocked<typeof companiesService>;

describe('ProjectCreationForm Integration', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  const mockProjectTypes = [
    { id: 1, name: 'Фильм', description: 'Полнометражный фильм', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, name: 'Сериал', description: 'Телевизионный сериал', created_at: '2024-01-01T00:00:00Z' },
  ];

  const mockGenres = [
    { id: 1, name: 'Драма', description: 'Драматический жанр', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, name: 'Комедия', description: 'Комедийный жанр', created_at: '2024-01-01T00:00:00Z' },
  ];

  const mockDuplicateProjects = [
    {
      id: 1,
      title: 'Похожий проект',
      project_type: 'Фильм',
      status: 'draft',
      status_display: 'Черновик',
      description: 'Описание похожего проекта',
      genre: 'Драма',
      premiere_date: '2024-12-01',
      director: { id: 1, full_name: 'Иван Петров' },
      production_company: { id: 1, name: 'Мосфильм' },
      created_at: '2024-01-01T00:00:00Z',
      score: 0.85,
      confidence: 'high' as const,
      matched_fields: ['title'],
      field_scores: { title: 0.85 },
    },
  ];

  const mockCompanyMatches = [
    {
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
      is_active: true,
      created_by: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      score: 0.95,
      confidence: 'high' as const,
      matched_fields: ['name'],
      field_scores: { name: 0.95 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectsService.getProjectTypes.mockResolvedValue(mockProjectTypes);
    mockProjectsService.getGenres.mockResolvedValue(mockGenres);
    mockCompaniesService.getCompanyTypes.mockResolvedValue([
      { value: 'production', label: 'Производство' },
      { value: 'distribution', label: 'Дистрибуция' },
    ]);
  });

  it('renders form with all components', async () => {
    // Настраиваем моки перед рендером
    mockProjectsService.getProjectTypes.mockResolvedValue(mockProjectTypes);
    mockProjectsService.getGenres.mockResolvedValue(mockGenres);
    
    render(<ProjectCreationForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Введите название проекта')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Выберите тип проекта')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Выберите жанр')).toBeInTheDocument();
    });

    // Проверяем наличие компонента выбора компании
    expect(screen.getByPlaceholderText('Начните вводить название продакшн-компании...')).toBeInTheDocument();
  });

  it('shows duplicate warning when typing similar project title', async () => {
    // Настраиваем моки перед рендером
    mockProjectsService.getProjectTypes.mockResolvedValue(mockProjectTypes);
    mockProjectsService.getGenres.mockResolvedValue(mockGenres);
    mockProjectsService.searchProjectMatches.mockResolvedValue(mockDuplicateProjects);

    render(<ProjectCreationForm {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Введите название проекта');
    fireEvent.change(titleInput, { target: { value: 'Похожий проект' } });

    await waitFor(() => {
      expect(mockProjectsService.searchProjectMatches).toHaveBeenCalledWith({
        title: 'Похожий проект',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Обнаружены похожие проекты')).toBeInTheDocument();
    });
  });

  it('allows selecting production company', async () => {
    // Настраиваем моки перед рендером
    mockProjectsService.getProjectTypes.mockResolvedValue(mockProjectTypes);
    mockProjectsService.getGenres.mockResolvedValue(mockGenres);
    mockCompaniesService.searchCompanyMatches.mockResolvedValue(mockCompanyMatches);

    render(<ProjectCreationForm {...defaultProps} />);

    const companyInput = screen.getByPlaceholderText('Начните вводить название продакшн-компании...');
    fireEvent.change(companyInput, { target: { value: 'Мосфильм' } });

    await waitFor(() => {
      expect(mockCompaniesService.searchCompanyMatches).toHaveBeenCalledWith({
        name: 'Мосфильм',
        company_type: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
    });

    // Кликаем на найденную компанию
    fireEvent.click(screen.getByText('Мосфильм'));

    // Проверяем, что компания выбрана
    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
      expect(screen.getByText('(Производство)')).toBeInTheDocument();
    });
  });

  it('submits form with production company', async () => {
    // Настраиваем моки перед рендером
    mockProjectsService.getProjectTypes.mockResolvedValue(mockProjectTypes);
    mockProjectsService.getGenres.mockResolvedValue(mockGenres);
    
    render(<ProjectCreationForm {...defaultProps} />);

    // Заполняем обязательные поля
    const titleInput = screen.getByPlaceholderText('Введите название проекта');
    fireEvent.change(titleInput, { target: { value: 'Тестовый проект' } });

    // Ждем загрузки данных и разблокировки селектов
    await waitFor(() => {
      const projectTypeSelect = screen.getAllByRole('combobox')[0];
      expect(projectTypeSelect).not.toBeDisabled();
    });

    // Проверяем, что опции загрузились
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
      expect(screen.getByText('Драма')).toBeInTheDocument();
    });

    // Выбираем тип проекта
    const projectTypeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(projectTypeSelect, { target: { value: '1' } });

    // Выбираем жанр
    const genreSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(genreSelect, { target: { value: '1' } });

    // Выбираем продакшн-компанию
    mockCompaniesService.searchCompanyMatches.mockResolvedValue(mockCompanyMatches);
    const companyInput = screen.getByPlaceholderText('Начните вводить название продакшн-компании...');
    fireEvent.change(companyInput, { target: { value: 'Мосфильм' } });

    await waitFor(() => {
      expect(screen.getByText('Мосфильм')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Мосфильм'));

    // Отправляем форму
    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Тестовый проект',
          project_type: 1,
          genre: 1,
          production_company: 1,
          roles: [],
        })
      );
    });
  });

  it('handles duplicate warning actions', async () => {
    // Настраиваем моки перед рендером
    mockProjectsService.getProjectTypes.mockResolvedValue(mockProjectTypes);
    mockProjectsService.getGenres.mockResolvedValue(mockGenres);
    mockProjectsService.searchProjectMatches.mockResolvedValue(mockDuplicateProjects);

    render(<ProjectCreationForm {...defaultProps} />);

    const titleInput = screen.getByPlaceholderText('Введите название проекта');
    fireEvent.change(titleInput, { target: { value: 'Похожий проект' } });

    await waitFor(() => {
      expect(screen.getByText('Обнаружены похожие проекты')).toBeInTheDocument();
    });

    // Тестируем игнорирование предупреждения
    const ignoreButton = screen.getByText('Создать новый проект');
    fireEvent.click(ignoreButton);

    await waitFor(() => {
      expect(screen.queryByText('Обнаружены похожие проекты')).not.toBeInTheDocument();
    });
  });
});
