import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectRoleForm } from '../ProjectRoleForm';
import type { ProjectRoleForm as ProjectRoleFormType } from '../../../../types/projects';

// Mock сервиса
jest.mock('../../../../services/projectRoles', () => ({
  projectRolesService: {
    getRoleTypes: jest.fn().mockResolvedValue([
      { id: 1, name: 'Актер', description: 'Актерская роль' },
      { id: 2, name: 'Актриса', description: 'Актерская роль' },
    ]),
  },
}));

describe('ProjectRoleForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('рендерится с пустой формой', () => {
    render(
      <ProjectRoleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Название роли *')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание роли')).toBeInTheDocument();
    expect(screen.getByLabelText('Медийность')).toBeInTheDocument();
  });

  it('загружает типы ролей при монтировании', async () => {
    render(
      <ProjectRoleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Актер')).toBeInTheDocument();
      expect(screen.getByText('Актриса')).toBeInTheDocument();
    });
  });

  it('заполняет форму начальными данными', () => {
    const initialData: Partial<ProjectRoleFormType> = {
      name: 'Главный герой',
      description: 'Описание роли',
      media_presence: 'yes',
    };

    render(
      <ProjectRoleForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Главный герой')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Описание роли')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Медийность' })).toHaveValue('yes');
  });

  it('валидирует обязательные поля', async () => {
    render(
      <ProjectRoleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Создать роль');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Название роли обязательно')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('отправляет данные при валидной форме', async () => {
    render(
      <ProjectRoleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Заполняем обязательное поле
    const nameInput = screen.getByLabelText('Название роли *');
    fireEvent.change(nameInput, { target: { value: 'Главный герой' } });

    // Отправляем форму
    const submitButton = screen.getByText('Создать роль');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Главный герой',
          skills_required: [],
          suggested_artists: [],
        })
      );
    });
  });

  it('обрабатывает изменение навыков', () => {
    render(
      <ProjectRoleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const skillsInput = screen.getByLabelText('Требуемые навыки');
    fireEvent.change(skillsInput, { target: { value: 'актерское мастерство, танцы' } });

    const nameInput = screen.getByLabelText('Название роли *');
    fireEvent.change(nameInput, { target: { value: 'Главный герой' } });

    const submitButton = screen.getByText('Создать роль');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        skills_required: ['актерское мастерство', 'танцы'],
      })
    );
  });

  it('вызывает onCancel при нажатии кнопки отмены', () => {
    render(
      <ProjectRoleForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('показывает правильный текст кнопки для редактирования', () => {
    render(
      <ProjectRoleForm
        isEditing={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Сохранить изменения')).toBeInTheDocument();
  });
});
