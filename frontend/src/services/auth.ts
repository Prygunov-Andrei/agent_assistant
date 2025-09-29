import apiClient from './api';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  // Вход в систему
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/token/', credentials);
    const { access, refresh } = response.data;
    
    // Сохраняем токены в localStorage ПЕРЕД запросом пользователя
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Получаем информацию о пользователе
    const userResponse = await apiClient.get('/agents/me/');
    const user = userResponse.data;
    
    return { access, refresh, user };
  },

  // Выход из системы
  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Обновление токена
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/token/refresh/', {
      refresh: refreshToken
    });
    
    const { access } = response.data;
    localStorage.setItem('access_token', access);
    
    return access;
  },

  // Получение текущего пользователя
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/agents/me/');
    return response.data;
  },

  // Проверка авторизации
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    // Проверяем, не истек ли токен
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  // Получение токена доступа
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
};
