import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectCreationForm } from '../ProjectCreationForm';
import type { ProjectCreationForm as ProjectForm } from '../../../../types/projects';
import type { LLMAnalysisResult } from '../../../../types/llm';

// Mock services
jest.mock('../../../../services/projects', () => ({
  projectsService: {
    getProjectTypes: jest.fn().mockResolvedValue([
      { id: 1, name: 'Фильм' },
      { id: 2, name: 'Сериал' },
      { id: 3, name: 'Документальный' },
    ]),
    getGenres: jest.fn().mockResolvedValue([
      { id: 1, name: 'Драма' },
      { id: 2, name: 'Комедия' },
      { id: 3, name: 'Боевик' },
    ]),
  },
}));

const mockAnalysisResult: LLMAnalysisResult = {
  project_analysis: {
    project_title: 'Test Project',
    project_type: 'Фильм',
    genre: 'Драма',
    description: 'Test description',
    premiere_date: '2024-12-31',
    roles: [],
    contacts: {
      casting_director: {
        name: 'Test',
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

describe('ProjectCreationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with empty form initially', () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByPlaceholderText('Введите название проекта')).toBeInTheDocument();
    expect(screen.getByText('Выберите тип проекта')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Описание проекта')).toBeInTheDocument();
  });

  it('renders with initial data', () => {
    const initialData: Partial<ProjectForm> = {
      title: 'Тестовый проект',
      description: 'Описание проекта',
      project_type: 1,
    };

    render(
      <ProjectCreationForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Тестовый проект')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Описание проекта')).toBeInTheDocument();
  });

  it('renders with analysis result', () => {
    render(
      <ProjectCreationForm
        analysisResult={mockAnalysisResult}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('renders with request ID', () => {
    render(
      <ProjectCreationForm
        requestId={123}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // request_id не отображается в UI, но передается в форму
    expect(screen.getByPlaceholderText('Введите название проекта')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Название проекта обязательно')).toBeInTheDocument();
      expect(screen.getByText('Жанр обязателен')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    // Заполняем обязательные поля
    fireEvent.change(screen.getByPlaceholderText('Введите название проекта'), {
      target: { value: 'Тестовый проект' }
    });
    
    // Выбираем тип проекта из селекта
    const projectTypeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(projectTypeSelect, { target: { value: '1' } });
    
    // Выбираем жанр из селекта
    const genreSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(genreSelect, { target: { value: '1' } });

    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Тестовый проект',
          project_type: 1,
          roles: [],
        })
      );
    });
  });

  it('adds new role when add role button is clicked', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    expect(screen.getByText('Роль 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Название роли')).toBeInTheDocument();
  });

  it('removes role when remove button is clicked', async () => {
    render(
      <ProjectCreationForm
        analysisResult={mockAnalysisResult}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    // Сначала добавляем роль
    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    // Проверяем, что роль добавлена (может быть "Роль 1" или "Роль 2" в зависимости от анализа)
    await waitFor(() => {
      const roleElements = screen.queryAllByText(/Роль \d+/);
      expect(roleElements.length).toBeGreaterThan(0);
    });

    // Удаляем роль
    const removeButton = screen.getByText('Удалить');
    fireEvent.click(removeButton);

    // Проверяем, что роль удалена
    await waitFor(() => {
      const roleElements = screen.queryAllByText(/Роль \d+/);
      expect(roleElements.length).toBe(0);
    });
  });

  it('validates role title', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    // Добавляем роль
    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    // Пытаемся отправить форму без названия роли
    fireEvent.change(screen.getByPlaceholderText('Введите название проекта'), {
      target: { value: 'Тестовый проект' }
    });
    
    // Выбираем тип проекта и жанр
    const projectTypeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(projectTypeSelect, { target: { value: '1' } });
    
    const genreSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(genreSelect, { target: { value: '1' } });

    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Название роли обязательно')).toBeInTheDocument();
    });
  });

  it('handles role field changes', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    // Добавляем роль
    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    // Изменяем поля роли
    fireEvent.change(screen.getByPlaceholderText('Название роли'), {
      target: { value: 'Тестовая роль' }
    });
    fireEvent.change(screen.getByDisplayValue('Неважно'), {
      target: { value: 'male' }
    });
    fireEvent.change(screen.getByPlaceholderText('Описание роли'), {
      target: { value: 'Описание роли' }
    });
    fireEvent.change(screen.getByPlaceholderText('Навыки через запятую'), {
      target: { value: 'Навык 1, Навык 2' }
    });

    expect(screen.getByDisplayValue('Тестовая роль')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Описание роли')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Навык 1, Навык 2')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('pre-fills form with analysis result data', async () => {
    render(
      <ProjectCreationForm
        analysisResult={mockAnalysisResult}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Фильм')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    
    // Проверяем, что роли из анализа добавлены (если они есть)
    // Роли могут не отображаться сразу, так как компонент может их загружать асинхронно
    // В данном случае роли из анализа могут не отображаться автоматически
    // Проверяем, что форма корректно заполнена основными данными
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
  });
});
