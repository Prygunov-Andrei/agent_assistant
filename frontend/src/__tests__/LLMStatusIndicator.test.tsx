import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LLMStatusIndicator from '../components/llm/LLMStatusIndicator';

describe('LLMStatusIndicator', () => {
  describe('AnalysisStatus', () => {
    it('renders new status correctly', () => {
      render(<LLMStatusIndicator status="idle" />);
      
      expect(screen.getByText('🤖')).toBeInTheDocument();
      expect(screen.getByText('Готов к анализу')).toBeInTheDocument();
    });

    it('renders analyzed status correctly', () => {
      render(<LLMStatusIndicator status="success" />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Анализ завершен')).toBeInTheDocument();
    });

    it('renders processed status correctly', () => {
      render(<LLMStatusIndicator status="success" />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Анализ завершен')).toBeInTheDocument();
    });

    it('renders with loading state', () => {
      render(<LLMStatusIndicator status="analyzing" />);
      
      expect(screen.getByText('Анализируем запрос...')).toBeInTheDocument();
    });
  });

  describe('LLMStatus', () => {
    it('renders idle status correctly', () => {
      render(<LLMStatusIndicator status="idle" />);
      
      expect(screen.getByText('🤖')).toBeInTheDocument();
      expect(screen.getByText('Готов к анализу')).toBeInTheDocument();
    });

    it('renders analyzing status correctly', () => {
      render(<LLMStatusIndicator status="analyzing" />);
      
      expect(screen.getByText('Анализируем запрос...')).toBeInTheDocument();
    });

    it('renders success status correctly', () => {
      render(<LLMStatusIndicator status="success" />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Анализ завершен')).toBeInTheDocument();
    });

    it('renders error status correctly', () => {
      render(<LLMStatusIndicator status="error" />);
      
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Ошибка анализа')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<LLMStatusIndicator status="idle" className="custom-class" />);
    
    const indicator = screen.getByText('Готов к анализу').closest('div');
    expect(indicator).toHaveClass('custom-class');
  });
});

describe('LLMStatusIndicatorWithAnimation', () => {
  it('renders with animation when loading', () => {
    render(<LLMStatusIndicator status="analyzing" />);
    
    expect(screen.getByText('Анализируем запрос...')).toBeInTheDocument();
  });

  it('renders without animation when not loading', () => {
    render(<LLMStatusIndicator status="idle" />);
    
    expect(screen.getByText('Готов к анализу')).toBeInTheDocument();
    expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
  });
});
