import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/auth';
import type { User } from '../../types';

// Mock authService
jest.mock('../../services/auth', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component to access context
const TestComponent = () => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
      <div data-testid="user">{user ? user.username : 'no user'}</div>
      <button onClick={() => login('test', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should show loading initially', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getCurrentUser.mockResolvedValue({} as User);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('should load user data when authenticated', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z',
    };

    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
  });

  it('should handle authentication failure', async () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth failed'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should handle login', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z',
    };

    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.login.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
      user: mockUser,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not loading');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });
  });

  it('should handle logout', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      date_joined: '2023-01-01T00:00:00Z',
    };

    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('no user');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
