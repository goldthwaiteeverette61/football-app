/**
 * 错误处理Hook
 * 提供便捷的错误处理、重试和恢复功能
 */

import { ErrorInfo, errorService, ErrorSeverity, ErrorType, RecoveryStrategy } from '@/services/errorService';
import { useCallback, useRef, useState } from 'react';

interface UseErrorHandlingOptions {
  onError?: (error: ErrorInfo) => void;
  onRetry?: () => Promise<void>;
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
}

interface UseErrorHandlingReturn {
  error: ErrorInfo | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: Error | ErrorInfo, context?: any) => Promise<void>;
  handleApiError: (error: any, context?: any) => Promise<void>;
  handleNetworkError: (error: Error, context?: any) => Promise<void>;
  handleValidationError: (message: string, details?: any, context?: any) => Promise<void>;
  handleImageError: (error: Error, context?: any, fallbackAction?: () => void) => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}): UseErrorHandlingReturn {
  const {
    onError,
    onRetry,
    maxRetries = 3,
    retryDelay = 1000,
    autoRetry = false,
  } = options;

  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 处理错误
  const handleError = useCallback(async (error: Error | ErrorInfo, context?: any): Promise<void> => {
    let errorInfo: ErrorInfo;

    if ('type' in error) {
      // 已经是ErrorInfo类型
      errorInfo = error;
    } else {
      // 是Error类型，需要转换
      errorInfo = errorService.createError(
        ErrorType.UNKNOWN,
        error.message || '未知错误',
        {
          severity: ErrorSeverity.MEDIUM,
          stack: error.stack,
          context,
        }
      );
    }

    setError(errorInfo);
    onError?.(errorInfo);

    // 自动重试
    if (autoRetry && retryCount < maxRetries) {
      await retry();
    }
  }, [onError, autoRetry, retryCount, maxRetries]);

  // 处理API错误
  const handleApiError = useCallback(async (error: any, context?: any): Promise<void> => {
    await errorService.handleApiError(error, context);
    
    const errorInfo = errorService.createError(
      ErrorType.API,
      error.message || 'API请求失败',
      {
        severity: errorService.getApiErrorSeverity?.(error.code) || ErrorSeverity.MEDIUM,
        code: error.code,
        details: error.details,
        context,
        recovery: errorService.getApiErrorRecovery?.(error.code),
      }
    );

    setError(errorInfo);
    onError?.(errorInfo);
  }, [onError]);

  // 处理网络错误
  const handleNetworkError = useCallback(async (error: Error, context?: any): Promise<void> => {
    await errorService.handleNetworkError(error, context);
    
    const errorInfo = errorService.createError(
      ErrorType.NETWORK,
      error.message || '网络连接失败',
      {
        severity: ErrorSeverity.MEDIUM,
        context,
        recovery: {
          strategy: RecoveryStrategy.RETRY,
          maxRetries,
          retryDelay,
        },
      }
    );

    setError(errorInfo);
    onError?.(errorInfo);
  }, [onError, maxRetries, retryDelay]);

  // 处理验证错误
  const handleValidationError = useCallback(async (message: string, details?: any, context?: any): Promise<void> => {
    await errorService.handleValidationError(message, details, context);
    
    const errorInfo = errorService.createError(
      ErrorType.VALIDATION,
      message,
      {
        severity: ErrorSeverity.LOW,
        details,
        context,
      }
    );

    setError(errorInfo);
    onError?.(errorInfo);
  }, [onError]);

  // 处理图片错误
  const handleImageError = useCallback(async (error: Error, context?: any, fallbackAction?: () => void): Promise<void> => {
    await errorService.handleImageError(error, context, fallbackAction);
    
    const errorInfo = errorService.createError(
      ErrorType.IMAGE,
      error.message || '图片加载失败',
      {
        severity: ErrorSeverity.LOW,
        context,
        recovery: {
          strategy: RecoveryStrategy.FALLBACK,
          fallbackAction,
        },
      }
    );

    setError(errorInfo);
    onError?.(errorInfo);
  }, [onError]);

  // 重试
  const retry = useCallback(async (): Promise<void> => {
    if (isRetrying || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      if (onRetry) {
        await onRetry();
      }
      
      // 清除错误
      setError(null);
    } catch (retryError) {
      // 重试失败，保持错误状态
      console.error('重试失败:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, maxRetries, onRetry]);

  // 清除错误
  const clearError = useCallback((): void => {
    setError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // 重置状态
  const reset = useCallback((): void => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleImageError,
    retry,
    clearError,
    reset,
  };
}

// 异步操作错误处理Hook
interface UseAsyncErrorHandlingOptions extends UseErrorHandlingOptions {
  onSuccess?: (result: any) => void;
}

interface UseAsyncErrorHandlingReturn extends UseErrorHandlingReturn {
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  isLoading: boolean;
}

export function useAsyncErrorHandling(options: UseAsyncErrorHandlingOptions = {}): UseAsyncErrorHandlingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const errorHandling = useErrorHandling(options);

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    errorHandling.clearError();

    try {
      const result = await asyncFn();
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      await errorHandling.handleError(error as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [errorHandling, options]);

  return {
    ...errorHandling,
    execute,
    isLoading,
  };
}

// 表单错误处理Hook
interface UseFormErrorHandlingOptions {
  onValidationError?: (field: string, message: string) => void;
  onSubmitError?: (error: ErrorInfo) => void;
}

interface UseFormErrorHandlingReturn {
  fieldErrors: Record<string, string>;
  submitError: ErrorInfo | null;
  setFieldError: (field: string, message: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  handleSubmitError: (error: ErrorInfo) => void;
}

export function useFormErrorHandling(options: UseFormErrorHandlingOptions = {}): UseFormErrorHandlingReturn {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<ErrorInfo | null>(null);

  const setFieldError = useCallback((field: string, message: string): void => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
    options.onValidationError?.(field, message);
  }, [options]);

  const clearFieldError = useCallback((field: string): void => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback((): void => {
    setFieldErrors({});
    setSubmitError(null);
  }, []);

  const handleSubmitError = useCallback((error: ErrorInfo): void => {
    setSubmitError(error);
    options.onSubmitError?.(error);
  }, [options]);

  return {
    fieldErrors,
    submitError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleSubmitError,
  };
}

export default useErrorHandling;
