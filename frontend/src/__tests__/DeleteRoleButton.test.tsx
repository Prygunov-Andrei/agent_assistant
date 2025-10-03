import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteRoleButton } from '../components/projects/roles/DeleteRoleButton';

describe('DeleteRoleButton', () => {
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('рендерится с иконкой корзины', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} />);

    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('показывает подтверждение при первом клике', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} roleName="Главный герой" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Удалить "Главный герой"?')).toBeInTheDocument();
    expect(screen.getByText('Да')).toBeInTheDocument();
    expect(screen.getByText('Нет')).toBeInTheDocument();
  });

  it('вызывает onConfirm при подтверждении', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const confirmButton = screen.getByText('Да');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('скрывает подтверждение при отмене', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const cancelButton = screen.getByText('Нет');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Да')).not.toBeInTheDocument();
    expect(screen.queryByText('Нет')).not.toBeInTheDocument();
  });

  it('автоматически скрывает подтверждение через 3 секунды', async () => {
    jest.useFakeTimers();
    
    render(<DeleteRoleButton onConfirm={mockOnConfirm} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Да')).toBeInTheDocument();

    // Ускоряем время на 3 секунды
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Да')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('отключается когда disabled=true', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('применяет правильные классы для размера sm', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} size="sm" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('применяет правильные классы для размера lg', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} size="lg" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('применяет правильные классы для варианта outline-danger', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} variant="outline-danger" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-red-600', 'text-red-600');
  });

  it('показывает только иконку для размера sm', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} size="sm" />);

    expect(screen.queryByText('Удалить')).not.toBeInTheDocument();
  });

  it('показывает текст "Удалить" для размеров md и lg', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} size="md" />);

    expect(screen.getByText('Удалить')).toBeInTheDocument();
  });

  it('показывает правильный title с именем роли', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} roleName="Главный герой" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Удалить роль "Главный герой"');
  });

  it('показывает общий title без имени роли', () => {
    render(<DeleteRoleButton onConfirm={mockOnConfirm} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Удалить роль');
  });
});
