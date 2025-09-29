import { authService } from '../auth';
import apiClient from '../api';
import type { User } from '../../types';

// Mock apiClient
jest.mock('../api', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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

      const mockTokenResponse = {
        data: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
      };

      const mockUserResponse = {
        data: mockUser,
      };

      mockApiClient.post.mockResolvedValueOnce(mockTokenResponse);
      mockApiClient.get.mockResolvedValueOnce(mockUserResponse);

      const result = await authService.login({
        username: 'testuser',
        password: 'password',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/token/', {
        username: 'testuser',
        password: 'password',
      });
      expect(mockApiClient.get).toHaveBeenCalledWith('/agents/me/');
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(result).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
        user: mockUser,
      });
    });

    it('should handle login error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Login failed'));

      await expect(
        authService.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should clear tokens from localStorage', () => {
      localStorage.setItem('access_token', 'access-token');
      localStorage.setItem('refresh_token', 'refresh-token');

      authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      localStorage.setItem('refresh_token', 'refresh-token');
      const mockResponse = {
        data: {
          access: 'new-access-token',
        },
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/token/refresh/', {
        refresh: 'refresh-token',
      });
      expect(localStorage.getItem('access_token')).toBe('new-access-token');
      expect(result).toBe('new-access-token');
    });

    it('should throw error when no refresh token', async () => {
      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        date_joined: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: mockUser,
      };

      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/agents/me/');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      // Create an expired token (exp: 0 means expired)
      const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjB9.expired';
      localStorage.setItem('access_token', expiredToken);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when token is valid', () => {
      // Create a valid token (exp: future timestamp)
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
      const payload = btoa(JSON.stringify({ exp: futureTime }));
      const validToken = `${header}.${payload}.signature`;
      localStorage.setItem('access_token', validToken);

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token is malformed', () => {
      localStorage.setItem('access_token', 'invalid-token');

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      localStorage.setItem('access_token', 'access-token');

      expect(authService.getAccessToken()).toBe('access-token');
    });

    it('should return null when no token', () => {
      expect(authService.getAccessToken()).toBeNull();
    });
  });
});
