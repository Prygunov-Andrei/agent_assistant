import { useState, useEffect } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Универсальный хук для работы с API
 * Устраняет дублирование логики useState/useEffect в компонентах
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => void } {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка';
      setState({ data: null, loading: false, error: errorMessage });
      onError?.(error);
    }
  };

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Хук для работы с формами и API
 */
export function useFormApi<T, R>(
  apiCall: (data: T) => Promise<R>,
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<UseApiState<R>>({
    data: null,
    loading: false,
    error: null,
  });

  const submit = async (data: T) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall(data);
      setState({ data: result, loading: false, error: null });
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка';
      setState({ data: null, loading: false, error: errorMessage });
      options.onError?.(error);
      throw error;
    }
  };

  return {
    ...state,
    submit,
  };
}
