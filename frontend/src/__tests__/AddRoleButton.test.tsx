import { render, screen, fireEvent } from '@testing-library/react';
import { AddRoleButton } from '../components/projects/roles/AddRoleButton';

describe('AddRoleButton', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('рендерится с правильным текстом', () => {
    render(<AddRoleButton onClick={mockOnClick} />);

    expect(screen.getByText('Добавить роль')).toBeInTheDocument();
  });

  it('вызывает onClick при клике', () => {
    render(<AddRoleButton onClick={mockOnClick} />);

    const button = screen.getByText('Добавить роль');
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('отключается когда disabled=true', () => {
    render(<AddRoleButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByText('Добавить роль');
    expect(button).toBeDisabled();
  });

  it('применяет правильные классы для размера sm', () => {
    render(<AddRoleButton onClick={mockOnClick} size="sm" />);

    const button = screen.getByText('Добавить роль');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('применяет правильные классы для размера lg', () => {
    render(<AddRoleButton onClick={mockOnClick} size="lg" />);

    const button = screen.getByText('Добавить роль');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('применяет правильные классы для варианта secondary', () => {
    render(<AddRoleButton onClick={mockOnClick} variant="secondary" />);

    const button = screen.getByText('Добавить роль');
    expect(button).toHaveClass('bg-gray-600', 'text-white', 'hover:bg-gray-700');
  });

  it('применяет правильные классы для варианта outline', () => {
    render(<AddRoleButton onClick={mockOnClick} variant="outline" />);

    const button = screen.getByText('Добавить роль');
    expect(button).toHaveClass('border', 'border-blue-600', 'text-blue-600');
  });

  it('применяет дополнительные классы из className', () => {
    render(<AddRoleButton onClick={mockOnClick} className="custom-class" />);

    const button = screen.getByText('Добавить роль');
    expect(button).toHaveClass('custom-class');
  });

  it('содержит иконку плюса', () => {
    render(<AddRoleButton onClick={mockOnClick} />);

    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
