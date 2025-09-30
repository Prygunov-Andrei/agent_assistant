import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectCreationForm } from '../ProjectCreationForm';
import type { ProjectCreationForm as ProjectForm } from '../../../../types/projects';
import type { LLMAnalysisResult } from '../../../../types/llm';

const mockAnalysisResult: LLMAnalysisResult = {
  project_type: 'Фильм',
  project_type_raw: 'художественный фильм',
  genre: 'Драма',
  description: 'Драматическая история о...',
  roles: [
    {
      title: 'Главный герой',
      description: 'Молодой человек 25-30 лет',
      gender: 'male',
      age_range: { min: 25, max: 30 },
      skills_required: ['Актерское мастерство', 'Драма'],
      suggested_artists: [1, 2, 3],
    },
  ],
  suggested_persons: [],
  suggested_companies: [],
  suggested_projects: [],
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

    expect(screen.getByLabelText('Название проекта *')).toBeInTheDocument();
    expect(screen.getByLabelText('Тип проекта *')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание')).toBeInTheDocument();
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

    expect(screen.getByDisplayValue('Фильм')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Драматическая история о...')).toBeInTheDocument();
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
    expect(screen.getByLabelText('Название проекта *')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Название проекта обязательно')).toBeInTheDocument();
      expect(screen.getByText('Тип проекта обязателен')).toBeInTheDocument();
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

    // Заполняем обязательные поля
    fireEvent.change(screen.getByLabelText('Название проекта *'), {
      target: { value: 'Тестовый проект' }
    });
    fireEvent.change(screen.getByLabelText('Тип проекта *'), {
      target: { value: '1' }
    });

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

  it('adds new role when add role button is clicked', () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    expect(screen.getByText('Роль 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Название роли *')).toBeInTheDocument();
  });

  it('removes role when remove button is clicked', () => {
    render(
      <ProjectCreationForm
        analysisResult={mockAnalysisResult}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Сначала добавляем роль
    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    expect(screen.getByText('Роль 2')).toBeInTheDocument();

    // Удаляем роль
    const removeButton = screen.getByText('Удалить');
    fireEvent.click(removeButton);

    expect(screen.queryByText('Роль 2')).not.toBeInTheDocument();
  });

  it('validates role title', async () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Добавляем роль
    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    // Пытаемся отправить форму без названия роли
    fireEvent.change(screen.getByLabelText('Название проекта *'), {
      target: { value: 'Тестовый проект' }
    });
    fireEvent.change(screen.getByLabelText('Тип проекта *'), {
      target: { value: '1' }
    });

    const submitButton = screen.getByText('Создать проект');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Название роли обязательно')).toBeInTheDocument();
    });
  });

  it('handles role field changes', () => {
    render(
      <ProjectCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Добавляем роль
    const addRoleButton = screen.getByText('Добавить роль');
    fireEvent.click(addRoleButton);

    // Изменяем поля роли
    fireEvent.change(screen.getByLabelText('Название роли *'), {
      target: { value: 'Тестовая роль' }
    });
    fireEvent.change(screen.getByLabelText('Пол'), {
      target: { value: 'male' }
    });
    fireEvent.change(screen.getByLabelText('Описание роли'), {
      target: { value: 'Описание роли' }
    });
    fireEvent.change(screen.getByLabelText('Требуемые навыки'), {
      target: { value: 'Навык 1, Навык 2' }
    });

    expect(screen.getByDisplayValue('Тестовая роль')).toBeInTheDocument();
    expect(screen.getByDisplayValue('male')).toBeInTheDocument();
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

  it('pre-fills form with analysis result data', () => {
    render(
      <ProjectCreationForm
        analysisResult={mockAnalysisResult}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Фильм')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Драматическая история о...')).toBeInTheDocument();
    
    // Проверяем, что роли из анализа добавлены
    expect(screen.getByText('Главный герой')).toBeInTheDocument();
    expect(screen.getByText('Молодой человек 25-30 лет')).toBeInTheDocument();
  });
});
