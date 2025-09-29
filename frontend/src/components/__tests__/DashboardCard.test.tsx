import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardCard from '../DashboardCard';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Test Title',
    description: 'Test Description',
    icon: 'T',
    color: '#3182ce',
    href: '/test'
  };

  it('renders with correct props', () => {
    renderWithRouter(<DashboardCard {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders as a link with correct href', () => {
    renderWithRouter(<DashboardCard {...defaultProps} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies correct color to icon', () => {
    renderWithRouter(<DashboardCard {...defaultProps} />);
    
    const iconElement = screen.getByText('T').parentElement;
    expect(iconElement).toHaveStyle('background-color: #3182ce');
  });

  it('has correct CSS classes', () => {
    renderWithRouter(<DashboardCard {...defaultProps} />);
    
    const card = screen.getByRole('link');
    expect(card).toHaveClass('dashboard-card');
    
    expect(screen.getByText('Test Title')).toHaveClass('dashboard-card-category');
    expect(screen.getByText('Test Description')).toHaveClass('dashboard-card-description');
  });

  it('renders with different colors', () => {
    const { rerender } = renderWithRouter(
      <DashboardCard {...defaultProps} color="#ff0000" />
    );
    
    let iconElement = screen.getByText('T').parentElement;
    expect(iconElement).toHaveStyle('background-color: #ff0000');

    rerender(
      <BrowserRouter>
        <DashboardCard {...defaultProps} color="#00ff00" />
      </BrowserRouter>
    );
    
    iconElement = screen.getByText('T').parentElement;
    expect(iconElement).toHaveStyle('background-color: #00ff00');
  });
});
