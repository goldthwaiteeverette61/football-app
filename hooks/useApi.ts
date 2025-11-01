import { useCallback } from 'react';
import { useAsyncState } from './useAsyncState';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * 通用API调用Hook
 * 统一管理API调用的状态和错误处理
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const { onSuccess, onError } = options;
  const asyncState = useAsyncState<T>();

  const call = useCallback(async (apiFunction: () => Promise<ApiResponse<T>>) => {
    await asyncState.execute(async () => {
      const response = await apiFunction();
      
      if (response.success) {
        onSuccess?.(response.data);
        return response.data as T;
      } else {
        const errorMessage = response.message || '请求失败';
        onError?.(errorMessage);
        throw new Error(errorMessage);
      }
    });
  }, [asyncState, onSuccess, onError]);

  return {
    ...asyncState,
    call,
  };
}
