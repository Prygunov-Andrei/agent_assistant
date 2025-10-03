import { render, screen, fireEvent } from '@testing-library/react';
import { RoleTabs } from '../components/projects/roles/RoleTabs';
import type { ProjectRoleForm } from '../types/projects';

describe('RoleTabs', () => {
  const mockOnRoleChange = jest.fn();
  const mockOnRoleAdd = jest.fn();
  const mockOnRoleRemove = jest.fn();
  const mockOnRoleEdit = jest.fn();
  const mockOnEditCancel = jest.fn();
  const mockOnEditSave = jest.fn();

  const mockRoles: ProjectRoleForm[] = [
    {
      name: 'Главный герой',
      description: 'Описание главного героя',
      media_presence: 'yes',
      skills_required: ['актерское мастерство'],
      suggested_artists: [1, 2],
    },
    {
      name: 'Второстепенная роль',
      description: 'Описание второстепенной роли',
      media_presence: 'no',
      skills_required: ['танцы'],
      suggested_artists: [3],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('показывает сообщение когда ролей нет', () => {
    render(
      <RoleTabs
        roles={[]}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    expect(screen.getByText('Роли в проекте не добавлены')).toBeInTheDocument();
    expect(screen.getByText('Добавить первую роль')).toBeInTheDocument();
  });

  it('отображает вкладки для каждой роли', () => {
    render(
      <RoleTabs
        roles={mockRoles}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    expect(screen.getAllByText('Главный герой')).toHaveLength(2); // в табе и в заголовке
    expect(screen.getByText('Второстепенная роль')).toBeInTheDocument();
  });

  it('переключается между вкладками', () => {
    render(
      <RoleTabs
        roles={mockRoles}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    // Первая роль активна по умолчанию
    expect(screen.getByText('Описание главного героя')).toBeInTheDocument();

    // Переключаемся на вторую роль
    fireEvent.click(screen.getByText('Второстепенная роль'));
    expect(screen.getByText('Описание второстепенной роли')).toBeInTheDocument();
  });

  it('вызывает onRoleAdd при добавлении роли', () => {
    render(
      <RoleTabs
        roles={mockRoles}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    const addButton = screen.getByTitle('Добавить роль');
    fireEvent.click(addButton);

    expect(mockOnRoleAdd).toHaveBeenCalled();
  });

  it('вызывает onRoleEdit при редактировании роли', () => {
    render(
      <RoleTabs
        roles={mockRoles}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    const editButton = screen.getByText('Редактировать');
    fireEvent.click(editButton);

    expect(mockOnRoleEdit).toHaveBeenCalledWith(0);
  });

  it('показывает режим редактирования', () => {
    render(
      <RoleTabs
        roles={mockRoles}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        editingRoleIndex={0}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    expect(screen.getByText('Редактирование роли')).toBeInTheDocument();
    expect(screen.getByText('(редактирование)')).toBeInTheDocument();
  });

  it('отображает информацию о роли', () => {
    render(
      <RoleTabs
        roles={mockRoles}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    expect(screen.getByText('Да')).toBeInTheDocument(); // media_presence
    expect(screen.getByText('актерское мастерство')).toBeInTheDocument(); // skills_required
    expect(screen.getByText('2 артистов')).toBeInTheDocument(); // suggested_artists count
  });

  it('показывает "Не указано" для пустых полей', () => {
    const rolesWithEmptyFields: ProjectRoleForm[] = [
      {
        name: 'Роль без описания',
        skills_required: [],
        suggested_artists: [],
      },
    ];

    render(
      <RoleTabs
        roles={rolesWithEmptyFields}
        onRoleChange={mockOnRoleChange}
        onRoleAdd={mockOnRoleAdd}
        onRoleRemove={mockOnRoleRemove}
        onRoleEdit={mockOnRoleEdit}
        onEditCancel={mockOnEditCancel}
        onEditSave={mockOnEditSave}
      />
    );

    expect(screen.getAllByText('Не указано')).toHaveLength(4); // clothing_size, hairstyle, hair_color, height
    expect(screen.getByText('Не выбрано')).toBeInTheDocument(); // suggested_artists
  });
});
