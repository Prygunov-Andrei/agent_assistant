import { useState } from 'react';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Хук для работы с localStorage
 * Автоматически синхронизирует состояние с localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Получаем значение из localStorage или используем начальное значение
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      ErrorHandler.logError(`Error reading localStorage key "${key}": ${error}`);
      return initialValue;
    }
  });

  // Функция для обновления значения
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Позволяем value быть функцией, чтобы обновлять состояние на основе предыдущего значения
      const valueToStore = value instanceof Function ? value(storedValue || initialValue) : value;
      
      // Сохраняем состояние
      setStoredValue(valueToStore as T);
      
      // Сохраняем в localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      ErrorHandler.logError(`Error setting localStorage key "${key}": ${error}`);
    }
  };

  return [storedValue || initialValue, setValue];
}

/**
 * Хук для работы с токенами авторизации
 */
export function useAuthTokens() {
  const [accessToken, setAccessToken] = useLocalStorage<string | null>('access_token', null);
  const [refreshToken, setRefreshToken] = useLocalStorage<string | null>('refresh_token', null);

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
  };

  const isAuthenticated = !!accessToken;

  return {
    accessToken,
    refreshToken,
    setTokens,
    clearTokens,
    isAuthenticated,
  };
}
