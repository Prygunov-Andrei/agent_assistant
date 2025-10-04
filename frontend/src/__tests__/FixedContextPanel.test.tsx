import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FixedContextPanel from '../components/layout/FixedContextPanel';

describe('FixedContextPanel', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn(),
  };

  it('renders when visible', () => {
    render(<FixedContextPanel {...defaultProps} />);
    
    expect(screen.getByText('Контекст запроса')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<FixedContextPanel {...defaultProps} isVisible={false} />);
    
    expect(screen.queryByText('Контекст запроса')).not.toBeInTheDocument();
  });

  it('displays request text when provided', () => {
    const requestText = 'Тестовый текст запроса';
    render(<FixedContextPanel {...defaultProps} requestText={requestText} />);
    
    expect(screen.getByText(requestText)).toBeInTheDocument();
  });

  it('displays request ID when provided', () => {
    const requestId = 123;
    render(<FixedContextPanel {...defaultProps} requestId={requestId} requestText="Тестовый текст" />);
    
    expect(screen.getByText('#123')).toBeInTheDocument();
  });

  it('shows placeholder when no request text', () => {
    render(<FixedContextPanel {...defaultProps} />);
    
    expect(screen.getByText('Выберите запрос для отображения контекста')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<FixedContextPanel {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Закрыть панель');
    closeButton.click();
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
