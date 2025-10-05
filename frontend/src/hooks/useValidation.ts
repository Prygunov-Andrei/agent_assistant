import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationErrors {
  [key: string]: string[];
}

export interface UseValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export const useValidation = (
  initialValues: Record<string, any>,
  validationRules: Record<string, ValidationRule>,
  options: UseValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback((fieldName: string, value: any): string[] => {
    const rules = validationRules[fieldName];
    if (!rules) return [];

    const fieldErrors: string[] = [];

    // Проверка обязательности
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      fieldErrors.push('Это поле обязательно для заполнения');
    }

    // Проверка минимальной длины
    if (rules.minLength && value && value.length < rules.minLength) {
      fieldErrors.push(`Минимальная длина: ${rules.minLength} символов`);
    }

    // Проверка максимальной длины
    if (rules.maxLength && value && value.length > rules.maxLength) {
      fieldErrors.push(`Максимальная длина: ${rules.maxLength} символов`);
    }

    // Проверка паттерна
    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push('Неверный формат данных');
    }

    // Кастомная валидация
    if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    return fieldErrors;
  }, [validationRules]);

  const validateAll = useCallback((): ValidationErrors => {
    const allErrors: ValidationErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, values[fieldName]);
      if (fieldErrors.length > 0) {
        allErrors[fieldName] = fieldErrors;
      }
    });

    return allErrors;
  }, [values, validateField, validationRules]);

  const debouncedValidate = useCallback(
    (() => {
      let timeoutId: number;
      return (fieldName: string, value: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const fieldErrors = validateField(fieldName, value);
          setErrors(prev => ({
            ...prev,
            [fieldName]: fieldErrors
          }));
          setIsValidating(false);
        }, debounceMs);
      };
    })(),
    [validateField, debounceMs]
  );

  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    if (validateOnChange) {
      setIsValidating(true);
      debouncedValidate(fieldName, value);
    }
  }, [validateOnChange, debouncedValidate]);

  const handleBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    if (validateOnBlur) {
      const fieldErrors = validateField(fieldName, values[fieldName]);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors
      }));
    }
  }, [validateOnBlur, validateField, values]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    handleChange(fieldName, value);
  }, [handleChange]);

  const setFieldError = useCallback((fieldName: string, errorMessages: string[]) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessages
    }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0 && !isValidating;
  const hasErrors = Object.keys(errors).length > 0;

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    hasErrors,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validateAll,
    reset
  };
};
