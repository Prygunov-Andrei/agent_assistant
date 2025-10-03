// Тесты для authService

// Mock apiClient
const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: mockPost,
    get: mockGet,
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

import { authService } from '../services/auth';
import type { User } from '../types';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        date_joined: '2023-01-01T00:00:00Z',
      };


      mockPost.mockResolvedValueOnce({ data: { access: 'access-token', refresh: 'refresh-token' } });
      mockGet.mockResolvedValueOnce({ data: mockUser });

      const result = await authService.login({
        username: 'testuser',
        password: 'password',
      });

      expect(mockPost).toHaveBeenCalledWith('/token/', {
        username: 'testuser',
        password: 'password',
      });

      expect(mockGet).toHaveBeenCalledWith('/agents/me/');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(result).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
        user: mockUser,
      });
    });

    it('should handle login error', async () => {
      mockPost.mockRejectedValueOnce(new Error('Login failed'));

      await expect(
        authService.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Login failed');
    });

    it('should handle invalid credentials', async () => {
      const error = new Error('Request failed with status code 401');
      (error as any).response = { status: 401, data: { detail: 'Invalid credentials' } };
      mockPost.mockRejectedValueOnce(error);

      await expect(
        authService.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear tokens from localStorage', () => {
      localStorageMock.setItem('access_token', 'access-token');
      localStorageMock.setItem('refresh_token', 'refresh-token');

      authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      localStorageMock.getItem.mockReturnValue('refresh-token');

      mockPost.mockResolvedValueOnce({
        data: { access: 'new-access-token' }
      });

      const result = await authService.refreshToken();

      expect(mockPost).toHaveBeenCalledWith('/token/refresh/', {
        refresh: 'refresh-token',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(result).toBe('new-access-token');
    });

    it('should throw error when no refresh token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('should handle refresh token error', async () => {
      localStorageMock.getItem.mockReturnValue('refresh-token');

      const error = new Error('Request failed with status code 401');
      (error as any).response = { status: 401, data: { detail: 'Token is invalid or expired' } };
      mockPost.mockRejectedValueOnce(error);

      await expect(authService.refreshToken()).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        date_joined: '2023-01-01T00:00:00Z',
      };

      mockGet.mockResolvedValueOnce({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockGet).toHaveBeenCalledWith('/agents/me/');
      expect(result).toEqual(mockUser);
    });

    it('should handle getCurrentUser error', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');

      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Network error');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE2MDAwMDAwMDB9.expired';
      localStorageMock.getItem.mockReturnValue(expiredToken);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when token is valid', () => {
      const validToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjQwMDAwMDAwMDB9.valid';
      localStorageMock.getItem.mockReturnValue(validToken);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token is malformed', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('access-token');
      expect(authService.getAccessToken()).toBe('access-token');
    });

    it('should return null when no token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(authService.getAccessToken()).toBeNull();
    });
  });
});