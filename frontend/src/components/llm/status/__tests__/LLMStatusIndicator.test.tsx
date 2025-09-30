import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LLMStatusIndicator, LLMStatusIndicatorWithAnimation } from '../LLMStatusIndicator';
import type { AnalysisStatus, LLMStatus } from '../../../../types/llm';

describe('LLMStatusIndicator', () => {
  describe('AnalysisStatus', () => {
    it('renders new status correctly', () => {
      render(<LLMStatusIndicator status="new" />);
      
      expect(screen.getByText('📝')).toBeInTheDocument();
      expect(screen.getByText('Новый')).toBeInTheDocument();
    });

    it('renders analyzed status correctly', () => {
      render(<LLMStatusIndicator status="analyzed" />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Проанализирован')).toBeInTheDocument();
    });

    it('renders processed status correctly', () => {
      render(<LLMStatusIndicator status="processed" />);
      
      expect(screen.getByText('🔧')).toBeInTheDocument();
      expect(screen.getByText('Обработан')).toBeInTheDocument();
    });

    it('renders with loading state', () => {
      render(<LLMStatusIndicator status="new" isLoading={true} />);
      
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Анализ...')).toBeInTheDocument();
    });
  });

  describe('LLMStatus', () => {
    it('renders available status correctly', () => {
      const status: LLMStatus = {
        is_available: true,
        is_analyzing: false,
        error_count: 0,
        success_count: 10,
      };
      
      render(<LLMStatusIndicator status={status} />);
      
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Доступен')).toBeInTheDocument();
    });

    it('renders analyzing status correctly', () => {
      const status: LLMStatus = {
        is_available: true,
        is_analyzing: true,
        error_count: 0,
        success_count: 10,
      };
      
      render(<LLMStatusIndicator status={status} />);
      
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Анализ...')).toBeInTheDocument();
    });

    it('renders unavailable status correctly', () => {
      const status: LLMStatus = {
        is_available: false,
        is_analyzing: false,
        error_count: 5,
        success_count: 10,
      };
      
      render(<LLMStatusIndicator status={status} />);
      
      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Недоступен')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<LLMStatusIndicator status="new" className="custom-class" />);
    
    const indicator = screen.getByText('Новый').closest('div');
    expect(indicator).toHaveClass('custom-class');
  });
});

describe('LLMStatusIndicatorWithAnimation', () => {
  it('renders with animation when loading', () => {
    render(<LLMStatusIndicatorWithAnimation status="new" isLoading={true} />);
    
    expect(screen.getByText('Анализ...')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders without animation when not loading', () => {
    render(<LLMStatusIndicatorWithAnimation status="new" isLoading={false} />);
    
    expect(screen.getByText('Новый')).toBeInTheDocument();
    expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
  });
});
