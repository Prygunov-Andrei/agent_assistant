import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Пожалуйста, подождите..." />);
    
    expect(screen.getByText('Пожалуйста, подождите...')).toBeInTheDocument();
  });

  it('renders without text when text is empty', () => {
    render(<LoadingSpinner text="" />);
    
    expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner-sm');

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner-md');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner-lg');
  });

  it('applies correct text size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" text="Loading" />);
    expect(screen.getByText('Loading')).toHaveClass('loading-text-sm');

    rerender(<LoadingSpinner size="md" text="Loading" />);
    expect(screen.getByText('Loading')).toHaveClass('loading-text-md');

    rerender(<LoadingSpinner size="lg" text="Loading" />);
    expect(screen.getByText('Loading')).toHaveClass('loading-text-lg');
  });
});
