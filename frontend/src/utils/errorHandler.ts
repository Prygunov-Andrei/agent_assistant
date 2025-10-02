import { AxiosError } from 'axios';
import { ERROR_MESSAGES } from '../constants';

/**
 * Универсальная обработка ошибок API
 */
export class ErrorHandler {
  /**
   * Обрабатывает ошибки Axios и возвращает понятное сообщение
   */
  static handleApiError(error: unknown): string {
    if (error instanceof AxiosError) {
      const { response, request, message } = error;

      // Ошибка с ответом от сервера
      if (response) {
        const { status, data } = response;
        
        switch (status) {
          case 400:
            return this.handleValidationError(data);
          case 401:
            return ERROR_MESSAGES.UNAUTHORIZED;
          case 403:
            return ERROR_MESSAGES.FORBIDDEN;
          case 404:
            return ERROR_MESSAGES.NOT_FOUND;
          case 409:
            return ERROR_MESSAGES.DUPLICATE;
          case 500:
            return ERROR_MESSAGES.SERVER_ERROR;
          default:
            return data?.detail || data?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
        }
      }

      // Ошибка сети (нет ответа от сервера)
      if (request) {
        return ERROR_MESSAGES.NETWORK_ERROR;
      }

      // Другие ошибки Axios
      return message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }

    // Обычная ошибка JavaScript
    if (error instanceof Error) {
      return error.message;
    }

    // Неизвестный тип ошибки
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Обрабатывает ошибки валидации
   */
  private static handleValidationError(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    if (data?.detail) {
      return data.detail;
    }

    if (data?.errors) {
      // Форматируем ошибки валидации
      const errorMessages = Object.entries(data.errors)
        .map(([field, errors]) => {
          const errorList = Array.isArray(errors) ? errors.join(', ') : String(errors);
          return `${field}: ${errorList}`;
        })
        .join('; ');
      
      return `${ERROR_MESSAGES.VALIDATION_ERROR} ${errorMessages}`;
    }

    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  /**
   * Логирует ошибку в консоль для отладки
   */
  static logError(error: unknown, context?: string): void {
    const errorMessage = this.handleApiError(error);
    
    console.error(`[${context || 'ErrorHandler'}] ${errorMessage}`, error);
  }

  /**
   * Показывает уведомление об ошибке пользователю
   */
  static showErrorNotification(error: unknown, context?: string): void {
    const errorMessage = this.handleApiError(error);
    this.logError(error, context);
    
    // Здесь можно интегрировать с системой уведомлений
    // Например, toast notifications
    alert(errorMessage);
  }
}

/**
 * Хук для обработки ошибок в компонентах
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    ErrorHandler.showErrorNotification(error, context);
  };

  const logError = (error: unknown, context?: string) => {
    ErrorHandler.logError(error, context);
  };

  return {
    handleError,
    logError,
  };
}
