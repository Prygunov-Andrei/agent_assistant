import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfile from '../UserProfile';
import type { User } from '../../types';

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_active: true,
  date_joined: '2023-01-01T00:00:00Z',
};

const mockUserWithPhoto: User = {
  ...mockUser,
  photo: 'https://example.com/photo.jpg',
};

const mockUserWithFullName: User = {
  ...mockUser,
  full_name: 'Test Full Name',
};

describe('UserProfile', () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with user data', () => {
    render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Выйти')).toBeInTheDocument();
  });

  it('renders with photo when available', () => {
    render(<UserProfile user={mockUserWithPhoto} onLogout={mockOnLogout} />);
    
    const avatar = screen.getByAltText('Фото пользователя');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders placeholder when no photo', () => {
    render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of first_name
  });

  it('uses username initial when no first_name', () => {
    const userWithoutFirstName = { ...mockUser, first_name: '' };
    render(<UserProfile user={userWithoutFirstName} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('t')).toBeInTheDocument(); // First letter of username
  });

  it('uses full_name when available', () => {
    render(<UserProfile user={mockUserWithFullName} onLogout={mockOnLogout} />);
    
    // full_name используется только если нет first_name и last_name
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows username when different from full_name', () => {
    render(<UserProfile user={mockUserWithFullName} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('does not show username when same as full_name', () => {
    const userWithSameNames = { ...mockUser, full_name: 'testuser' };
    render(<UserProfile user={userWithSameNames} onLogout={mockOnLogout} />);
    
    expect(screen.queryByText('@testuser')).not.toBeInTheDocument();
  });

  it('handles logout click', () => {
    render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
    
    const logoutButton = screen.getByText('Выйти');
    fireEvent.click(logoutButton);
    
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('handles image error', () => {
    render(<UserProfile user={mockUserWithPhoto} onLogout={mockOnLogout} />);
    
    const avatar = screen.getByAltText('Фото пользователя');
    fireEvent.error(avatar);
    
    expect(avatar).toHaveStyle('display: none');
  });

  it('renders with null user', () => {
    render(<UserProfile user={null} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
    expect(screen.getByText('А')).toBeInTheDocument(); // Default initial
  });

  it('has correct CSS classes', () => {
    render(<UserProfile user={mockUser} onLogout={mockOnLogout} />);
    
    expect(screen.getByText('Test User').closest('.user-profile')).toHaveClass('user-profile');
    expect(screen.getByText('Test User')).toHaveClass('user-profile-name');
    expect(screen.getByText('@testuser')).toHaveClass('user-profile-username');
    expect(screen.getByText('Выйти')).toHaveClass('btn', 'btn-secondary', 'user-profile-logout');
  });
});
